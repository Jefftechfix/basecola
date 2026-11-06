import { Turnkey } from "npm:@turnkey/sdk-server@8.9.0";
import { alchemyEthereumRpcUrl } from "../_shared/alchemy.ts";
import { createSupabaseClient } from "../_shared/supabase.ts";
import { turnkeyAccountParamsForNetwork } from "../../../src/lib/turnkey-account.service.ts";
import { isCryptoNetwork, type CryptoNetwork } from "../../../src/lib/crypto/networks.ts";
import {
  COMPANY_TREASURY_ADDRESSES,
  companyTreasuryAddressMatches,
} from "../../../src/lib/company-treasury-addresses.ts";

const TREASURY_NETWORKS: CryptoNetwork[] = [
  "bitcoin-mainnet",
  "ethereum-mainnet",
  "solana-mainnet",
  "xrpl-mainnet",
];

type TreasuryWalletRecord = {
  walletId: string;
  walletName: string;
  createdAt: string;
  network: CryptoNetwork;
  address: string;
};

type TreasuryBalance = {
  asset: string;
  balance: string;
  blockNumber: number | null;
  observationRef: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function timestampToIso(timestamp: { seconds: string; nanos: string }): string {
  if (!/^\d+$/.test(timestamp.seconds) || !/^\d+$/.test(timestamp.nanos)) {
    throw new Error("Turnkey returned an invalid wallet creation timestamp.");
  }
  const nanos = BigInt(timestamp.nanos);
  if (nanos > 999_999_999n) {
    throw new Error("Turnkey returned an invalid wallet creation timestamp.");
  }
  const milliseconds = Number(BigInt(timestamp.seconds) * 1000n + nanos / 1_000_000n);
  if (!Number.isSafeInteger(milliseconds)) {
    throw new Error("Turnkey returned an invalid wallet creation timestamp.");
  }
  return new Date(milliseconds).toISOString();
}

function secureProviderUrl(value: string, name: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`Invalid blockchain provider URL: ${name}`);
  }
  const isLoopback = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  if (
    (url.protocol !== "https:" && !(isLoopback && url.protocol === "http:")) ||
    url.username ||
    url.password
  ) {
    throw new Error(`Blockchain provider URL must use HTTPS: ${name}`);
  }
  return url.toString();
}

async function providerJson(url: string, init?: RequestInit): Promise<Record<string, unknown>> {
  let response: Response;
  try {
    response = await fetch(url, { ...init, signal: AbortSignal.timeout(10_000) });
  } catch {
    throw new Error("Blockchain provider request failed.");
  }
  if (!response.ok) throw new Error(`Blockchain provider returned HTTP ${response.status}.`);
  const payload: unknown = await response.json();
  if (!isRecord(payload)) throw new Error("Blockchain provider returned an invalid response.");
  return payload;
}

async function jsonRpc(url: string, method: string, params: unknown[]): Promise<unknown> {
  const payload = await providerJson(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  if (payload.error) throw new Error(`Blockchain RPC method failed: ${method}.`);
  return payload.result;
}

function parseHexInteger(value: unknown): number {
  if (typeof value !== "string" || !/^0x[0-9a-f]+$/i.test(value)) {
    throw new Error("Blockchain provider returned an invalid integer.");
  }
  const parsed = Number(BigInt(value));
  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    throw new Error("Blockchain provider returned an unsafe integer.");
  }
  return parsed;
}

function formatBaseUnits(value: bigint, precision: number): string {
  if (value < 0n) throw new Error("Blockchain provider returned a negative balance.");
  const scale = 10n ** BigInt(precision);
  const whole = value / scale;
  const fraction = (value % scale).toString().padStart(precision, "0").replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole.toString();
}

