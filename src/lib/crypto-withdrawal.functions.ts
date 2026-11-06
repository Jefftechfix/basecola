import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { parseCryptoWithdrawalInput } from "@/lib/crypto/withdrawals";

type WithdrawalRpc = {
  rpc: (
    functionName: "request_crypto_withdrawal",
    args: {
      _asset: string;
      _network: string;
      _wallet_id: string;
      _destination_address: string;
      _destination_tag: number | null;
      _amount: number;
      _idempotency_key: string;
    },
  ) => Promise<{ data: unknown; error: { message: string } | null }>;
};

export const requestCryptoWithdrawal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const parsed = parseCryptoWithdrawalInput(input);
    if (!parsed) throw new Error("Enter a valid address, asset, network, and amount.");
    return parsed;
  })
  .handler(async ({ data, context }) => {
    const { data: wallet, error: walletError } = await context.supabase
      .from("wallet_accounts")
      .select("id")
      .eq("user_id", context.userId)
      .eq("network", data.network)
      .eq("status", "active")
      .maybeSingle();
    if (walletError) throw new Error("Could not verify the withdrawal wallet.");
    if (!wallet) throw new Error("No active wallet is available for this network.");

    const { data: result, error } = await (context.supabase as unknown as WithdrawalRpc).rpc("request_crypto_withdrawal", {
      _asset: data.asset,
      _network: data.network,
      _wallet_id: wallet.id,
      _destination_address: data.destinationAddress,
      _destination_tag: data.destinationTag,
      _amount: data.amount,
      _idempotency_key: data.idempotencyKey,
    });
    if (error) throw new Error(error.message);
    return result;
  });
