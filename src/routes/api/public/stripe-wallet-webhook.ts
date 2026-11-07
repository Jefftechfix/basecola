import { createFileRoute } from "@tanstack/react-router";
import { syncStripeFundingTransaction } from "@/lib/stripe-transactions";

// Stripe Checkout events -> wallet_fundings status. Every request must carry a valid
// Stripe-Signature (HMAC-SHA256 with STRIPE_WEBHOOK_SECRET) before anything is written.

const TOLERANCE_SECONDS = 300;

function hex(buffer: ArrayBuffer) {
  return [...new Uint8Array(buffer)].map(b => b.toString(16).padStart(2, "0")).join("");
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function verifySignature(payload: string, header: string, secret: string) {
  const parts = header.split(",").map(p => p.split("=") as [string, string]);
  const timestamp = parts.find(([k]) => k === "t")?.[1];
  const signatures = parts.filter(([k]) => k === "v1").map(([, v]) => v);
  if (!timestamp || signatures.length === 0) return false;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > TOLERANCE_SECONDS) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const expected = hex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestamp}.${payload}`)));
  return signatures.some(sig => safeEqual(sig, expected));
}

const ok = () => Response.json({ received: true });

export const Route = createFileRoute("/api/public/stripe-wallet-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!secret) return new Response("Not configured", { status: 500 });

        const payload = await request.text();
        const header = request.headers.get("stripe-signature") ?? "";
        if (!(await verifySignature(payload, header, secret))) return new Response("Invalid signature", { status: 400 });

        let event: { type?: string; data?: { object?: Record<string, unknown> } };
        try {
          event = JSON.parse(payload);
        } catch {
          return new Response("Invalid payload", { status: 400 });
        }
        const session = event.data?.object;
        if (!session || session.object !== "checkout.session" || typeof session.id !== "string") return ok();
        const sessionId = session.id;

        const metadata =
          session.metadata && typeof session.metadata === "object" && !Array.isArray(session.metadata)
            ? session.metadata as Record<string, unknown>
            : {};
        const isBank = metadata.method === "bank";
        let status: string | null = null;
        if (event.type === "checkout.session.async_payment_succeeded") status = "completed";
        else if (event.type === "checkout.session.async_payment_failed") status = "failed";
        else if (event.type === "checkout.session.completed" && session.payment_status === "paid") status = "completed";
        if (!status) return ok();

        const userId = metadata.user_id || session.client_reference_id;
        if (typeof userId !== "string") return ok();

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const paymentMethod = isBank ? "Stripe bank account" : "Stripe · card";
        const { data: existing, error } = await supabaseAdmin.from("wallet_fundings")
          .select("id, payment_method, status").eq("user_id", userId).eq("reference", sessionId).maybeSingle();
        if (error) return new Response("Database error", { status: 500 });

        // Write the activity history first: if a later step fails, Stripe retries the
        // event and this step is skipped as already done instead of being lost.
        await syncStripeFundingTransaction(supabaseAdmin, {
          userId,
          sessionId,
          amountUsd: Number(session.amount_total) / 100,
          status,
          paymentMethod,
        });

        const emailReceipt = async (): Promise<boolean> => {
          if (status !== "completed") return true;
          try {
            const { data: funding, error: fundingError } = await supabaseAdmin
              .from("wallet_fundings")
              .select("*")
              .eq("user_id", userId)
              .eq("reference", sessionId)
              .maybeSingle();
            if (fundingError) throw fundingError;
            if (!funding) throw new Error("Completed wallet funding record was not found.");

            const { data: profile, error: profileError } = await supabaseAdmin
              .from("profiles")
              .select("email, full_name")
              .eq("id", userId)
              .maybeSingle();
            if (profileError) throw profileError;
            if (!profile?.email) throw new Error("Funding recipient has no email address.");

            const { sendReceipt } = await import("@/lib/receipt-email");
            await sendReceipt("funding", profile.email, profile.full_name, {
              ...funding,
              status: "completed",
            });
            return true;
          } catch (error) {
            console.error("Wallet funding was recorded, but its email notification failed.", error);
            return false;
          }
        };

        if (existing) {
          if (existing.status === "completed") {
            return (await emailReceipt())
              ? ok()
              : new Response("Funding was recorded, but its email notification failed.", { status: 500 });
          }
          const { error: updateError } = await supabaseAdmin.from("wallet_fundings")
            .update({ status, payment_method: existing.payment_method.replace(/ · awaiting bank verification$/, "") })
            .eq("id", existing.id);
          if (updateError) return new Response("Database error", { status: 500 });
        } else {
          const { error: insertError } = await supabaseAdmin.from("wallet_fundings").insert({
            user_id: userId,
            amount: Number(session.amount_total) / 100,
            currency: String(session.currency || "usd").toUpperCase(),
            payment_method: paymentMethod,
            reference: sessionId,
            status,
          });
          if (insertError) return new Response("Database error", { status: 500 });
        }
        return (await emailReceipt())
          ? ok()
          : new Response("Funding was recorded, but its email notification failed.", { status: 500 });
      },
    },
  },
});
