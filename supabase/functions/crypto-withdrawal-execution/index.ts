import { Connection, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { Turnkey } from "@turnkey/sdk-server";
import * as bitcoin from "bitcoinjs-lib";
import { Buffer } from "node:buffer";
import { Interface, isAddress, parseUnits } from "ethers";
import * as xrpl from "xrpl";
import { alchemyEthereumRpcUrl } from "../_shared/alchemy.ts";
import { createSupabaseClient } from "../_shared/supabase.ts";

type Asset = "BTC" | "ETH" | "USDT" | "SOL" | "XRP";
type Network = "bitcoin-mainnet" | "ethereum-mainnet" | "solana-mainnet" | "xrpl-mainnet";
type Withdrawal = {
  id: string;
  user_id: string;
  wallet_id: string;
  asset: Asset;
  network: Network;
  destination_address: string;
  destination_tag: number | null;
  amount: string;
  usd_value: string;
  network_fee: string;
  network_fee_usd: string;
  transaction_hash: string | null;
  turnkey_status_id: string | null;
  status: string;
  confirmations: number;
  required_confirmations: number | null;
  execution_attempts: number;
};
type Wallet = {
  id: string;
  address: string;
  turnkey_wallet_id: string;
  turnkey_account_id: string;
};
type Utxo = { txid: string; vout: number; value: number; status: { confirmed: boolean } };
type FeeQuote = {
  fee: string;
  feeUsd: string;
  eth?: {
    gasLimit: bigint;
    maxFeePerGas: bigint;
    maxPriorityFeePerGas: bigint;
    data: string;
    to: string;
    value: bigint;
  };
  bitcoin?: { utxos: Utxo[]; feeRate: number; amount: bigint };
  solana?: { transaction: Transaction; feeLamports: bigint };
  xrpl?: { feeDrops: bigint; sequence: number; lastLedgerSequence: number };
};

const TOKEN = new Interface(["function transfer(address to, uint256 amount)"]);
const USD_SCALE = 2;
const MAX_RPC_BODY_BYTES = 64 * 1024;
const REQUIRED_CONFIRMATION_DEFAULTS: Record<Network, number> = {
  "bitcoin-mainnet": 6,
  "ethereum-mainnet": 12,
  "solana-mainnet": 32,
  "xrpl-mainnet": 1,
};

function json(body: unknown, status = 200): Response {
  return Response.json(body, {
    status,
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "authorization, apikey, content-type",
      "access-control-allow-methods": "POST, OPTIONS",
    },
  });
}

function requiredEnv(name: string): string {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error(`Missing Edge Function secret: ${name}`);
  return value;
}

function secureUrl(name: string): string {
  const value = requiredEnv(name);
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`Invalid provider URL: ${name}`);
  }
  const local = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  if (url.protocol !== "https:" && !(local && url.protocol === "http:")) {
    throw new Error(`Provider URL must use HTTPS: ${name}`);
  }
  return value.replace(/\/+$/, "");
}

function parseDecimal(value: string, maximumDecimals = 18): { units: bigint; scale: number } {
  if (!/^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value)) throw new Error("Invalid decimal amount.");
  const [whole, fraction = ""] = value.split(".");
  if (fraction.length > maximumDecimals) throw new Error("Amount precision is too high.");
  const scale = fraction.length;
  return { units: BigInt(whole + fraction), scale };
}

function toUnits(value: string, decimals: number): bigint {
  const parsed = parseDecimal(value);
  if (parsed.scale > decimals) throw new Error("Amount has unsupported precision.");
  return parsed.units * 10n ** BigInt(decimals - parsed.scale);
}

function fromUnits(value: bigint, decimals: number): string {
  const negative = value < 0n;
  const absolute = negative ? -value : value;
  const scale = 10n ** BigInt(decimals);
  const whole = absolute / scale;
  const fraction = (absolute % scale).toString().padStart(decimals, "0").replace(/0+$/, "");
  return `${negative ? "-" : ""}${whole}${fraction ? `.${fraction}` : ""}`;
}

function multiplyUsdCents(amount: bigint, amountDecimals: number, price: string): bigint {
  const parsedPrice = parseDecimal(price, 8);
  const cents = amount * parsedPrice.units * 100n;
  const denominator = 10n ** BigInt(amountDecimals + parsedPrice.scale);
  return (cents + denominator - 1n) / denominator;
}

function usdCentsString(cents: bigint): string {
  return `${cents / 100n}.${(cents % 100n).toString().padStart(2, "0")}`;
}

function decimalUsdCents(value: string): bigint {
  const parsed = parseDecimal(value, USD_SCALE);
  return parsed.units * 10n ** BigInt(USD_SCALE - parsed.scale);
}

function assetFeeFromUsdCents(cents: bigint, assetPrice: string, assetDecimals: number): string {
  const price = parseDecimal(assetPrice, 8);
  if (price.units <= 0n) throw new Error("A positive asset price is required to calculate fees.");
  const numerator = cents * 10n ** BigInt(assetDecimals + price.scale);
  const denominator = 100n * price.units;
  return fromUnits((numerator + denominator - 1n) / denominator, assetDecimals);
}

function displayNetwork(asset: Asset): string {
  switch (asset) {
    case "BTC": return "Bitcoin";
    case "ETH": return "Ethereum";
    case "USDT": return "Ethereum (ERC-20)";
    case "SOL": return "Solana";
    case "XRP": return "XRP Ledger";
  }
}

function networkAsset(network: string): Network {
  if (
    network === "bitcoin-mainnet" ||
    network === "ethereum-mainnet" ||
    network === "solana-mainnet" ||
    network === "xrpl-mainnet"
  ) return network;
  throw new Error("Unsupported withdrawal network.");
}

function validateDestination(withdrawal: Withdrawal): void {
  switch (withdrawal.asset) {
    case "BTC":
      bitcoin.address.toOutputScript(withdrawal.destination_address, bitcoin.networks.bitcoin);
      if (withdrawal.destination_tag !== null) throw new Error("Bitcoin withdrawals do not use destination tags.");
      break;
    case "ETH":
    case "USDT":
      if (!isAddress(withdrawal.destination_address)) throw new Error("Invalid Ethereum destination address.");
      if (withdrawal.destination_tag !== null) throw new Error("Ethereum withdrawals do not use destination tags.");
      break;
    case "SOL":
      if (new PublicKey(withdrawal.destination_address).toBase58() !== withdrawal.destination_address) {
        throw new Error("Invalid Solana destination address.");
      }
      if (withdrawal.destination_tag !== null) throw new Error("Solana withdrawals do not use destination tags.");
      break;
    case "XRP":
      if (!xrpl.isValidAddress(withdrawal.destination_address)) throw new Error("Invalid XRP Ledger destination address.");
      break;
  }
}

