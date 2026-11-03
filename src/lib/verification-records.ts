import { supabase } from "@/integrations/supabase/client";

export type VerificationRecord = {
  id: string; status: string; id_document_type: string; reviewer_note: string | null; created_at: string; full_name: string;
};

export type VerificationState = { signedIn: boolean; records: VerificationRecord[] };

export async function loadVerifications(): Promise<VerificationState> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { signedIn: false, records: [] };
  const { data, error } = await supabase.from("account_verifications")
    .select("id,status,id_document_type,reviewer_note,created_at,full_name")
    .eq("user_id", user.id).order("created_at", { ascending: false }).limit(20);
  if (error) throw error;
  return { signedIn: true, records: data ?? [] };
}

export type VerificationInput = { full_name: string; email: string; phone: string; country: string; address: string; ssn: string; id_document_type: string };

export async function saveVerification(input: VerificationInput) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Please log in to submit verification.");
  const digits = input.ssn.replace(/\D/g, "");
  const { error } = await supabase.from("account_verifications").insert({
    user_id: user.id, full_name: input.full_name.trim(), email: input.email.trim(), phone: input.phone.trim(),
    country: input.country, address: input.address.trim(), id_document_type: input.id_document_type,
    ssn_last4: digits.length >= 4 ? digits.slice(-4) : null,
  });
  if (error) throw error;
}

export function statusLabel(status: string) {
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Rejected";
  return "Pending review";
}
