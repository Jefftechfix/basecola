import { createClient } from "https://esm.sh/@supabase/supabase-js@2.118.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MIN_CENTS = 100;
const MAX_CENTS = 1_000_000;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function fundingCents(value: unknown) {
  if (typeof value !== "string" || !/^\d+(\.\d{1,2})?$/.test(value.trim())) return 0;
  const cents = Math.round(Number(value.trim()) * 100);
  if (cents < MIN_CENTS || cents > MAX_CENTS) return 0;
  return cents;
}

function returnOrigin(value: unknown) {
  if (typeof value !== "string") return "https://crypto-basecamp-beacon.lovable.app";
  try {
    const url = new URL(value);
    const local = url.protocol === "http:" && (url.hostname === "localhost" || url.hostname === "127.0.0.1");
    const hosted = url.protocol === "https:" && (
      url.hostname === "crypto-basecamp-beacon.lovable.app" ||
      url.hostname.endsWith(".lovableproject.com") ||
      url.hostname.endsWith(".lovableproject-dev.com")
    );
    if (local || hosted) return url.origin;
  } catch {
    return "https://crypto-basecamp-beacon.lovable.app";
  }
  return "https://crypto-basecamp-beacon.lovable.app";
}

async function stripeRequest(secret: string, path: string, method: "GET" | "POST", body?: string) {
  const response = await fetch(`https://api.stripe.com/v1/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${secret}`,
      ...(body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    body,
  });
  const payload = await response.json();
  if (!response.ok) {
    const message = payload?.error?.message;
    throw new Error(typeof message === "string" ? message : "Stripe rejected the request.");
  }
  return payload;
}

function paymentLabel(session: {
  payment_intent?: { payment_method?: { type?: string; card?: { brand?: string; last4?: string } } };
  payment_method_types?: string[];
}) {
  const method = session.payment_intent?.payment_method;
  const last4 = method?.card?.last4;
  if (last4) {
    const brand = method?.card?.brand || "card";
    return `Stripe · ${brand} ending ${last4}`;
  }
  const type = method?.type || session.payment_method_types?.[0] || "card";
  return `Stripe · ${type}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
  if (!supabaseUrl || !anonKey || !stripeSecret) {
    return json({ error: "Stripe funding is not configured on the server." }, 500);
  }

  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "Log in to fund your wallet with Stripe." }, 401);

  const userClient = createClient(supabaseUrl, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: auth, error: authError } = await userClient.auth.getUser(token);
  if (authError || !auth.user) return json({ error: "Log in to fund your wallet with Stripe." }, 401);

  let body: { action?: string; amount?: string; origin?: string; sessionId?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Enter a funding amount." }, 400);
  }

  try {
    if (body.action === "checkout") {
      const cents = fundingCents(body.amount);
      if (!cents) return json({ error: "Enter a USD amount from $1.00 to $10,000.00." }, 400);
      const origin = returnOrigin(body.origin);
      const form = new URLSearchParams();
      form.set("mode", "payment");
      form.set("client_reference_id", auth.user.id);
      form.set("metadata[user_id]", auth.user.id);
      if (auth.user.email) form.set("customer_email", auth.user.email);
      form.set("line_items[0][quantity]", "1");
      form.set("line_items[0][price_data][currency]", "usd");
      form.set("line_items[0][price_data][unit_amount]", String(cents));
      form.set("line_items[0][price_data][product_data][name]", "Basecola wallet funding");
      form.set("payment_method_types[0]", "card");
      form.set("cancel_url", `${origin}/fund-wallet?checkout=cancel`);
      const encoded = `${form.toString()}&success_url=${encodeURI(`${origin}/fund-wallet?session_id=`)}{CHECKOUT_SESSION_ID}`;
      const session = await stripeRequest(stripeSecret, "checkout/sessions", "POST", encoded);
      if (typeof session.url !== "string" || !session.url.startsWith("https://checkout.stripe.com/")) {
        return json({ error: "Stripe did not return a checkout page." }, 502);
      }
      return json({ url: session.url });
    }

    if (body.action === "confirm") {
      if (typeof body.sessionId !== "string" || !/^cs_(live|test)_[A-Za-z0-9]+$/.test(body.sessionId)) {
        return json({ error: "This Stripe payment link is not valid." }, 400);
      }
      const session = await stripeRequest(
        stripeSecret,
        `checkout/sessions/${body.sessionId}?expand[]=payment_intent.payment_method`,
        "GET",
      );
      const owner = session.metadata?.user_id || session.client_reference_id;
      if (owner !== auth.user.id) return json({ error: "This payment belongs to another account." }, 403);
      if (session.payment_status !== "paid") return json({ error: "Stripe has not confirmed this payment." }, 409);

      if (!serviceKey) return json({ error: "Stripe funding is not configured on the server." }, 500);
      const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
      const { data: existing, error: existingError } = await admin
        .from("wallet_fundings")
        .select("amount, payment_method, status")
        .eq("user_id", auth.user.id)
        .eq("reference", session.id)
        .maybeSingle();
      if (existingError) return json({ error: existingError.message }, 500);
      if (existing) {
        return json({
          amount: Number(existing.amount),
          paymentMethod: existing.payment_method,
          status: existing.status,
          alreadySaved: true,
        });
      }

      const amount = Number(session.amount_total) / 100;
      const paymentMethod = paymentLabel(session);
      const { error: insertError } = await admin.from("wallet_fundings").insert({
        user_id: auth.user.id,
        amount,
        currency: (session.currency || "usd").toUpperCase(),
        payment_method: paymentMethod,
        reference: session.id,
        status: "pending",
      });
      if (insertError) return json({ error: insertError.message }, 500);
      return json({ amount, paymentMethod, status: "pending", alreadySaved: false });
    }

    return json({ error: "Choose a funding action." }, 400);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Stripe funding could not be completed." }, 502);
  }
});