async function rpc(url: string, method: string, params: unknown[] = []): Promise<unknown> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: crypto.randomUUID(), method, params }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`Blockchain provider returned HTTP ${response.status}.`);
  const body = await response.text();
  if (body.length > MAX_RPC_BODY_BYTES) throw new Error("Blockchain provider response is too large.");
  const result = JSON.parse(body);
  if (result.error) throw new Error(`Blockchain provider rejected ${method}.`);
  return result.result;
}

async function xrplRpc(url: string, method: string, params: Record<string, unknown> = {}) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ method, params: [params] }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`XRP Ledger provider returned HTTP ${response.status}.`);
  const body = await response.text();
  if (body.length > MAX_RPC_BODY_BYTES) throw new Error("XRP Ledger provider response is too large.");
  const result = JSON.parse(body)?.result;
  if (!result || (result.status && result.status !== "success")) {
    throw new Error(`XRP Ledger provider rejected ${method}.`);
  }
  return result;
}

function createTurnkey() {
  return new Turnkey({
    apiBaseUrl: "https://api.turnkey.com",
    apiPrivateKey: requiredEnv("TURNKEY_API_PRIVATE_KEY").replace(/\\n/g, "\n"),
    apiPublicKey: requiredEnv("TURNKEY_API_PUBLIC_KEY"),
    defaultOrganizationId: requiredEnv("TURNKEY_ORGANIZATION_ID"),
  }).apiClient();
}

async function getAccount(turnkey: ReturnType<typeof createTurnkey>, wallet: Wallet) {
  const { accounts } = await turnkey.getWalletAccounts({ walletId: wallet.turnkey_wallet_id });
  const account = accounts.find(row =>
    row.walletAccountId === wallet.turnkey_account_id &&
    row.address.toLowerCase() === wallet.address.toLowerCase()
  );
  if (!account) throw new Error("Turnkey wallet account does not match the saved wallet.");
  return account;
}

async function getPrice(admin: ReturnType<typeof createSupabaseClient>, asset: Asset): Promise<string> {
  const { data, error } = await admin
    .from("trade_asset_settings")
    .select("sell_price_usd, sell_enabled")
    .eq("coin", asset)
    .eq("network", displayNetwork(asset))
    .maybeSingle();
  if (error || !data || !data.sell_enabled || Number(data.sell_price_usd) <= 0) {
    throw new Error("A current positive asset price is required for withdrawal limits and fees.");
  }
  return String(data.sell_price_usd);
}

async function getPolicy(admin: ReturnType<typeof createSupabaseClient>) {
  const { data, error } = await admin
    .from("platform_settings")
    .select("policies")
    .eq("id", 1)
    .single();
  if (error || !data) throw new Error("Withdrawal policy could not be loaded.");
  const policies = data.policies as Record<string, unknown>;
  if (policies.cryptoWithdrawalsEnabled !== true) {
    throw new Error("Crypto withdrawals are currently suspended.");
  }
  return policies;
}

async function feeCap(policy: Record<string, unknown>, network: Network): Promise<string> {
  const key = {
    "bitcoin-mainnet": "cryptoWithdrawalFeeCapBitcoinUSD",
    "ethereum-mainnet": "cryptoWithdrawalFeeCapEthereumUSD",
    "solana-mainnet": "cryptoWithdrawalFeeCapSolanaUSD",
    "xrpl-mainnet": "cryptoWithdrawalFeeCapXrplUSD",
  }[network];
  const value = policy[key];
  if (typeof value !== "string" || !/^(?:0|[1-9]\d{0,7})(?:\.\d{1,2})?$/.test(value) || Number(value) <= 0) {
    throw new Error("A positive admin fee cap is required for this network.");
  }
  return value;
}

async function requiredConfirmations(
  admin: ReturnType<typeof createSupabaseClient>,
  asset: Asset,
  network: Network,
): Promise<number> {
  const { data, error } = await admin
    .from("platform_asset_networks")
    .select("required_confirmations, enabled")
    .eq("asset", asset)
    .eq("network", network)
    .maybeSingle();
  if (error || !data || !data.enabled || data.required_confirmations < 1) {
    throw new Error("Withdrawals are not enabled for this asset and network.");
  }
  return Math.max(data.required_confirmations, REQUIRED_CONFIRMATION_DEFAULTS[network]);
}

async function bitcoinFeeQuote(
  withdrawal: Withdrawal,
  address: string,
  admin: ReturnType<typeof createSupabaseClient>,
): Promise<FeeQuote> {
  const base = secureUrl("BITCOIN_ESPLORA_URL");
  const [utxoResponse, rateResponse] = await Promise.all([
    fetch(`${base}/address/${encodeURIComponent(address)}/utxo`, { signal: AbortSignal.timeout(15_000) }),
    fetch(`${base}/fee-estimates`, { signal: AbortSignal.timeout(15_000) }),
  ]);
  if (!utxoResponse.ok || !rateResponse.ok) throw new Error("Bitcoin fee provider is unavailable.");
  const [utxos, rates] = await Promise.all([utxoResponse.json(), rateResponse.json()]);
  if (!Array.isArray(utxos) || !rates || typeof rates["6"] !== "number") {
    throw new Error("Bitcoin fee provider returned an invalid quote.");
  }
  const feeRate = Math.max(1, Math.ceil(rates["6"]));
  const amount = toUnits(withdrawal.amount, 8);
  const selected: Utxo[] = [];
  let total = 0n;
  for (const utxo of (utxos as Utxo[]).filter(row => row.status?.confirmed)) {
    if (!/^[0-9a-f]{64}$/i.test(utxo.txid) || !Number.isSafeInteger(utxo.vout) || !Number.isSafeInteger(utxo.value)) {
      throw new Error("Bitcoin provider returned an invalid UTXO.");
    }
    selected.push(utxo);
    total += BigInt(utxo.value);
    const estimatedFee = BigInt(Math.ceil((selected.length * 68 + 2 * 43 + 10) * feeRate) + 330);
    if (total >= amount + estimatedFee) {
      const actualFee = estimatedFee;
      const feePrice = await getPrice(admin, "BTC");
      const feeUsd = multiplyUsdCents(actualFee, 8, feePrice);
      return {
        fee: fromUnits(actualFee, 8),
        feeUsd: usdCentsString(feeUsd),
        bitcoin: { utxos: selected, feeRate, amount },
      };
    }
  }
  throw new Error("The Bitcoin wallet does not have enough confirmed UTXOs for this withdrawal and fee.");
}