async function getEthereumBalances(address: string): Promise<TreasuryBalance[]> {
  const rpcUrl = secureProviderUrl(alchemyEthereumRpcUrl(), "ALCHEMY_ETHEREUM_RPC_URL");
  if (!/^0x[0-9a-f]{40}$/i.test(address)) {
    throw new Error("Turnkey returned an invalid Ethereum address.");
  }
  const contractAddress = requiredEnvironmentValue("ETHEREUM_USDT_CONTRACT_ADDRESS");
  if (!/^0x[0-9a-f]{40}$/i.test(contractAddress)) {
    throw new Error("Invalid Edge Function secret: ETHEREUM_USDT_CONTRACT_ADDRESS");
  }

  const [nativeHex, blockHex, usdtHex] = await Promise.all([
    jsonRpc(rpcUrl, "eth_getBalance", [address, "latest"]),
    jsonRpc(rpcUrl, "eth_blockNumber", []),
    jsonRpc(rpcUrl, "eth_call", [
      {
        to: contractAddress,
        data: `0x70a08231${address.slice(2).toLowerCase().padStart(64, "0")}`,
      },
      "latest",
    ]),
  ]);
  const blockNumber = parseHexInteger(blockHex);
  const observationRef = `ethereum-mainnet:${blockNumber}`;
  if (typeof nativeHex !== "string" || typeof usdtHex !== "string") {
    throw new Error("Ethereum provider returned an invalid balance.");
  }
  return [
    {
      asset: "ETH",
      balance: formatBaseUnits(BigInt(nativeHex), 18),
      blockNumber,
      observationRef,
    },
    {
      asset: "USDT",
      balance: formatBaseUnits(BigInt(usdtHex), 6),
      blockNumber,
      observationRef,
    },
  ];
}

async function getBitcoinBalance(address: string): Promise<TreasuryBalance[]> {
  const baseUrl = secureProviderUrl(
    requiredEnvironmentValue("BITCOIN_ESPLORA_URL"),
    "BITCOIN_ESPLORA_URL",
  ).replace(/\/+$/, "");
  const response = await providerJson(`${baseUrl}/address/${encodeURIComponent(address)}`);
  const chainStats = response.chain_stats;
  if (!isRecord(chainStats))
    throw new Error("Bitcoin provider returned invalid address statistics.");
  const funded = chainStats.funded_txo_sum;
  const spent = chainStats.spent_txo_sum;
  if (
    typeof funded !== "number" ||
    !Number.isSafeInteger(funded) ||
    typeof spent !== "number" ||
    !Number.isSafeInteger(spent) ||
    funded < spent
  ) {
    throw new Error("Bitcoin provider returned an invalid confirmed balance.");
  }
  return [
    {
      asset: "BTC",
      balance: formatBaseUnits(BigInt(funded - spent), 8),
      blockNumber: null,
      observationRef: `bitcoin-mainnet:${crypto.randomUUID()}`,
    },
  ];
}

async function getSolanaBalance(address: string): Promise<TreasuryBalance[]> {
  const rpcUrl = secureProviderUrl(
    requiredEnvironmentValue("SOLANA_MAINNET_RPC_URL"),
    "SOLANA_MAINNET_RPC_URL",
  );
  const result = await jsonRpc(rpcUrl, "getBalance", [address, { commitment: "finalized" }]);
  if (
    !isRecord(result) ||
    !isRecord(result.context) ||
    typeof result.context.slot !== "number" ||
    !Number.isSafeInteger(result.context.slot)
  ) {
    throw new Error("Solana provider returned an invalid balance response.");
  }
  const value = result.value;
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw new Error("Solana provider returned an invalid balance.");
  }
  const blockNumber = result.context.slot as number;
  return [
    {
      asset: "SOL",
      balance: formatBaseUnits(BigInt(value), 9),
      blockNumber,
      observationRef: `solana-mainnet:${blockNumber}`,
    },
  ];
}

async function getXrpBalance(address: string): Promise<TreasuryBalance[]> {
  const rpcUrl = secureProviderUrl(
    requiredEnvironmentValue("XRPL_MAINNET_RPC_URL"),
    "XRPL_MAINNET_RPC_URL",
  );
  const payload = await providerJson(rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      method: "account_info",
      params: [{ account: address, ledger_index: "validated", strict: true }],
    }),
  });
  const result = payload.result;
  if (!isRecord(result)) throw new Error("XRP Ledger returned an invalid account response.");
  if (result.error === "actNotFound") {
    return [
      {
        asset: "XRP",
        balance: "0",
        blockNumber: null,
        observationRef: `xrpl-mainnet:${crypto.randomUUID()}`,
      },
    ];
  }
  const accountData = result.account_data;
  if (!isRecord(accountData) || typeof accountData.Balance !== "string") {
    throw new Error("XRP Ledger returned an invalid account balance.");
  }
  const blockNumber = typeof result.ledger_index === "number" ? result.ledger_index : null;
  return [
    {
      asset: "XRP",
      balance: formatBaseUnits(BigInt(accountData.Balance), 6),
      blockNumber,
      observationRef: `xrpl-mainnet:${blockNumber ?? crypto.randomUUID()}`,
    },
  ];
}

