import { createFileRoute } from "@tanstack/react-router";

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

        let event: { type?: string; data?: { object?: Record<string, any> } };
        try {
          event = JSON.parse(payload);
        } catch {
          return new Response("Invalid payload", { status: 400 });
        }
        const session = event.data?.object;
        if (!session || session.object !== "checkout.session" || typeof session.id !== "string") return ok();

        const isBank = session.metadata?.method === "bank";
        let status: string | null = null;
        if (event.type === "checkout.session.async_payment_succeeded") status = "completed";
        else if (event.type === "checkout.session.async_payment_failed") status = "failed";
        else if (event.type === "checkout.session.completed" && session.payment_status === "paid") status = "completed";
        if (!status) return ok();

        const userId = session.metadata?.user_id || session.client_reference_id;
        if (typeof userId !== "string") return ok();

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: existing, error } = await supabaseAdmin.from("wallet_fundings")
          .select("id, payment_method, status").eq("user_id", userId).eq("reference", session.id).maybeSingle();
        if (error) return new Response("Database error", { status: 500 });

        if (existing) {
          if (existing.status === "completed") return ok();
          const { error: updateError } = await supabaseAdmin.from("wallet_fundings")
            .update({ status, payment_method: existing.payment_method.replace(/ · awaiting bank verification$/, "") })
            .eq("id", existing.id);
          if (updateError) return new Response("Database error", { status: 500 });
        } else {
          const { error: insertError } = await supabaseAdmin.from("wallet_fundings").insert({
            user_id: userId,
            amount: Number(session.amount_total) / 100,
            currency: String(session.currency || "usd").toUpperCase(),
            payment_method: isBank ? "Stripe bank account" : "Stripe · card",
            reference: session.id,
            status,
          });
          if (insertError) return new Response("Database error", { status: 500 });
        }
        return ok();
      },
    },
  },
});
