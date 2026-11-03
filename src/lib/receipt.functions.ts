import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { sendReceipt, type ReceiptKind } from "@/lib/receipt-email";

const TABLE = { funding: "wallet_fundings", buy: "transactions", sell: "transactions", send: "crypto_sends", receive: "crypto_receives" } as const;

// Emails the signed-in member a receipt for one of their own records (RLS enforces ownership).
export const emailReceipt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { kind: ReceiptKind; id?: string; reference?: string }) => {
    if (!(d.kind in TABLE)) throw new Error("Invalid input.");
    if (d.id && /^[0-9a-f-]{36}$/i.test(d.id)) return { kind: d.kind, id: d.id };
    if (d.kind === "funding" && d.reference && /^cs_(live|test)_[A-Za-z0-9]+$/.test(d.reference)) return { kind: d.kind, reference: d.reference };
    throw new Error("Invalid input.");
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const ref = "id" in data && data.id ? { col: "id", val: data.id } : { col: "reference", val: (data as { reference: string }).reference };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: row } = await (supabase.from(TABLE[data.kind]) as any).select("*").eq("user_id", userId).eq(ref.col, ref.val).maybeSingle();
    if (!row) throw new Error("Record not found.");
    if (data.kind === "funding" && (row as { status?: string }).status !== "completed") return { sent: false };
    if ((data.kind === "buy" || data.kind === "sell") && (row as { kind?: string }).kind !== data.kind) throw new Error("Record not found.");
    const { data: profile } = await supabase.from("profiles").select("email, full_name").eq("id", userId).maybeSingle();
    const email = profile?.email ?? (context.claims as { email?: string }).email;
    if (!email) return { sent: false };
    try { return { sent: await sendReceipt(data.kind, email, profile?.full_name ?? null, row as Record<string, unknown>) }; }
    catch (e) { console.error("receipt email failed", e); return { sent: false }; }
  });