async function getWalletBalances(
  network: CryptoNetwork,
  address: string,
): Promise<TreasuryBalance[]> {
  switch (network) {
    case "bitcoin-mainnet":
      return getBitcoinBalance(address);
    case "ethereum-mainnet":
      return getEthereumBalances(address);
    case "solana-mainnet":
      return getSolanaBalance(address);
    case "xrpl-mainnet":
      return getXrpBalance(address);
    default:
      throw new Error("Unsupported company treasury network.");
  }
}

function requiredEnvironmentValue(name: string): string {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error(`Missing Edge Function secret: ${name}`);
  return value;
}

function requiredTurnkeyOrganizationId(): string {
  return requiredEnvironmentValue("TURNKEY_ORGANIZATION_ID");
}

async function refreshTreasuryWallet(
  admin: ReturnType<typeof createSupabaseClient>,
  walletAccountId: string,
) {
  const { data: wallet, error: walletError } = await admin
    .from("treasury_wallet_accounts")
    .select("id, network, address, turnkey_wallet_id")
    .eq("id", walletAccountId)
    .not("turnkey_wallet_id", "is", null)
    .maybeSingle();
  if (walletError) throw new Error("Could not load the synchronized treasury wallet.");
  if (!wallet) throw new Error("The synchronized treasury wallet was not found.");
  if (!isCryptoNetwork(wallet.network)) throw new Error("Unsupported company treasury network.");

  const balances = await getWalletBalances(wallet.network, wallet.address);
  const observedAt = new Date().toISOString();
  for (const balance of balances) {
    const { error } = await admin.rpc("record_treasury_balance_observation", {
      _network: wallet.network,
      _address: wallet.address,
      _asset: balance.asset,
      _balance: balance.balance,
      _amount_usd: null,
      _block_number: balance.blockNumber,
      _block_hash: null,
      _observation_ref: balance.observationRef,
      _observed_at: observedAt,
    });
    if (error) throw new Error("Could not save the verified treasury balance observation.");
  }
  return balances.map(({ asset, balance, blockNumber }) => ({
    asset,
    balance,
    blockNumber,
    observedAt,
  }));
}

function createTurnkeyApiClient() {
  return new Turnkey({
    apiBaseUrl: "https://api.turnkey.com",
    apiPrivateKey: requiredEnvironmentValue("TURNKEY_API_PRIVATE_KEY").replace(/\\n/g, "\n"),
    apiPublicKey: requiredEnvironmentValue("TURNKEY_API_PUBLIC_KEY"),
    defaultOrganizationId: requiredTurnkeyOrganizationId(),
  }).apiClient();
}

async function listExistingTurnkeyWallets() {
  const client = createTurnkeyApiClient();
  const { wallets } = await client.getWallets({});
  return wallets.map((wallet) => ({
    walletId: wallet.walletId,
    walletName: wallet.walletName,
    createdAt: timestampToIso(wallet.createdAt),
  }));
}

