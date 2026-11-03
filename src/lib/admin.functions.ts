import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { notifyVerificationDecision } from "@/lib/verification-email";

type AuthCtx = { supabase: { from: (t: "user_roles") => any }; userId: string };

async function assertAdmin(context: AuthCtx) {
  const { data } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("Admin access required.");
}

async function admin() {
  return (await import("@/integrations/supabase/client.server")).supabaseAdmin;
}

export type AdminUserRow = {
  id: string; full_name: string | null; email: string | null; phone: string | null; country: string | null;
  created_at: string; account_status: string; admin_note: string | null; kyc: string;
};

export const listAdminUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminUserRow[]> => {
    await assertAdmin(context as AuthCtx);
    const db = await admin();
    const [{ data: profiles, error }, { data: mgmt }, { data: verifs }] = await Promise.all([
      db.from("profiles").select("id, full_name, email, phone, country, created_at").order("created_at", { ascending: false }).limit(500),
      db.from("admin_user_management").select("user_id, account_status, admin_note"),
      db.from("account_verifications").select("user_id, status, created_at").order("created_at", { ascending: false }),
    ]);
    if (error) throw new Error(error.message);
    const kyc = new Map<string, string>();
    for (const v of verifs ?? []) if (!kyc.has(v.user_id)) kyc.set(v.user_id, v.status);
    const m = new Map((mgmt ?? []).map(r => [r.user_id, r]));
    return (profiles ?? []).map(p => ({
      ...p,
      account_status: m.get(p.id)?.account_status ?? "active",
      admin_note: m.get(p.id)?.admin_note ?? null,
      kyc: kyc.get(p.id) ?? "none",
    }));
  });

export const setAdminUserStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; status: "active" | "suspended"; note?: string }) => {
    if (!/^[0-9a-f-]{36}$/i.test(d.userId) || !["active", "suspended"].includes(d.status)) throw new Error("Invalid input.");
    return { userId: d.userId, status: d.status, note: (d.note ?? "").slice(0, 500) || null };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context as AuthCtx);
    const db = await admin();
    const { error } = await db.from("admin_user_management").upsert({
      user_id: data.userId, account_status: data.status, admin_note: data.note, updated_by: (context as AuthCtx).userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export type AdminVerificationRow = {
  id: string; user_id: string; full_name: string; email: string; phone: string; country: string; address: string;
  id_document_type: string; ssn_last4: string | null; status: string; reviewer_note: string | null; created_at: string;
};

export const listAdminVerifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminVerificationRow[]> => {
    await assertAdmin(context as AuthCtx);
    const db = await admin();
    const { data, error } = await db.from("account_verifications").select("*").order("created_at", { ascending: false }).limit(500);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const reviewVerification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; decision: "approved" | "rejected"; note?: string }) => {
    if (!/^[0-9a-f-]{36}$/i.test(d.id) || !["approved", "rejected"].includes(d.decision)) throw new Error("Invalid input.");
    const note = (d.note ?? "").trim().slice(0, 500);
    if (d.decision === "rejected" && !note) throw new Error("Give the member a reason for the rejection.");
    return { id: d.id, decision: d.decision, note: note || null };
  })
  .handler(async ({ data, context }) => {
    const ctx = context as AuthCtx;
    await assertAdmin(ctx);
    const db = await admin();
    const { data: row, error } = await db.from("account_verifications")
      .update({ status: data.decision, reviewer_note: data.note }).eq("id", data.id).select("*").single();
    if (error || !row) throw new Error(error?.message ?? "Verification not found.");
    let emailStatus = "not_sent";
    try {
      emailStatus = await notifyVerificationDecision({ id: row.id, email: row.email, name: row.full_name, decision: data.decision, note: data.note });
    } catch (e) {
      console.error("Verification email failed:", e);
      emailStatus = "failed";
    }
    await db.from("admin_verification_reviews").insert({
      verification_id: row.id, user_id: row.user_id, reviewer_id: ctx.userId, decision: data.decision, note: data.note, email_status: emailStatus,
    });
    return { status: row.status, emailStatus };
  });
