// Maps a Stripe checkout payment onto a row in the unified activity history
// (public.transactions). Both the webhook route and the funding edge function
// write through this shape so a payment shows up once, with the same labels.

export type StripeFundingTransactionInput = {
  userId: string;
  sessionId: string;
  amountUsd: number;
  status: string;
  paymentMethod: string;
};

export function stripeFundingTransactionRow(input: StripeFundingTransactionInput) {
  return {
    user_id: input.userId,
    kind: "funding",
    direction: "credit",
    usd_amount: Math.round(input.amountUsd * 100) / 100,
    fee_usd: 0,
    reference: input.sessionId,
    counterparty: "Stripe",
    status: input.status,
    note: input.paymentMethod,
  };
}

// Postgres code for a unique-constraint violation: the row we just tried to add
// already exists, which is the normal outcome when Stripe retries an event.
const UNIQUE_VIOLATION = "23505";

type TransactionsTable = {
  from(table: "transactions"): any;
};

export async function syncStripeFundingTransaction(
  admin: TransactionsTable,
  input: StripeFundingTransactionInput,
) {
  const row = stripeFundingTransactionRow(input);
  const { data: existing } = await admin
    .from("transactions")
    .select("id, status")
    .eq("user_id", row.user_id)
    .eq("kind", "funding")
    .eq("reference", row.reference)
    .maybeSingle();

  if (existing) {
    if (existing.status === row.status && existing.note === row.note) return;
    const { error } = await admin
      .from("transactions")
      .update({ status: row.status, note: row.note })
      .eq("id", existing.id);
    if (error) throw new Error(error.message);
    return;
  }

  const { error } = await admin.from("transactions").insert(row);
  if (error && error.code !== UNIQUE_VIOLATION) throw new Error(error.message);
}