async function ethereumFeeQuote(
  withdrawal: Withdrawal,
  from: string,
  admin: ReturnType<typeof createSupabaseClient>,
): Promise<FeeQuote> {
  const url = alchemyEthereumRpcUrl();
  if (BigInt(await rpc(url, "eth_chainId") as string) !== 1n) {
    throw new Error("Ethereum provider is not connected to mainnet.");
  }
  const amount = toUnits(withdrawal.amount, withdrawal.asset === "USDT" ? 6 : 18);
  const to = withdrawal.asset === "USDT"
    ? requiredEnv("ETHEREUM_USDT_CONTRACT_ADDRESS")
    : withdrawal.destination_address;
  if (withdrawal.asset === "USDT" && !isAddress(to)) throw new Error("USDT contract address is invalid.");
  const data = withdrawal.asset === "USDT"
    ? TOKEN.encodeFunctionData("transfer", [withdrawal.destination_address, amount])
    : "0x";
  const value = withdrawal.asset === "USDT" ? 0n : amount;
  const estimateHex = await rpc(url, "eth_estimateGas", [{
    from, to, value: `0x${value.toString(16)}`, data,
  }]) as string;
  const gasLimit = (BigInt(estimateHex) * 120n + 99n) / 100n;
  const feeHex = await rpc(url, "eth_gasPrice") as string;
  const priorityHex = await rpc(url, "eth_maxPriorityFeePerGas") as string;
  const maxPriorityFeePerGas = BigInt(priorityHex);
  const maxFeePerGas = BigInt(feeHex) * 2n;
  const feeWei = gasLimit * maxFeePerGas;
  const ethPrice = await getPrice(admin, "ETH");
  const feeUsdCents = multiplyUsdCents(feeWei, 18, ethPrice);
  const fee = withdrawal.asset === "USDT"
    ? assetFeeFromUsdCents(feeUsdCents, await getPrice(admin, "USDT"), 6)
    : fromUnits(feeWei, 18);
  const feeUsd = withdrawal.asset === "USDT"
    ? usdCentsString(feeUsdCents)
    : usdCentsString(feeUsdCents);
  const balanceHex = await rpc(url, "eth_getBalance", [from, "latest"]) as string;
  if (BigInt(balanceHex) < feeWei) {
    throw new Error(withdrawal.asset === "USDT"
      ? "The Ethereum wallet lacks gas and platform gas sponsorship is not configured."
      : "The Ethereum wallet lacks enough ETH to pay the network fee.");
  }
  return {
    fee,
    feeUsd,
    eth: { gasLimit, maxFeePerGas, maxPriorityFeePerGas, data, to, value },
  };
}

async function solanaFeeQuote(
  withdrawal: Withdrawal,
  from: string,
  admin: ReturnType<typeof createSupabaseClient>,
): Promise<FeeQuote> {
  const amount = toUnits(withdrawal.amount, 9);
  if (amount > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error("Solana amount exceeds the safe transaction range.");
  }
  const connection = new Connection(secureUrl("SOLANA_MAINNET_RPC_URL"), "confirmed");
  const blockhash = await connection.getLatestBlockhash("confirmed");
  const transaction = new Transaction({
    feePayer: new PublicKey(from),
    recentBlockhash: blockhash.blockhash,
  }).add(SystemProgram.transfer({
    fromPubkey: new PublicKey(from),
    toPubkey: new PublicKey(withdrawal.destination_address),
    lamports: Number(amount),
  }));
  const message = transaction.compileMessage();
  const fee = await connection.getFeeForMessage(message, "confirmed");
  if (!fee.value || fee.value <= 0) throw new Error("Solana fee estimation failed.");
  const balance = await connection.getBalance(new PublicKey(from), "confirmed");
  const required = toUnits(withdrawal.amount, 9) + BigInt(fee.value);
  if (BigInt(balance) < required) throw new Error("The Solana wallet lacks enough SOL to pay the amount and network fee.");
  const price = await getPrice(admin, "SOL");
  return {
    fee: fromUnits(BigInt(fee.value), 9),
    feeUsd: usdCentsString(multiplyUsdCents(BigInt(fee.value), 9, price)),
    solana: { transaction, feeLamports: BigInt(fee.value) },
  };
}

async function xrplFeeQuote(
  withdrawal: Withdrawal,
  address: string,
  admin: ReturnType<typeof createSupabaseClient>,
): Promise<FeeQuote> {
  const url = secureUrl("XRPL_MAINNET_RPC_URL");
  const [account, fee, ledger] = await Promise.all([
    xrplRpc(url, "account_info", { account: address, ledger_index: "validated" }),
    xrplRpc(url, "fee"),
    xrplRpc(url, "ledger_current"),
  ]);
  const feeDrops = BigInt(String(fee.drops?.minimum_fee ?? ""));
  const sequence = Number(account.account_data?.Sequence);
  const lastLedgerSequence = Number(ledger.ledger_current_index ?? 0) + 20;
  if (feeDrops <= 0n || !Number.isSafeInteger(sequence) || !Number.isSafeInteger(lastLedgerSequence)) {
    throw new Error("XRP Ledger fee or sequence response is invalid.");
  }
  const amountDrops = toUnits(withdrawal.amount, 6);
  const balanceDrops = BigInt(String(account.account_data?.Balance ?? "0"));
  if (balanceDrops < amountDrops + feeDrops) {
    throw new Error("The XRP Ledger wallet lacks enough XRP to pay the amount and network fee.");
  }
  const price = await getPrice(admin, "XRP");
  return {
    fee: fromUnits(feeDrops, 6),
    feeUsd: usdCentsString(multiplyUsdCents(feeDrops, 6, price)),
    xrpl: { feeDrops, sequence, lastLedgerSequence },
  };
}

