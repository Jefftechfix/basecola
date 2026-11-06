import { Turnkey } from "npm:@turnkey/sdk-server@8.9.0";
import { alchemyApiKey, alchemyEthereumRpcUrl, alchemyNotifyApiKey } from "../_shared/alchemy.ts";
import { createSupabaseClient } from "../_shared/supabase.ts";
import {
  getTurnkeyWalletAccount,
  turnkeyAccountParamsForNetwork,
  type TurnkeyWalletAccount,
} from "../../../src/lib/turnkey-account.service.ts";
import type { CryptoNetwork } from "../../../src/lib/crypto/networks.ts";

const MAINNET_NETWORKS: CryptoNetwork[] = [
  "bitcoin-mainnet",
  "ethereum-mainnet",
  "solana-mainnet",
  "xrpl-mainnet",
];

type WalletProvisioningState = {
  network: CryptoNetwork;
  status: string;
  address: string | null;
  destination_tag: number | null;
};

function requiredEnvironmentValue(name: string): string {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error(`Missing Edge Function secret: ${name}`);
  return value;
}

function requiredSecureProviderUrl(name: string): void {
  const value = requiredEnvironmentValue(name);
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`Invalid blockchain provider URL: ${name}`);
  }
  const isLocal = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  if (url.protocol !== "https:" && !(isLocal && url.protocol === "http:")) {
    throw new Error(`Blockchain provider URL must use HTTPS: ${name}`);
  }
}

function assertMainnetWalletProvisioningReady(): void {
  if (Deno.env.get("CRYPTO_MAINNET_WALLETS_ENABLED") !== "true") {
    throw new Error(
      "Mainnet wallet provisioning is disabled until deposit monitoring is operational.",
    );
  }
  for (const name of ["BITCOIN_ESPLORA_URL", "SOLANA_MAINNET_RPC_URL", "XRPL_MAINNET_RPC_URL"]) {
    requiredSecureProviderUrl(name);
  }
  const ethereumRpcUrl = alchemyEthereumRpcUrl();
  let ethereumUrl: URL;
  try {
    ethereumUrl = new URL(ethereumRpcUrl);
  } catch {
    throw new Error("Invalid Ethereum RPC provider URL.");
  }
  const isLocal = ["localhost", "127.0.0.1", "::1"].includes(ethereumUrl.hostname);
  if (ethereumUrl.protocol !== "https:" && !(isLocal && ethereumUrl.protocol === "http:")) {
    throw new Error("Ethereum RPC provider URL must use HTTPS.");
  }
  if (!/^0x[0-9a-f]{40}$/i.test(requiredEnvironmentValue("ETHEREUM_USDT_CONTRACT_ADDRESS"))) {
    throw new Error("Invalid Edge Function secret: ETHEREUM_USDT_CONTRACT_ADDRESS");
  }
  requiredEnvironmentValue("ALCHEMY_ETHEREUM_WEBHOOK_ID");
  if (requiredEnvironmentValue("ALCHEMY_ETHEREUM_WEBHOOK_SIGNING_KEY").length < 16) {
    throw new Error("ALCHEMY_ETHEREUM_WEBHOOK_SIGNING_KEY is too short.");
  }
  alchemyApiKey();
  if (requiredEnvironmentValue("CRYPTO_MONITOR_SECRET").length < 32) {
    throw new Error("CRYPTO_MONITOR_SECRET must contain at least 32 characters.");
  }
}

function createTurnkeyApiClient() {
  return new Turnkey({
    apiBaseUrl: "https://api.turnkey.com",
    apiPrivateKey: requiredEnvironmentValue("TURNKEY_API_PRIVATE_KEY").replace(/\\n/g, "\n"),
    apiPublicKey: requiredEnvironmentValue("TURNKEY_API_PUBLIC_KEY"),
    defaultOrganizationId: requiredEnvironmentValue("TURNKEY_ORGANIZATION_ID"),
  }).apiClient();
}

async function findWalletId(client: ReturnType<typeof createTurnkeyApiClient>, name: string) {
  const { wallets } = await client.getWallets({});
  const matches = wallets.filter((wallet) => wallet.walletName === name);
  if (matches.length > 1) throw new Error("Multiple Turnkey wallets match the idempotency name.");
  return matches[0]?.walletId;
}

async function getOrCreateWalletAccount(
  client: ReturnType<typeof createTurnkeyApiClient>,
  userId: string,
  network: CryptoNetwork,
): Promise<TurnkeyWalletAccount> {
  const walletName = `basecola:${userId}:${network}:v1`;
  const accountParams = turnkeyAccountParamsForNetwork(network);
  let walletId = await findWalletId(client, walletName);
  if (!walletId) {
    try {
      const created = await client.createWallet({ walletName, accounts: [accountParams] });
      walletId = created.walletId;
    } catch (error) {
      walletId = await findWalletId(client, walletName);
      if (!walletId) throw error;
    }
  }
  return getTurnkeyWalletAccount(client, walletId, accountParams);
}

