import type { DemoTransaction } from "@/lib/account-demo";

export function TransactionStatus({ status }: { status: DemoTransaction["status"] }) {
  return <span className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ${status === "Completed" ? "bg-green-soft text-success" : status === "Pending" ? "bg-warning-soft text-warning" : "bg-destructive/10 text-destructive"}`}>{status}</span>;
}