async function getFeeQuote(
  withdrawal: Withdrawal,
  wallet: Wallet,
  admin: ReturnType<typeof createSupabaseClient>,
): Promise<FeeQuote> {
  validateDestination(withdrawal);
  switch (withdrawal.network) {
    case "bitcoin-mainnet": return bitcoinFeeQuote(withdrawal, wallet.address, admin);
    case "ethereum-mainnet": return ethereumFeeQuote(withdrawal, wallet.address, admin);
    case "solana-mainnet": return solanaFeeQuote(withdrawal, wallet.address, admin);
    case "xrpl-mainnet": return xrplFeeQuote(withdrawal, wallet.address, admin);
  }
}

function createBitcoinPsbt(
  withdrawal: Withdrawal,
  quote: FeeQuote,
  publicKey: string,
  changeAddress: string,
): bitcoin.Psbt {
  if (!quote.bitcoin || !publicKey) throw new Error("Bitcoin signing data is missing.");
  const psbt = new bitcoin.Psbt({ network: bitcoin.networks.bitcoin });
  const pubkey = Buffer.from(publicKey.replace(/^0x/i, ""), "hex");
  const payment = bitcoin.payments.p2wpkh({ pubkey, network: bitcoin.networks.bitcoin });
  if (!payment.output) throw new Error("Bitcoin wallet public key is invalid.");
  let total = 0n;
  for (const utxo of quote.bitcoin.utxos) {
    psbt.addInput({
      hash: utxo.txid,
      index: utxo.vout,
      witnessUtxo: { script: payment.output, value: BigInt(utxo.value) },
    });
    total += BigInt(utxo.value);
  }
  const amount = quote.bitcoin.amount;
  const fee = toUnits(quote.fee, 8);
  psbt.addOutput({ address: withdrawal.destination_address, value: amount });
  const change = total - amount - fee;
  if (change >= 330n) psbt.addOutput({ address: changeAddress, value: change });
  else if (change > 0n) throw new Error("Bitcoin fee quote is too low for the dust remainder.");
  return psbt;
}

function derInteger(hex: string): Uint8Array {
  let value = hex.replace(/^0x/i, "").replace(/^0+/, "") || "00";
  if (value.length % 2) value = `0${value}`;
  let bytes = Uint8Array.from(value.match(/.{2}/g)!.map(byte => Number.parseInt(byte, 16)));
  if (bytes[0] & 0x80) bytes = Uint8Array.from([0, ...bytes]);
  return Uint8Array.from([0x02, bytes.length, ...bytes]);
}

function derSignature(r: string, s: string): string {
  const rPart = derInteger(r);
  const sPart = derInteger(s);
  const sequence = Uint8Array.from([0x30, rPart.length + sPart.length, ...rPart, ...sPart]);
  return Array.from(sequence, byte => byte.toString(16).padStart(2, "0")).join("").toUpperCase();
}

async function xrpSigningDigest(transaction: xrpl.Transaction): Promise<string> {
  const payload = Uint8Array.from(
    (xrpl.encodeForSigning(transaction) as string).match(/.{2}/g)!.map(byte => Number.parseInt(byte, 16)),
  );
  const hash = new Uint8Array(await crypto.subtle.digest("SHA-512", payload));
  return Array.from(hash.slice(0, 32), byte => byte.toString(16).padStart(2, "0")).join("");
}

