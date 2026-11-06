import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type CustomerCryptoWallet = {
  network: string;
  status: string;
  address: string | null;
  destination_tag: number | null;
};

export const ensureCustomerCryptoWallets = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CustomerCryptoWallet[]> => {
    const { data, error } = await context.supabase.functions.invoke<CustomerCryptoWallet[]>(
      "turnkey-wallet-provisioning",
      { body: {} },
    );
    if (error) throw new Error("Could not provision customer crypto wallets.");
    if (!Array.isArray(data)) throw new Error("Wallet provisioning returned an invalid response.");
    return data;
  });
