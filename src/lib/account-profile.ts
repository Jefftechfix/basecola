import { supabase } from "@/integrations/supabase/client";

export type AccountProfile = {
  name: string;
  email: string;
  phone: string;
  country: string;
  address: string;
  referralCode: string;
};

export function accountFirstName(profile: Pick<AccountProfile, "name" | "email">) {
  const name = profile.name.trim();
  if (name) return name.split(/\s+/)[0];
  const local = profile.email.split("@")[0]?.trim();
  return local || "there";
}

export function accountInitials(profile: Pick<AccountProfile, "name" | "email">) {
  const source = profile.name.trim() || profile.email.split("@")[0]?.trim() || "";
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 0) return "BC";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function text(value: unknown) {
  return typeof value === "string" ? value : "";
}

export async function loadAccountProfile(): Promise<AccountProfile | null> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data, error } = await supabase.from("profiles").select("full_name, email, phone, country, referral_code").eq("id", auth.user.id).maybeSingle();
  if (error) throw new Error(error.message);
  const meta = auth.user.user_metadata ?? {};
  return {
    name: data?.full_name || text(meta.full_name),
    email: auth.user.email || data?.email || "",
    phone: data?.phone || text(meta.phone),
    country: data?.country || text(meta.country),
    address: text(meta.address),
    referralCode: data?.referral_code || text(meta.referral_code),
  };
}

export async function saveAccountProfile(next: AccountProfile) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Log in to update your profile.");
  const email = next.email.trim();
  const emailChanged = email.toLowerCase() !== (auth.user.email ?? "").toLowerCase();
  const { error: authError } = await supabase.auth.updateUser({
    ...(emailChanged ? { email } : {}),
    data: {
      full_name: next.name.trim(),
      phone: next.phone.trim(),
      country: next.country,
      address: next.address.trim(),
      referral_code: next.referralCode.trim() || null,
    },
  });
  if (authError) throw new Error(authError.message);
  const { error } = await supabase.from("profiles").upsert({
    id: auth.user.id,
    full_name: next.name.trim(),
    email: emailChanged ? auth.user.email : email,
    phone: next.phone.trim(),
    country: next.country,
    referral_code: next.referralCode.trim() || null,
  });
  if (error) throw new Error(error.message);
  return emailChanged ? "Check your inbox to confirm the new email. Your other details are saved." : "Profile saved.";
}
