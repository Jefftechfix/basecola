import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { sendReceipt, type ReceiptKind } from "@/lib/receipt-email";

const TABLE = { funding: "wallet_fundings", buy: "transactions", sell: "transactions", send: "crypto_sends", receive: "crypto_receives" } as const;

// Emails the signed-in member a receipt for one of their own records (RLS enforces ownership).
export const emailReceipt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { kind: ReceiptKind; id: string }) => {
    if (!(d.kind in TABLE) || !/^[0-9a-f-]{36}$/i.test(d.id)) throw new Error("Invalid input.");
    return d;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row } = await supabase.from(TABLE[data.kind]).select("*").eq("id", data.id).eq("user_id", userId).maybeSingle();
    if (!row) throw new Error("Record not found.");
    if ((data.kind === "buy" || data.kind === "sell") && (row as { kind?: string }).kind !== data.kind) throw new Error("Record not found.");
    const { data: profile } = await supabase.from("profiles").select("email, full_name").eq("id", userId).maybeSingle();
    const email = profile?.email ?? (context.claims as { email?: string }).email;
    if (!email) return { sent: false };
    try { return { sent: await sendReceipt(data.kind, email, profile?.full_name ?? null, row as Record<string, unknown>) }; }
    catch (e) { console.error("receipt email failed", e); return { sent: false }; }
  });
