import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { parseCryptoWithdrawalInput } from "@/lib/crypto/withdrawals";
import type { CustomerCryptoWallet } from "@/lib/crypto-provisioning.functions";
import type { Json } from "@/integrations/supabase/types";

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
  ) => Promise<{ data: Json; error: { message: string } | null }>;
};

export type CryptoWithdrawalExecution = {
  withdrawal_id: string;
  status: string;
  transaction_hash?: string;
  network_fee?: string;
  network_fee_usd?: string;
};

export type CryptoWithdrawalResult = {
  withdrawalId: string;
  status: string;
  transactionHash: string | null;
  networkFee: string | null;
  networkFeeUsd: string | null;
};

export const requestCryptoWithdrawal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const parsed = parseCryptoWithdrawalInput(input);
    if (!parsed) throw new Error("Enter a valid address, asset, network, and amount.");
    return parsed;
  })
  .handler(async ({ data, context }) => {
    const { data: customerWallets, error: provisioningError } =
      await context.supabase.functions.invoke<CustomerCryptoWallet[]>(
        "turnkey-wallet-provisioning",
        { body: {} },
      );
    if (provisioningError) {
      throw new Error("Could not prepare your personal withdrawal wallet.");
    }
    if (!Array.isArray(customerWallets)) {
      throw new Error("Wallet provisioning returned an invalid response.");
    }
    const customerWallet = customerWallets.find(
      (item) => item.network === data.network && item.status === "active" && item.address,
    );
    if (!customerWallet) {
      throw new Error(`Your ${data.network} withdrawal wallet is not active yet.`);
    }

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
      _amount: Number(data.amount),
      _idempotency_key: data.idempotencyKey,
    });
    if (error) throw new Error(error.message);
    if (!result || typeof result !== "object" || Array.isArray(result)) {
      throw new Error("The withdrawal record could not be verified.");
    }
    const withdrawalId = result.withdrawal_id;
    if (typeof withdrawalId !== "string" || !/^[0-9a-f-]{36}$/i.test(withdrawalId)) {
      throw new Error("The withdrawal service returned an invalid reference.");
    }

    const { data: execution, error: executionError } =
      await context.supabase.functions.invoke<CryptoWithdrawalExecution>(
        "crypto-withdrawal-execution",
        { body: { withdrawal_id: withdrawalId } },
      );
    if (executionError) {
      throw new Error(
        `Withdrawal ${withdrawalId} is recorded, but execution could not be confirmed. Retry this same withdrawal; do not submit another one. ${executionError.message}`,
      );
    }
    if (
      !execution ||
      execution.withdrawal_id !== withdrawalId ||
      typeof execution.status !== "string"
    ) {
      throw new Error(
        `Withdrawal ${withdrawalId} is recorded, but the execution service returned an invalid response. Retry this same withdrawal; do not submit another one.`,
      );
    }

    return {
      withdrawalId,
      status: execution.status,
      transactionHash: execution.transaction_hash ?? null,
      networkFee: execution.network_fee ?? null,
      networkFeeUsd: execution.network_fee_usd ?? null,
    } satisfies CryptoWithdrawalResult;
  });
