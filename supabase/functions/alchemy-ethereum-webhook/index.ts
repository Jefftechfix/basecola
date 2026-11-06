import { createSupabaseClient } from "../_shared/supabase.ts";
import { alchemyEthereumRpcUrl } from "../_shared/alchemy.ts";
import {
  processAlchemyEthereumWebhook,
  type AlchemyDepositObservation,
} from "../../../src/lib/alchemy-deposit-observer.ts";
import { verifyAlchemyWebhookSignature } from "../../../src/lib/crypto/alchemy.ts";
import { isRecord } from "../../../src/lib/crypto/validation.ts";

const BODY_LIMIT = 1_048_576;

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status });
}

async function readBodyWithinLimit(request: Request): Promise<string | null> {
  const reader = request.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > BODY_LIMIT) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);

  const signingKey = Deno.env.get("ALCHEMY_ETHEREUM_WEBHOOK_SIGNING_KEY")?.trim();
  const expectedWebhookId = Deno.env.get("ALCHEMY_ETHEREUM_WEBHOOK_ID")?.trim();
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey =
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SECRET_KEY");
  if (!signingKey || !expectedWebhookId || !supabaseUrl || !serviceKey) {
    return json({ error: "Alchemy Ethereum webhook is not configured." }, 503);
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > BODY_LIMIT) return json({ error: "Payload too large." }, 413);
  const body = await readBodyWithinLimit(request);
  if (body === null) return json({ error: "Payload too large." }, 413);

  const signature = request.headers.get("x-alchemy-signature") ?? "";
  if (!(await verifyAlchemyWebhookSignature(body, signature, signingKey))) {
    return json({ error: "Invalid Alchemy signature." }, 401);
  }

  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return json({ error: "Invalid JSON payload." }, 400);
  }
  if (
    !isRecord(payload) ||
    payload.webhookId !== expectedWebhookId ||
    payload.type !== "ADDRESS_ACTIVITY"
  ) {
    return json({ error: "Unexpected Alchemy webhook." }, 400);
  }

  const contractAddress = Deno.env.get("ETHEREUM_USDT_CONTRACT_ADDRESS")?.trim();
  let rpcUrl: string;
  try {
    rpcUrl = alchemyEthereumRpcUrl();
  } catch {
    return json({ error: "Ethereum deposit monitoring is not configured." }, 503);
  }
  if (!contractAddress || !/^0x[0-9a-f]{40}$/i.test(contractAddress) || !rpcUrl) {
    return json({ error: "Ethereum deposit monitoring is not configured." }, 503);
  }
  let parsedRpcUrl: URL;
  try {
    parsedRpcUrl = new URL(rpcUrl);
  } catch {
    return json({ error: "Ethereum deposit monitoring is not configured." }, 503);
  }
  const localRpc = ["localhost", "127.0.0.1", "::1"].includes(parsedRpcUrl.hostname);
  if (parsedRpcUrl.protocol !== "https:" && !(localRpc && parsedRpcUrl.protocol === "http:")) {
    return json({ error: "Ethereum deposit monitoring is not configured." }, 503);
  }

  const admin = createSupabaseClient(supabaseUrl, serviceKey);
  try {
    const observed = await processAlchemyEthereumWebhook(
      payload,
      { rpcUrl, usdtContractAddress: contractAddress },
      {
        getDepositPolicy: async (asset) => {
          const { data, error } = await admin
            .from("platform_asset_networks")
            .select("enabled, required_confirmations")
            .eq("asset", asset)
            .eq("network", "ethereum-mainnet")
            .maybeSingle();
          if (error) throw new Error("Could not load Ethereum deposit policy.");
          return data
            ? { enabled: data.enabled, requiredConfirmations: data.required_confirmations }
            : null;
        },
        hasObservation: async (txHash, eventIndex) => {
          const { data, error } = await admin
            .from("deposit_observations")
            .select("id")
            .eq("network", "ethereum-mainnet")
            .eq("tx_hash", txHash)
            .eq("event_index", eventIndex)
            .maybeSingle();
          if (error) throw new Error("Could not load the existing deposit observation.");
          return Boolean(data);
        },
        getWallet: async (address) => {
          const { data, error } = await admin
            .from("wallet_accounts")
            .select("address")
            .eq("network", "ethereum-mainnet")
            .eq("status", "active")
            .ilike("address", address)
            .maybeSingle();
          if (error) throw new Error("Could not resolve the Ethereum deposit address.");
          return data?.address ? { address: data.address } : null;
        },
        recordDeposit: async (event: AlchemyDepositObservation) => {
          const { error } = await admin.rpc("record_chain_deposit", {
            _network: event.network,
            _asset: event.asset,
            _tx_hash: event.txHash,
            _event_index: event.eventIndex,
            _deposit_address: event.depositAddress,
            _destination_tag: event.destinationTag,
            _crypto_amount: event.amount,
            _amount_usd: event.amountUsd,
            _block_number: event.blockNumber,
            _block_hash: event.blockHash,
            _confirmations: event.confirmations,
            _required_confirmations: event.requiredConfirmations,
            _is_failed: event.isFailed,
            _failure_reason: event.failureReason,
            _observed_at: event.observedAt,
            _sender_address: event.senderAddress,
          });
          if (error) throw new Error("Could not record crypto deposit observation.");
        },
      },
    );
    return json({ received: true, observed });
  } catch (error) {
    console.error("Alchemy Ethereum webhook processing failed.", error);
    return json({ error: "Could not process Alchemy Ethereum webhook." }, 500);
  }
});
