import { supabase } from "@/integrations/supabase/client";

const AVAILABLE = new Set(["completed", "paid", "succeeded", "success"]);
const EXCLUDED = new Set(["rejected", "failed", "canceled", "cancelled"]);

export type FundingBalanceRow = {
  amount: number;
  status: string;
  reference: string | null;
  payment_method: string;
  created_at: string;
};

export type TransactionBalanceRow = {
  usd_amount: number;
  fee_usd: number;
  direction: string;
  status: string;
  kind: string;
  created_at: string;
};

function stripePayment(row: FundingBalanceRow) {
  const reference = row.reference ?? "";
  return reference.startsWith("cs_live_") || reference.startsWith("cs_test_") || row.payment_method.startsWith("Stripe");
}

export function walletUsdBalance(fundings: FundingBalanceRow[], transactions: TransactionBalanceRow[], now = Date.now()) {
  const since = now - 24 * 60 * 60 * 1000;
  let total = 0;
  let dayChange = 0;

  function add(amount: number, createdAt: string) {
    if (!Number.isFinite(amount)) return;
    total += amount;
    if (new Date(createdAt).getTime() >= since) dayChange += amount;
  }

  for (const row of fundings) {
    const status = row.status.toLowerCase();
    if (EXCLUDED.has(status)) continue;
    const awaitingBank = row.payment_method.includes("awaiting bank verification");
    if (AVAILABLE.has(status) || (status === "pending" && stripePayment(row) && !awaitingBank)) add(Number(row.amount), row.created_at);
  }

  for (const row of transactions) {
    if (row.kind.toLowerCase() === "funding") continue;
    const status = row.status.toLowerCase();
    if (!AVAILABLE.has(status)) continue;
    const amount = Number(row.usd_amount);
    const fee = Number(row.fee_usd);
    const signed = row.direction === "debit" ? -(amount + fee) : amount - fee;
    add(signed, row.created_at);
  }

  return {
    total: Math.round(total * 100) / 100,
    dayChange: Math.round(dayChange * 100) / 100,
  };
}

export async function loadWalletBalance() {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const [fundings, transactions] = await Promise.all([
    supabase.from("wallet_fundings").select("amount, status, reference, payment_method, created_at").eq("user_id", auth.user.id),
    supabase.from("transactions").select("usd_amount, fee_usd, direction, status, kind, created_at").eq("user_id", auth.user.id),
  ]);
  if (fundings.error) throw new Error(fundings.error.message);
  if (transactions.error) throw new Error(transactions.error.message);
  return walletUsdBalance(fundings.data ?? [], transactions.data ?? []);
}
