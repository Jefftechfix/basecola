import { createFileRoute } from "@tanstack/react-router";
import { sendConfirmedDepositEmail } from "@/lib/confirmed-deposit-email.server";

async function readBodyWithinLimit(request: Request, limit: number): Promise<ArrayBuffer | null> {
  const reader = request.body?.getReader();
  if (!reader) return new ArrayBuffer(0);
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > limit) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new ArrayBuffer(total);
  const view = new Uint8Array(bytes);
  let offset = 0;
  for (const chunk of chunks) {
    view.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

export const Route = createFileRoute("/api/internal/crypto-deposits")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/+$/, "");
        const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
        if (!supabaseUrl || !supabaseKey) {
          return new Response("Supabase Edge Function forwarding is not configured.", {
            status: 503,
          });
        }

        const contentLength = Number(request.headers.get("content-length") ?? 0);
        if (contentLength > 16_384) return new Response("Payload too large.", { status: 413 });

        const body = await readBodyWithinLimit(request, 16_384);
        if (body === null) return new Response("Payload too large.", { status: 413 });

        let response: Response;
        try {
          response = await fetch(`${supabaseUrl}/functions/v1/crypto-deposit-ingestion`, {
            method: "POST",
            headers: {
              apikey: supabaseKey,
              authorization: request.headers.get("authorization") ?? "",
              "content-type": request.headers.get("content-type") ?? "application/json",
            },
            body,
            signal: AbortSignal.timeout(20_000),
          });
        } catch {
          return new Response("Could not forward the deposit observation.", { status: 502 });
        }

        const responseBody = await response.text();
        if (response.ok) {
          try {
            const result: unknown = JSON.parse(responseBody);
            if (
              result &&
              typeof result === "object" &&
              "observationId" in result &&
              typeof result.observationId === "string"
            ) {
              await sendConfirmedDepositEmail(result.observationId);
            } else {
              throw new Error("Deposit ingestion returned no observation ID.");
            }
          } catch (error) {
            console.error("Confirmed deposit email notification failed.", error);
            return new Response("Deposit was recorded, but its email notification could not be completed. Retry this observation.", {
              status: 503,
            });
          }
        }

        return new Response(responseBody, {
          status: response.status,
          headers: { "content-type": response.headers.get("content-type") ?? "application/json" },
        });
      },
    },
  },
});
