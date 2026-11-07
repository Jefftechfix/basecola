import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendReceipt } from "@/lib/receipt-email";

export async function sendConfirmedDepositEmail(observationId: string): Promise<void> {
  const { data: observation, error: observationError } = await supabaseAdmin
    .from("deposit_observations")
    .select("*")
    .eq("id", observationId)
    .maybeSingle();
  if (observationError) throw new Error(observationError.message);
  if (!observation || observation.status !== "confirmed" || !observation.user_id) return;

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("email, full_name")
    .eq("id", observation.user_id)
    .maybeSingle();
  if (profileError) throw new Error(profileError.message);
  if (!profile?.email) {
    console.error("Confirmed deposit has no email recipient.", { observationId });
    return;
  }

  const sent = await sendReceipt("receive", profile.email, profile.full_name, {
    id: observation.id,
    asset: observation.asset,
    network: observation.network,
    crypto_amount: observation.crypto_amount,
    deposit_address: observation.deposit_address,
    tx_hash: observation.tx_hash,
    confirmations: observation.confirmations,
    required_confirmations: observation.required_confirmations,
    status: observation.status,
    created_at: observation.confirmed_at ?? observation.created_at,
  });
  if (!sent) console.warn("Confirmed deposit email was suppressed.", { observationId });
}
