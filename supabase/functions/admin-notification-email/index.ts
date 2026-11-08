import { createClient } from "https://esm.sh/@supabase/supabase-js@2.118.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
  const adminKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SECRET_KEY");
  const resendApiKey = Deno.env.get("RESEND_API_KEY")?.trim();
  const fromEmail = Deno.env.get("RESEND_FROM_EMAIL")?.trim();
  if (!supabaseUrl || !anonKey || !adminKey) {
    return json({ error: "Supabase email delivery is not configured." }, 500);
  }
  if (!resendApiKey) return json({ error: "RESEND_API_KEY is not configured in Supabase." }, 500);
  if (!fromEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fromEmail)) {
    return json({ error: "RESEND_FROM_EMAIL is not configured correctly in Supabase." }, 500);
  }

  const token = (request.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "Log in to send an email notification." }, 401);

  const userClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: auth, error: authError } = await userClient.auth.getUser(token);
  if (authError || !auth.user) return json({ error: "Log in to send an email notification." }, 401);

  const adminClient = createClient(supabaseUrl, adminKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: role, error: roleError } = await adminClient
    .from("user_roles")
    .select("role")
    .eq("user_id", auth.user.id)
    .eq("role", "admin")
    .maybeSingle();
  if (roleError) {
    console.error("Could not verify admin role for email notification.");
    return json({ error: "Could not verify admin access." }, 500);
  }
  if (!role) return json({ error: "Admin access required." }, 403);

  let body: {
    userId?: unknown;
    to?: unknown;
    subject?: unknown;
    html?: unknown;
    text?: unknown;
    idempotencyKey?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid email notification payload." }, 400);
  }

  const { userId, to, subject, html, text, idempotencyKey } = body;
  if (
    typeof userId !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId) ||
    typeof to !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to) ||
    typeof subject !== "string" ||
    subject.length < 1 ||
    subject.length > 200 ||
    typeof html !== "string" ||
    html.length > 100_000 ||
    typeof text !== "string" ||
    text.length > 100_000 ||
    typeof idempotencyKey !== "string" ||
    idempotencyKey.length < 1 ||
    idempotencyKey.length > 200
  ) {
    return json({ error: "Invalid email notification payload." }, 400);
  }

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .maybeSingle();
  if (profileError) {
    console.error("Could not verify email notification recipient.");
    return json({ error: "Could not verify the email recipient." }, 500);
  }
  const profileEmail = profile?.email?.trim();
  if (!profileEmail || profileEmail.toLowerCase() !== to.trim().toLowerCase()) {
    return json({ error: "The email recipient is no longer available." }, 400);
  }

  const { data: accountStatus, error: statusError } = await adminClient
    .from("admin_user_management")
    .select("account_status")
    .eq("user_id", userId)
    .maybeSingle();
  if (statusError) {
    console.error("Could not verify email notification recipient status.");
    return json({ error: "Could not verify the email recipient status." }, 500);
  }
  if (accountStatus && accountStatus.account_status !== "active") {
    return json({ error: "The email recipient is no longer active." }, 400);
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify({
        from: `Basecola <${fromEmail}>`,
        to: [profileEmail],
        subject,
        html,
        text,
        tags: [{ name: "template", value: "admin-notification" }],
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      console.error(`Resend admin notification request failed [${response.status}].`);
      return json({ error: `Resend email request failed with status ${response.status}.` }, 502);
    }
    return json({ sent: true });
  } catch {
    console.error("Could not reach Resend for admin email notification.");
    return json({ error: "Resend email delivery is temporarily unavailable." }, 502);
  }
});