async function getExistingTreasuryWallets(ids: string[]): Promise<TreasuryWalletRecord[]> {
  const client = createTurnkeyApiClient();
  const records: TreasuryWalletRecord[] = [];
  const expectedOrganizationId = requiredTurnkeyOrganizationId();

  for (const walletId of ids) {
    const { wallet } = await client.getWallet({ walletId });
    if (!wallet) {
      throw new Error("A configured treasury wallet was not found in the Turnkey organization.");
    }

    const { accounts } = await client.getWalletAccounts({ walletId });
    const matchingAccounts = TREASURY_NETWORKS.flatMap((network) => {
      const params = turnkeyAccountParamsForNetwork(network);
      return accounts
        .filter(
          (account) =>
            account.path === params.path && account.addressFormat === params.addressFormat,
        )
        .map((account) => ({ network, account }));
    });

    if (matchingAccounts.length !== 1) {
      throw new Error(
        "Each configured treasury wallet must have exactly one supported mainnet account.",
      );
    }

    const match = matchingAccounts[0];
    if (
      !match.account.address ||
      !match.account.walletAccountId ||
      match.account.organizationId !== expectedOrganizationId
    ) {
      throw new Error("Turnkey returned an incomplete treasury wallet account.");
    }
    records.push({
      walletId,
      walletName: wallet.walletName,
      createdAt: timestampToIso(wallet.createdAt),
      network: match.network,
      address: match.account.address,
    });
  }

  return records;
}

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status });
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);

  const token = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return json({ error: "Authentication required." }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey =
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SECRET_KEY");
  if (!supabaseUrl || !anonKey || !serviceKey) {
    return json({ error: "Treasury synchronization is not configured." }, 503);
  }

  const authClient = createSupabaseClient(supabaseUrl, anonKey, {
    Authorization: `Bearer ${token}`,
  });
  const { data: auth, error: authError } = await authClient.auth.getUser(token);
  if (authError || !auth.user) return json({ error: "Authentication required." }, 401);

  const admin = createSupabaseClient(supabaseUrl, serviceKey);
  const { data: role, error: roleError } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", auth.user.id)
    .eq("role", "admin")
    .maybeSingle();
  if (roleError) return json({ error: "Could not verify administrator access." }, 500);
  if (!role) return json({ error: "Administrator access required." }, 403);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid request body." }, 400);
  }
  if (!isRecord(body)) return json({ error: "Invalid request body." }, 400);

  if (body.action === "discover") {
    try {
      return json({ wallets: await listExistingTurnkeyWallets() });
    } catch (error) {
      console.error("Company treasury Turnkey discovery failed.");
      return json({ error: "Could not list wallets in the configured Turnkey organization." }, 503);
    }
  }

  if (body.action === "refresh") {
    if (
      typeof body.walletAccountId !== "string" ||
      !/^[0-9a-f-]{36}$/i.test(body.walletAccountId)
    ) {
      return json({ error: "A valid treasury wallet account ID is required." }, 400);
    }
    try {
      const balances = await refreshTreasuryWallet(admin, body.walletAccountId);
      return json({ balances });
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      const knownErrors = new Set([
        "Could not load the synchronized treasury wallet.",
        "The synchronized treasury wallet was not found.",
        "Could not save the verified treasury balance observation.",
      ]);
      console.error("Company treasury balance refresh failed.");
      return json(
        {
          error: knownErrors.has(message)
            ? message
            : "Could not refresh the treasury balance. Check the configured blockchain providers.",
        },
        503,
      );
    }
  }

  if (body.action !== "sync") return json({ error: "Unsupported treasury action." }, 400);

  if (
    !Array.isArray(body.walletIds) ||
    body.walletIds.length !== 4 ||
    body.walletIds.some((id) => typeof id !== "string" || !id.trim()) ||
    new Set(body.walletIds.map((id: string) => id.trim())).size !== 4
  ) {
    return json({ error: "Select exactly four unique existing Turnkey wallets." }, 400);
  }

  try {
    const wallets: TreasuryWalletRecord[] = await getExistingTreasuryWallets(
      body.walletIds.map((id: string) => id.trim()),
    );
    if (new Set(wallets.map((wallet) => wallet.network)).size !== 4) {
      return json(
        { error: "Select exactly one existing Turnkey wallet for each supported network." },
        400,
      );
    }
    const mismatch = wallets.find(
      (wallet) =>
        !companyTreasuryAddressMatches(wallet.network, wallet.address),
    );
    if (mismatch) {
      return json(
        {
          error:
            `Turnkey address mismatch for ${mismatch.network}. ` +
            `Expected ${COMPANY_TREASURY_ADDRESSES[mismatch.network]}, ` +
            `but Turnkey returned ${mismatch.address}. No wallets were saved.`,
        },
        400,
      );
    }
    const { data: count, error } = await admin.rpc("sync_company_treasury_wallets", {
      _wallets: wallets.map((wallet) => ({
        walletId: wallet.walletId,
        walletName: wallet.walletName,
        createdAt: wallet.createdAt,
        network: wallet.network,
        address: wallet.address,
      })),
    });
    if (error) {
      console.error("Company treasury wallet synchronization failed at the database.");
      return json({ error: "Could not safely synchronize the Turnkey treasury wallets." }, 500);
    }
    return json({
      synchronized: count,
      wallets: wallets.map(({ walletId, walletName, createdAt, network, address }) => ({
        walletId,
        walletName,
        createdAt,
        network,
        address,
      })),
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown synchronization error.";
    console.error("Company treasury wallet synchronization failed.");
    const knownDetails = new Set([
      "A configured treasury wallet was not found in the Turnkey organization.",
      "Each configured treasury wallet must have exactly one supported mainnet account.",
      "Turnkey returned an incomplete treasury wallet account.",
      "Turnkey returned an invalid wallet creation timestamp.",
    ]);
    return json(
      {
        error: knownDetails.has(detail)
          ? detail
          : "Turnkey synchronization failed. Check the server-side credentials and organization access.",
      },
      503,
    );
  }
});
