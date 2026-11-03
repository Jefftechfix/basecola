import { money } from "@/lib/account-demo";

export type TransactionReceiptData = {
  id: string;
  reference?: string;
  type: string;
  sym: string;
  quantity: string;
  value: number;
  fee: number;
  date: string;
  status: string;
  sample?: boolean;
};

export function transactionReceipt(transaction: TransactionReceiptData) {
  return [
    transaction.sample === false
      ? "Basecola transaction receipt"
      : "Basecola — Demo transaction receipt",
    `${transaction.type}: ${transaction.quantity}`,
    `Value: ${money(transaction.value)}`,
    `Fee: ${money(transaction.fee)}`,
    `Status: ${transaction.status}`,
    `Date: ${transaction.date}`,
    `Reference: ${transaction.reference ?? transaction.id}`,
    ...(transaction.sample === false ? [] : ["Sample transaction — not proof of payment."]),
  ].join("\n");
}
