import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { sendReceipt } from "@/lib/receipt-email";

const TABLE = { funding: "wallet_fundings", buy: "transactions", sell: "transactions" } as const;
type UserReceiptKind = keyof typeof TABLE;

// Emails the signed-in member a receipt for one of their own records (RLS enforces ownership).
export const emailReceipt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { kind: UserReceiptKind; id?: string; reference?: string }) => {
    if (!Object.hasOwn(TABLE, d.kind)) throw new Error("Invalid input.");
    if (d.id && /^[0-9a-f-]{36}$/i.test(d.id)) return { kind: d.kind, id: d.id };
    if (d.kind === "funding" && d.reference && /^cs_(live|test)_[A-Za-z0-9]+$/.test(d.reference)) return { kind: d.kind, reference: d.reference };
    throw new Error("Invalid input.");
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const ref = "id" in data && data.id ? { col: "id", val: data.id } : { col: "reference", val: (data as { reference: string }).reference };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: row, error: recordError } = await (supabase.from(TABLE[data.kind]) as any).select("*").eq("user_id", userId).eq(ref.col, ref.val).maybeSingle();
    if (recordError) throw new Error(`Could not load the transaction for its email notification: ${recordError.message}`);
    if (!row) throw new Error("Record not found.");
    const status = String((row as { status?: string }).status ?? "").toLowerCase();
    if (status !== "completed") return { sent: false, reason: "transaction_not_final" };
    if ((data.kind === "buy" || data.kind === "sell") && (row as { kind?: string }).kind !== data.kind) throw new Error("Record not found.");
    const { data: profile, error: profileError } = await supabase.from("profiles").select("email, full_name").eq("id", userId).maybeSingle();
    if (profileError) throw new Error(`Could not load the email recipient: ${profileError.message}`);
    const claimedEmail = (context.claims as { email?: unknown }).email;
    const email = profile?.email ?? (typeof claimedEmail === "string" ? claimedEmail : null);
    if (!email) return { sent: false };
    return { sent: await sendReceipt(data.kind, email, profile?.full_name ?? null, row as Record<string, unknown>) };
  });