async function broadcastBitcoin(base: string, signedPsbt: string): Promise<string> {
  const psbt = bitcoin.Psbt.fromHex(signedPsbt, { network: bitcoin.networks.bitcoin });
  psbt.finalizeAllInputs();
  const raw = psbt.extractTransaction().toHex();
  const response = await fetch(`${base}/tx`, {
    method: "POST",
    headers: { "content-type": "text/plain" },
    body: raw,
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error("Bitcoin broadcast was rejected or its outcome is unknown.");
  const hash = (await response.text()).trim();
  if (!/^[0-9a-f]{64}$/i.test(hash)) throw new Error("Bitcoin provider returned an invalid transaction hash.");
  return hash;
}

async function createXrpPayment(
  withdrawal: Withdrawal,
  wallet: Wallet,
  quote: FeeQuote,
  account: Awaited<ReturnType<typeof getAccount>>,
  turnkey: ReturnType<typeof createTurnkey>,
): Promise<string> {
  if (!quote.xrpl || !account.publicKey) throw new Error("XRP signing information is missing.");
  const transaction: xrpl.Transaction = {
    TransactionType: "Payment",
    Account: wallet.address,
    Destination: withdrawal.destination_address,
    Amount: toUnits(withdrawal.amount, 6).toString(),
    Fee: quote.xrpl.feeDrops.toString(),
    Sequence: quote.xrpl.sequence,
    LastLedgerSequence: quote.xrpl.lastLedgerSequence,
    SigningPubKey: account.publicKey.toUpperCase(),
    ...(withdrawal.destination_tag === null ? {} : { DestinationTag: withdrawal.destination_tag }),
  };
  const payload = await xrpSigningDigest(transaction);
  const signature = await turnkey.signRawPayload({
    signWith: wallet.address,
    payload,
    encoding: "PAYLOAD_ENCODING_HEXADECIMAL",
    hashFunction: "HASH_FUNCTION_NO_OP",
  });
  transaction.TxnSignature = derSignature(signature.r, signature.s);
  const blob = xrpl.encode(transaction);
  const result = await xrplRpc(secureUrl("XRPL_MAINNET_RPC_URL"), "submit", { tx_blob: blob });
  const engineResult = String(result.engine_result ?? "");
  if (engineResult !== "tesSUCCESS" && engineResult !== "terQUEUED") {
    throw new Error("XRP Ledger rejected the signed withdrawal.");
  }
  return xrpl.hashes.hashSignedTx(blob);
}

async function processWithdrawal(
  admin: ReturnType<typeof createSupabaseClient>,
  turnkey: ReturnType<typeof createTurnkey>,
  userId: string,
  withdrawalId: string,
) {
  const { data: row, error: rowError } = await admin
    .from("crypto_withdrawals")
    .select("*")
    .eq("id", withdrawalId)
    .eq("user_id", userId)
    .maybeSingle();
  if (rowError || !row) throw new Error("Withdrawal request was not found.");
  const withdrawal = row as Withdrawal;
  if (withdrawal.status !== "requested") {
    return {
      withdrawal_id: withdrawal.id,
      status: withdrawal.status,
      network_fee: withdrawal.network_fee,
      network_fee_usd: withdrawal.network_fee_usd,
      replayed: true,
    };
  }

  let signingStarted = false;
  let feeQuote: FeeQuote | null = null;
  try {
    const policy = await getPolicy(admin);
    const { data: walletRow, error: walletError } = await admin
      .from("wallet_accounts")
      .select("id, user_id, network, address, status, turnkey_wallet_id, turnkey_account_id")
      .eq("id", withdrawal.wallet_id)
      .eq("user_id", userId)
      .eq("network", networkAsset(withdrawal.network))
      .eq("status", "active")
      .maybeSingle();
    if (walletError || !walletRow?.address || !walletRow.turnkey_wallet_id || !walletRow.turnkey_account_id) {
      throw new Error("The active Turnkey withdrawal wallet is unavailable.");
    }
    const wallet = walletRow as Wallet;
    if (wallet.address.toLowerCase() === withdrawal.destination_address.toLowerCase()) {
      throw new Error("Withdrawal destination cannot be the source wallet.");
    }

    const quote = await getFeeQuote(withdrawal, wallet, admin);
    feeQuote = quote;
    const cap = await feeCap(policy, withdrawal.network);
    if (decimalUsdCents(quote.feeUsd) > decimalUsdCents(cap)) {
      throw new Error("The current network fee exceeds the configured fee cap.");
    }
    const confirmations = await requiredConfirmations(admin, withdrawal.asset, withdrawal.network);
    const { error: reserveError } = await admin.rpc("reserve_crypto_withdrawal_fee", {
      _withdrawal_id: withdrawal.id,
      _fee: quote.fee,
      _fee_usd: quote.feeUsd,
    });
    if (reserveError) throw new Error(reserveError.message);

    const { data: claimed, error: claimError } = await admin.rpc("claim_crypto_withdrawal", {
      _withdrawal_id: withdrawal.id,
      _lease_seconds: 120,
    });
    if (claimError || !claimed?.length) {
      const { data: latest } = await admin
        .from("crypto_withdrawals")
        .select("status")
        .eq("id", withdrawal.id)
        .maybeSingle();
      if (latest?.status !== "requested") {
        return { withdrawal_id: withdrawal.id, status: latest?.status ?? "processing", replayed: true };
      }
      throw new Error("Withdrawal is suspended or could not be claimed.");
    }

    const account = await getAccount(turnkey, wallet);
    if (withdrawal.network === "ethereum-mainnet") {
      if (!quote.eth) throw new Error("Ethereum fee quote is unavailable.");
      signingStarted = true;
      const { error: signedError } = await admin.rpc("mark_crypto_withdrawal_signed", {
        _withdrawal_id: withdrawal.id,
        _required_confirmations: confirmations,
      });
      if (signedError) throw new Error("Could not save the withdrawal signing state.");
      const result = await turnkey.ethSendTransaction({
        from: wallet.address,
        caip2: "eip155:1",
        gasLimit: quote.eth.gasLimit.toString(),
        maxFeePerGas: quote.eth.maxFeePerGas.toString(),
        maxPriorityFeePerGas: quote.eth.maxPriorityFeePerGas.toString(),
        calls: [{
          to: quote.eth.to,
          value: quote.eth.value.toString(),
          ...(quote.eth.data === "0x" ? {} : { data: quote.eth.data }),
        }],
      });
      const { error } = await admin.rpc("record_crypto_withdrawal_turnkey_submission", {
        _withdrawal_id: withdrawal.id,
        _turnkey_status_id: result.sendTransactionStatusId,
      });
      if (error) throw new Error("Could not save Turnkey's Ethereum submission reference.");
      return {
        withdrawal_id: withdrawal.id,
        status: "broadcast_unknown",
        network_fee: quote.fee,
        network_fee_usd: quote.feeUsd,
      };
    }
    if (withdrawal.network === "solana-mainnet") {
      if (!quote.solana) throw new Error("Solana fee quote is unavailable.");
      signingStarted = true;
      const { error: signedError } = await admin.rpc("mark_crypto_withdrawal_signed", {
        _withdrawal_id: withdrawal.id,
        _required_confirmations: confirmations,
      });
      if (signedError) throw new Error("Could not save the withdrawal signing state.");
      const unsignedTransaction = Buffer.from(
        quote.solana.transaction.serialize({ requireAllSignatures: false, verifySignatures: false }),
      ).toString("hex");
      const result = await turnkey.solSendTransaction({
        unsignedTransaction,
        signWiths: [wallet.address],
        caip2: "solana:mainnet",
        recentBlockhash: quote.solana.transaction.recentBlockhash!,
      });
      const { error } = await admin.rpc("record_crypto_withdrawal_turnkey_submission", {
        _withdrawal_id: withdrawal.id,
        _turnkey_status_id: result.sendTransactionStatusId,
      });
      if (error) throw new Error("Could not save Turnkey's Solana submission reference.");
      return {
        withdrawal_id: withdrawal.id,
        status: "broadcast_unknown",
        network_fee: quote.fee,
        network_fee_usd: quote.feeUsd,
      };
    }
    if (withdrawal.network === "bitcoin-mainnet") {
      if (!quote.bitcoin) throw new Error("Bitcoin fee quote is unavailable.");
      const psbt = createBitcoinPsbt(withdrawal, quote, account.publicKey ?? "", wallet.address);
      signingStarted = true;
      const { error: signedError } = await admin.rpc("mark_crypto_withdrawal_signed", {
        _withdrawal_id: withdrawal.id,
        _required_confirmations: confirmations,
      });
      if (signedError) throw new Error("Could not save the withdrawal signing state.");
      const signed = await turnkey.signTransaction({
        signWith: wallet.address,
        unsignedTransaction: psbt.toHex(),
        type: "TRANSACTION_TYPE_BITCOIN",
      });
      const hash = await broadcastBitcoin(secureUrl("BITCOIN_ESPLORA_URL"), signed.signedTransaction);
      const { error } = await admin.rpc("mark_crypto_withdrawal_broadcast", {
        _withdrawal_id: withdrawal.id,
        _transaction_hash: hash,
        _turnkey_status_id: null,
      });
      if (error) throw new Error("Bitcoin broadcast succeeded but the transaction reference could not be saved.");
      return {
        withdrawal_id: withdrawal.id,
        status: "broadcast",
        transaction_hash: hash,
        network_fee: quote.fee,
        network_fee_usd: quote.feeUsd,
      };
    }
    if (withdrawal.network === "xrpl-mainnet") {
      signingStarted = true;
      const { error: signedError } = await admin.rpc("mark_crypto_withdrawal_signed", {
        _withdrawal_id: withdrawal.id,
        _required_confirmations: confirmations,
      });
      if (signedError) throw new Error("Could not save the withdrawal signing state.");
      const hash = await createXrpPayment(withdrawal, wallet, quote, account, turnkey);
      const { error } = await admin.rpc("mark_crypto_withdrawal_broadcast", {
        _withdrawal_id: withdrawal.id,
        _transaction_hash: hash,
        _turnkey_status_id: null,
      });
      if (error) throw new Error("XRP Ledger broadcast succeeded but the transaction reference could not be saved.");
      return {
        withdrawal_id: withdrawal.id,
        status: "broadcast",
        transaction_hash: hash,
        network_fee: quote.fee,
        network_fee_usd: quote.feeUsd,
      };
    }
    throw new Error("Unsupported withdrawal network.");
  } catch (error) {
    if (signingStarted) {
      const { error: unknownError } = await admin.rpc("mark_crypto_withdrawal_broadcast_unknown", {
        _withdrawal_id: withdrawal.id,
        _failure_code: "submission_outcome_unknown",
      });
      if (unknownError) {
        console.error("Could not persist an ambiguous withdrawal submission.", {
          withdrawalId: withdrawal.id,
        });
      }
      return {
        withdrawal_id: withdrawal.id,
        status: "broadcast_unknown",
        network_fee: feeQuote?.fee ?? withdrawal.network_fee,
        network_fee_usd: feeQuote?.feeUsd ?? withdrawal.network_fee_usd,
      };
    }
    const { data: latest } = await admin
      .from("crypto_withdrawals")
      .select("status")
      .eq("id", withdrawal.id)
      .maybeSingle();
    if (latest?.status === "requested" || latest?.status === "processing") {
      const { error: releaseError } = await admin.rpc("fail_unbroadcast_crypto_withdrawal", {
        _withdrawal_id: withdrawal.id,
        _failure_code: "pre_sign_execution_failed",
      });
      if (releaseError) {
        console.error("Withdrawal failed before signing and the reservation could not be released.", {
          withdrawalId: withdrawal.id,
        });
        throw new Error("Withdrawal failed and its reservation requires reconciliation.");
      }
    }
    throw error;
  }
}

async function reconcileEthereum(
  admin: ReturnType<typeof createSupabaseClient>,
  turnkey: ReturnType<typeof createTurnkey>,
  withdrawal: Withdrawal,
  wallet: Wallet,
) {
  let hash = withdrawal.transaction_hash;
  if (!hash && withdrawal.turnkey_status_id) {
    const status = await turnkey.getSendTransactionStatus({
      sendTransactionStatusId: withdrawal.turnkey_status_id,
    });
    hash = status.eth?.txHash ?? status.solana?.signature ?? null;
    if (!hash) return "pending";
    const { error } = await admin.rpc("mark_crypto_withdrawal_broadcast", {
      _withdrawal_id: withdrawal.id,
      _transaction_hash: hash,
      _turnkey_status_id: withdrawal.turnkey_status_id,
    });
    if (error) throw new Error("Could not persist the Turnkey transaction hash.");
  }
  if (!hash) return "reconciliation_required";

  const url = alchemyEthereumRpcUrl();
  const transaction = await rpc(url, "eth_getTransactionByHash", [hash]) as Record<string, string> | null;
  if (!transaction) return "pending";
  const receipt = await rpc(url, "eth_getTransactionReceipt", [hash]) as Record<string, string> | null;
  if (!receipt) return "pending";
  const expectedContract = withdrawal.asset === "USDT"
    ? requiredEnv("ETHEREUM_USDT_CONTRACT_ADDRESS")
    : withdrawal.destination_address;
  if (
    transaction.from.toLowerCase() !== wallet.address.toLowerCase() ||
    transaction.to?.toLowerCase() !== expectedContract.toLowerCase()
  ) throw new Error("Ethereum transaction does not match the persisted withdrawal.");

  const currentBlock = BigInt(await rpc(url, "eth_blockNumber") as string);
  const blockNumber = BigInt(receipt.blockNumber);
  const confirmations = Number(currentBlock - blockNumber + 1n);
  const price = await getPrice(admin, "ETH");
  const actualWei = BigInt(receipt.gasUsed) * BigInt(receipt.effectiveGasPrice ?? transaction.gasPrice);
  let actualFee = fromUnits(actualWei, 18);
  let actualFeeUsd = usdCentsString(multiplyUsdCents(actualWei, 18, price));
  if (withdrawal.asset === "USDT") {
    actualFee = assetFeeFromUsdCents(BigInt(Math.round(Number(actualFeeUsd) * 100)), await getPrice(admin, "USDT"), 6);
  }
  if (receipt.status === "0x0") {
    await admin.rpc("finish_crypto_withdrawal", {
      _withdrawal_id: withdrawal.id,
      _transaction_hash: hash,
      _confirmations: confirmations,
      _actual_fee: actualFee,
      _actual_fee_usd: actualFeeUsd,
      _failed: true,
    });
    return "failed";
  }
  await admin.rpc("update_crypto_withdrawal_confirmations", {
    _withdrawal_id: withdrawal.id,
    _confirmations: confirmations,
  });
  if (confirmations < (withdrawal.required_confirmations ?? REQUIRED_CONFIRMATION_DEFAULTS[withdrawal.network])) {
    return "pending";
  }
  const { error } = await admin.rpc("finish_crypto_withdrawal", {
    _withdrawal_id: withdrawal.id,
    _transaction_hash: hash,
    _confirmations: confirmations,
    _actual_fee: actualFee,
    _actual_fee_usd: actualFeeUsd,
    _failed: false,
  });
  if (error) throw new Error(error.message);
  return "confirmed";
}

async function reconcileSolana(
  admin: ReturnType<typeof createSupabaseClient>,
  turnkey: ReturnType<typeof createTurnkey>,
  withdrawal: Withdrawal,
  wallet: Wallet,
) {
  let signature = withdrawal.transaction_hash;
  if (!signature && withdrawal.turnkey_status_id) {
    const status = await turnkey.getSendTransactionStatus({
      sendTransactionStatusId: withdrawal.turnkey_status_id,
    });
    signature = status.solana?.signature ?? null;
    if (!signature) return "pending";
    const { error } = await admin.rpc("mark_crypto_withdrawal_broadcast", {
      _withdrawal_id: withdrawal.id,
      _transaction_hash: signature,
      _turnkey_status_id: withdrawal.turnkey_status_id,
    });
    if (error) throw new Error("Could not persist the Turnkey Solana signature.");
  }
  if (!signature) return "reconciliation_required";
  const connection = new Connection(secureUrl("SOLANA_MAINNET_RPC_URL"), "confirmed");
  const result = await connection.getTransaction(signature, {
    commitment: "confirmed",
    maxSupportedTransactionVersion: 0,
    encoding: "jsonParsed",
  } as never);
  if (!result) return "pending";
  const transfer = result.transaction.message.instructions.find(instruction => {
    if (!("parsed" in instruction)) return false;
    const parsed = instruction.parsed as { type?: string; info?: Record<string, string> };
    return parsed.type === "transfer" &&
      parsed.info?.source === wallet.address &&
      parsed.info?.destination === withdrawal.destination_address &&
      parsed.info?.lamports === toUnits(withdrawal.amount, 9).toString();
  });
  if (!transfer || result.meta?.err) {
    const fee = BigInt(result.meta?.fee ?? 0);
    const price = await getPrice(admin, "SOL");
    const feeUsd = usdCentsString(multiplyUsdCents(fee, 9, price));
    const { error } = await admin.rpc("finish_crypto_withdrawal", {
      _withdrawal_id: withdrawal.id,
      _transaction_hash: signature,
      _confirmations: 0,
      _actual_fee: fromUnits(fee, 9),
      _actual_fee_usd: feeUsd,
      _failed: true,
    });
    if (error) throw new Error(error.message);
    return "failed";
  }
  const signatureStatus = await connection.getSignatureStatus(signature, { searchTransactionHistory: true });
  const confirmationStatus = signatureStatus.value?.confirmationStatus;
  const confirmations = confirmationStatus === "finalized"
    ? Math.max(withdrawal.required_confirmations ?? REQUIRED_CONFIRMATION_DEFAULTS[withdrawal.network], 32)
    : signatureStatus.value?.confirmations ?? 0;
  const fee = BigInt(result.meta?.fee ?? 0);
  const price = await getPrice(admin, "SOL");
  const feeUsd = usdCentsString(multiplyUsdCents(fee, 9, price));
  await admin.rpc("update_crypto_withdrawal_confirmations", {
    _withdrawal_id: withdrawal.id,
    _confirmations: confirmations,
  });
  if (confirmations < (withdrawal.required_confirmations ?? REQUIRED_CONFIRMATION_DEFAULTS[withdrawal.network])) {
    return "pending";
  }
  const { error } = await admin.rpc("finish_crypto_withdrawal", {
    _withdrawal_id: withdrawal.id,
    _transaction_hash: signature,
    _confirmations: confirmations,
    _actual_fee: fromUnits(fee, 9),
    _actual_fee_usd: feeUsd,
    _failed: false,
  });
  if (error) throw new Error(error.message);
  return "confirmed";
}

async function reconcileBitcoin(
  admin: ReturnType<typeof createSupabaseClient>,
  withdrawal: Withdrawal,
) {
  if (!withdrawal.transaction_hash) return "reconciliation_required";
  const base = secureUrl("BITCOIN_ESPLORA_URL");
  const [txResponse, tipResponse] = await Promise.all([
    fetch(`${base}/tx/${withdrawal.transaction_hash}`, { signal: AbortSignal.timeout(15_000) }),
    fetch(`${base}/blocks/tip/height`, { signal: AbortSignal.timeout(15_000) }),
  ]);
  if (txResponse.status === 404) return "pending";
  if (!txResponse.ok || !tipResponse.ok) throw new Error("Bitcoin reconciliation provider is unavailable.");
  const [tx, tipText] = await Promise.all([txResponse.json(), tipResponse.text()]);
  const tip = Number(tipText);
  const output = tx.vout?.find((row: { scriptpubkey_address?: string; value?: number }) =>
    row.scriptpubkey_address === withdrawal.destination_address &&
    BigInt(row.value ?? 0) >= toUnits(withdrawal.amount, 8)
  );
  if (!output) throw new Error("Bitcoin transaction does not contain the requested destination output.");
  const confirmations = tx.status?.confirmed
    ? Math.max(0, tip - Number(tx.status.block_height) + 1)
    : 0;
  const feeSats = BigInt(tx.fee ?? 0);
  const price = await getPrice(admin, "BTC");
  const feeUsd = usdCentsString(multiplyUsdCents(feeSats, 8, price));
  await admin.rpc("update_crypto_withdrawal_confirmations", {
    _withdrawal_id: withdrawal.id,
    _confirmations: confirmations,
  });
  if (confirmations < (withdrawal.required_confirmations ?? REQUIRED_CONFIRMATION_DEFAULTS[withdrawal.network])) {
    return "pending";
  }
  const { error } = await admin.rpc("finish_crypto_withdrawal", {
    _withdrawal_id: withdrawal.id,
    _transaction_hash: withdrawal.transaction_hash,
    _confirmations: confirmations,
    _actual_fee: fromUnits(feeSats, 8),
    _actual_fee_usd: feeUsd,
    _failed: false,
  });
  if (error) throw new Error(error.message);
  return "confirmed";
}

async function reconcileXrp(
  admin: ReturnType<typeof createSupabaseClient>,
  withdrawal: Withdrawal,
) {
  if (!withdrawal.transaction_hash) return "reconciliation_required";
  const result = await xrplRpc(secureUrl("XRPL_MAINNET_RPC_URL"), "tx", {
    transaction: withdrawal.transaction_hash,
    binary: false,
  });
  if (!result.validated) return "pending";
  const tx = result.tx_json ?? result;
  if (
    tx.TransactionType !== "Payment" ||
    tx.Destination !== withdrawal.destination_address ||
    tx.Amount !== toUnits(withdrawal.amount, 6).toString() ||
    (withdrawal.destination_tag !== null && tx.DestinationTag !== withdrawal.destination_tag)
  ) throw new Error("XRP Ledger transaction does not match the persisted withdrawal.");
  const ledgerIndex = Number(result.ledger_index);
  const ledger = await xrplRpc(secureUrl("XRPL_MAINNET_RPC_URL"), "ledger", {
    ledger_index: "validated",
    transactions: false,
    expand: false,
  });
  const confirmations = Math.max(0, Number(ledger.ledger_index) - ledgerIndex + 1);
  const feeDrops = BigInt(String(tx.Fee ?? "0"));
  const price = await getPrice(admin, "XRP");
  const feeUsd = usdCentsString(multiplyUsdCents(feeDrops, 6, price));
  if (String(result.meta?.TransactionResult ?? "") !== "tesSUCCESS") {
    const { error } = await admin.rpc("finish_crypto_withdrawal", {
      _withdrawal_id: withdrawal.id,
      _transaction_hash: withdrawal.transaction_hash,
      _confirmations: confirmations,
      _actual_fee: fromUnits(feeDrops, 6),
      _actual_fee_usd: feeUsd,
      _failed: true,
    });
    if (error) throw new Error(error.message);
    return "failed";
  }
  await admin.rpc("update_crypto_withdrawal_confirmations", {
    _withdrawal_id: withdrawal.id,
    _confirmations: confirmations,
  });
  if (confirmations < (withdrawal.required_confirmations ?? REQUIRED_CONFIRMATION_DEFAULTS[withdrawal.network])) {
    return "pending";
  }
  const { error } = await admin.rpc("finish_crypto_withdrawal", {
    _withdrawal_id: withdrawal.id,
    _transaction_hash: withdrawal.transaction_hash,
    _confirmations: confirmations,
    _actual_fee: fromUnits(feeDrops, 6),
    _actual_fee_usd: feeUsd,
    _failed: false,
  });
  if (error) throw new Error(error.message);
  return "confirmed";
}

async function reconcileWithdrawal(
  admin: ReturnType<typeof createSupabaseClient>,
  turnkey: ReturnType<typeof createTurnkey>,
  withdrawal: Withdrawal,
) {
  const { data: wallet, error } = await admin
    .from("wallet_accounts")
    .select("id, address, turnkey_wallet_id, turnkey_account_id")
    .eq("id", withdrawal.wallet_id)
    .maybeSingle();
  if (error || !wallet) throw new Error("Withdrawal wallet could not be loaded.");
  switch (withdrawal.network) {
    case "ethereum-mainnet": return reconcileEthereum(admin, turnkey, withdrawal, wallet as Wallet);
    case "solana-mainnet": return reconcileSolana(admin, turnkey, withdrawal, wallet as Wallet);
    case "bitcoin-mainnet": return reconcileBitcoin(admin, withdrawal);
    case "xrpl-mainnet": return reconcileXrp(admin, withdrawal);
  }
}

function constantTimeEqual(left: string, right: string): boolean {
  const encoder = new TextEncoder();
  const a = encoder.encode(left);
  const b = encoder.encode(right);
  let difference = a.length ^ b.length;
  const length = Math.max(a.length, b.length);
  for (let index = 0; index < length; index += 1) {
    difference |= (a[index] ?? 0) ^ (b[index] ?? 0);
  }
  return difference === 0;
}

Deno.serve(async request => {
  if (request.method === "OPTIONS") return json({}, 204);
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SECRET_KEY");
  if (!supabaseUrl || !anonKey || !serviceKey) return json({ error: "Withdrawal service is not configured." }, 503);

  const admin = createSupabaseClient(supabaseUrl, serviceKey);
  activeAdmin = admin;
  const monitorSecret = Deno.env.get("CRYPTO_MONITOR_SECRET") ?? "";
  const authorization = request.headers.get("authorization") ?? "";
  const isMonitor = monitorSecret.length >= 32 &&
    authorization.startsWith("Bearer ") &&
    constantTimeEqual(authorization.slice(7), monitorSecret);

  try {
    const raw = await request.text();
    if (raw.length > 16_384) return json({ error: "Request is too large." }, 413);
    const body = JSON.parse(raw);
    if (isMonitor && body.action === "reconcile") {
      const { data: rows, error } = await admin
        .from("crypto_withdrawals")
        .select("*")
        .in("status", ["broadcast", "broadcast_unknown", "confirmed"])
        .order("created_at", { ascending: true })
        .limit(50);
      if (error) throw new Error("Could not load withdrawals for reconciliation.");
      const turnkey = createTurnkey();
      const results = [];
      for (const row of rows ?? []) {
        try {
          results.push({
            withdrawal_id: row.id,
            result: await reconcileWithdrawal(admin, turnkey, row as Withdrawal),
          });
        } catch (error) {
          console.error("Withdrawal reconciliation failed.", {
            withdrawalId: row.id,
            error: error instanceof Error ? error.message : "unknown",
          });
          results.push({ withdrawal_id: row.id, result: "reconciliation_required" });
        }
      }
      return json({ results });
    }

    const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!token) return json({ error: "Authentication required." }, 401);
    const authClient = createSupabaseClient(supabaseUrl, anonKey);
    const { data: auth, error: authError } = await authClient.auth.getUser(token);
    if (authError || !auth.user) return json({ error: "Authentication required." }, 401);
    if (typeof body.withdrawal_id !== "string" || !/^[0-9a-f-]{36}$/i.test(body.withdrawal_id)) {
      return json({ error: "Invalid withdrawal identifier." }, 400);
    }
    const result = await processWithdrawal(
      admin,
      createTurnkey(),
      auth.user.id,
      body.withdrawal_id,
    );
    const { data: feeDetails, error: feeError } = await admin
      .from("crypto_withdrawals")
      .select("network_fee, network_fee_usd")
      .eq("id", body.withdrawal_id)
      .eq("user_id", auth.user.id)
      .maybeSingle();
    if (feeError || !feeDetails) {
      throw new Error("Could not verify the withdrawal fee and status.");
    }
    Object.assign(result, {
      network_fee: feeDetails.network_fee,
      network_fee_usd: feeDetails.network_fee_usd,
    });
    return json(result);
  } catch (error) {
    console.error("Crypto withdrawal execution failed.", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return json({
      error: error instanceof Error ? error.message : "Withdrawal execution failed.",
    }, 400);
  } finally {
    activeAdmin = null;
  }
});
