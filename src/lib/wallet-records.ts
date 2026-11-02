import { supabase } from "@/integrations/supabase/client";

export type RecordKind = "fundings" | "receives" | "sends";

const TABLES = { fundings: "wallet_fundings", receives: "crypto_receives", sends: "crypto_sends" } as const;

async function currentUserId() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Please log in to save this record.");
  return data.user.id;
}

export async function listRecords(kind: RecordKind) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data, error } = await supabase.from(TABLES[kind]).select("*").order("created_at", { ascending: false }).limit(20);
  if (error) throw new Error(error.message);
  return data as Array<Record<string, unknown>>;
}

export async function saveFunding(input: { amount: number; payment_method: string; reference: string }) {
  const user_id = await currentUserId();
  const { error } = await supabase.from("wallet_fundings").insert({ user_id, currency: "USD", ...input, status: "pending" });
  if (error) throw new Error(error.message);
}

export async function saveReceive(input: { coin: string; network: string; wallet_address: string; amount: number | null }) {
  const user_id = await currentUserId();
  const { error } = await supabase.from("crypto_receives").insert({ user_id, ...input, status: "pending" });
  if (error) throw new Error(error.message);
}

export async function saveSend(input: { coin: string; network: string; amount: number; fee: number; to_address: string }) {
  const user_id = await currentUserId();
  const { error } = await supabase.from("crypto_sends").insert({ user_id, ...input, status: "pending" });
  if (error) throw new Error(error.message);
}
