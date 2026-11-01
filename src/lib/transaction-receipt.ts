import { money, type DemoTransaction } from "@/lib/account-demo";

export function transactionReceipt(transaction: DemoTransaction) {
  return [
    "Basecola — Demo transaction receipt",
    `${transaction.type}: ${transaction.quantity}`,
    `Value: ${money(transaction.value)}`,
    `Status: ${transaction.status}`,
    `Date: ${transaction.date}`,
    `Reference: ${transaction.id}`,
    "Sample transaction — not proof of payment.",
  ].join("\n");
}