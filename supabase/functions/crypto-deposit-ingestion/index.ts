import { createSupabaseClient } from "../_shared/supabase.ts";
import { parseChainDepositEvent } from "../../../src/lib/crypto/deposits.ts";

const BODY_LIMIT = 16_384;

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status });
}

function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
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

  const secret = Deno.env.get("CRYPTO_MONITOR_SECRET") ?? "";
  if (secret.length < 32) return json({ error: "Deposit monitor is not configured." }, 503);
  const authorization = request.headers.get("authorization") ?? "";
  const suppliedSecret = authorization.match(/^Bearer (.+)$/)?.[1] ?? "";
  if (!constantTimeEqual(suppliedSecret, secret)) return json({ error: "Unauthorized." }, 401);

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > BODY_LIMIT) return json({ error: "Payload too large." }, 413);
  const body = await readBodyWithinLimit(request);
  if (body === null) return json({ error: "Payload too large." }, 413);

  let input: unknown;
  try {
    input = JSON.parse(body);
  } catch {
    return json({ error: "Invalid JSON payload." }, 400);
  }
  const event = parseChainDepositEvent(input);
  if (!event) return json({ error: "Invalid deposit observation." }, 400);

  if (event.asset === "USDT") {
    const configuredContract = Deno.env.get("ETHEREUM_USDT_CONTRACT_ADDRESS")?.trim();
    if (!configuredContract) return json({ error: "USDT deposits are not configured." }, 503);
    if (event.tokenContract?.toLowerCase() !== configuredContract.toLowerCase()) {
      return json({ error: "Token contract does not match the configured USDT contract." }, 400);
    }
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey =
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SECRET_KEY");
  if (!supabaseUrl || !serviceKey)
    return json({ error: "Deposit ingestion is not configured." }, 503);

  const admin = createSupabaseClient(supabaseUrl, serviceKey);
  const { data: observationId, error } = await admin.rpc("record_chain_deposit", {
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
    _observed_at: event.observedAt ?? undefined,
    _sender_address: event.senderAddress ?? undefined,
  });
  if (error) {
    console.error("Could not record chain deposit observation.", {
      network: event.network,
      txHash: event.txHash,
      error,
    });
    return json({ error: "Could not record the deposit observation." }, 500);
  }
  return json({ received: true, observationId });
});