async function registerAlchemyEthereumAddress(address: string): Promise<void> {
  const apiKey = alchemyNotifyApiKey();
  const webhookId = requiredEnvironmentValue("ALCHEMY_ETHEREUM_WEBHOOK_ID");
  if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
    throw new Error("Cannot register an invalid Ethereum deposit address.");
  }

  let response: Response;
  try {
    response = await fetch("https://dashboard.alchemy.com/api/update-webhook-addresses", {
      method: "PATCH",
      headers: { "content-type": "application/json", "X-Alchemy-Token": apiKey },
      body: JSON.stringify({
        webhook_id: webhookId,
        addresses_to_add: [address],
        addresses_to_remove: [],
      }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new Error("Could not register the Ethereum address with Alchemy.");
  }
  if (!response.ok) {
    throw new Error(`Alchemy webhook address registration failed (HTTP ${response.status}).`);
  }
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
    return json({ error: "Wallet provisioning is not configured." }, 503);
  }

  const authClient = createSupabaseClient(supabaseUrl, anonKey, {
    Authorization: `Bearer ${token}`,
  });
  const { data: auth, error: authError } = await authClient.auth.getUser(token);
  if (authError || !auth.user) return json({ error: "Authentication required." }, 401);

  const admin = createSupabaseClient(supabaseUrl, serviceKey);
  const userId = auth.user.id;

  try {
    assertMainnetWalletProvisioningReady();
  } catch (error) {
    if (error instanceof Error && error.message.includes("disabled until deposit monitoring")) {
      return json(
        MAINNET_NETWORKS.map((network) => ({
          network,
          status: "monitoring_not_ready",
          address: null,
          destination_tag: null,
        })),
      );
    }
    console.error("Wallet provisioning configuration is invalid.", error);
    return json({ error: "Wallet provisioning is not configured." }, 503);
  }

  const { error: currentError } = await admin
    .from("wallet_accounts")
    .select("network, status, address, destination_tag")
    .eq("user_id", userId)
    .in("network", MAINNET_NETWORKS);
  if (currentError) return json({ error: "Could not load wallet provisioning status." }, 500);

  const turnkey = createTurnkeyApiClient();
  for (const network of MAINNET_NETWORKS) {
    const { data: claimed, error: claimError } = await admin.rpc("claim_custody_provisioning_job", {
      _user_id: userId,
      _network: network,
      _lease_seconds: 120,
    });
    if (claimError) return json({ error: "Could not claim the wallet provisioning job." }, 500);
    const job = claimed?.[0];
    if (!job) continue;

    try {
      const account = await getOrCreateWalletAccount(turnkey, userId, network);
      if (network === "ethereum-mainnet") await registerAlchemyEthereumAddress(account.address);

      const { error: accountError } = await admin
        .from("wallet_accounts")
        .update({
          turnkey_wallet_id: account.walletId,
          turnkey_account_id: account.accountId,
          address: account.address,
          status: "active",
        })
        .eq("user_id", userId)
        .eq("network", network);
      if (accountError) throw new Error("wallet_record_write_failed");

      const { error: completeError } = await admin
        .from("custody_provisioning_jobs")
        .update({ status: "completed", locked_until: null })
        .eq("id", job.id);
      if (completeError) throw new Error("provisioning_job_completion_failed");
    } catch (error) {
      const errorCode =
        error instanceof Error && error.message === "wallet_record_write_failed"
          ? "database_write_failed"
          : "turnkey_provisioning_failed";
      const { error: retryError } = await admin
        .from("custody_provisioning_jobs")
        .update({
          status: "retry",
          available_at: new Date(Date.now() + 60_000).toISOString(),
          locked_until: null,
          last_error_code: errorCode,
        })
        .eq("id", job.id);
      if (retryError) {
        console.error("Provisioning failed and the retry state could not be saved.", {
          userId,
          network,
        });
        return json(
          { error: "Wallet provisioning failed and could not be queued for retry." },
          500,
        );
      }
      console.error("Wallet provisioning failed.", { userId, network, errorCode });
      return json({ error: `Wallet provisioning failed (${errorCode}).` }, 502);
    }
  }

  const { data: latest, error: latestError } = await admin
    .from("wallet_accounts")
    .select("network, status, address, destination_tag")
    .eq("user_id", userId)
    .in("network", MAINNET_NETWORKS);
  if (latestError)
    return json({ error: "Could not load the updated wallet provisioning status." }, 500);

  const wallets: WalletProvisioningState[] = MAINNET_NETWORKS.map((network) => {
    const account = latest?.find((row) => row.network === network);
    return {
      network,
      status: account?.status ?? "pending",
      address: account?.status === "active" ? account.address : null,
      destination_tag: account?.status === "active" ? account.destination_tag : null,
    };
  });
  return json(wallets);
});
