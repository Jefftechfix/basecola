import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ArrowDownLeft, ArrowUpRight, Share2, Check, Copy, Clock3, CircleCheck, CircleX, ReceiptText } from "lucide-react";
import { AccountShell } from "@/components/account-shell";
import { TransactionStatus } from "@/components/transaction-status";
import { Button } from "@/components/ui/button";
import { TRANSACTIONS, money } from "@/lib/account-demo";
import { transactionReceipt } from "@/lib/transaction-receipt";

export const Route = createFileRoute("/transactions_/$transactionId")({
  head: ({ params }) => {
    const transaction = TRANSACTIONS.find(item => item.id === params.transactionId);
    const title = transaction ? `${transaction.type} ${transaction.sym} · ${transaction.id} — Basecola` : "Transaction unavailable — Basecola";
    const description = "View and share a Basecola demo transaction receipt, including its amount, date, reference and status.";
    return { meta: [
      { title }, { name: "description", content: description },
      { property: "og:title", content: title }, { property: "og:description", content: description },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
      ...(!transaction ? [{ name: "robots", content: "noindex" }] : []),
    ] };
  },
  component: TransactionDetailsPage,
});

function TransactionDetailsPage() {
  const { transactionId } = Route.useParams();
  const transaction = TRANSACTIONS.find(item => item.id === transactionId);
  const [feedback, setFeedback] = useState("");
  const [manualReceipt, setManualReceipt] = useState("");
  const [sharing, setSharing] = useState(false);

  async function shareReceipt() {
    if (!transaction || sharing) return;
    const text = transactionReceipt(transaction);
    setSharing(true);
    setFeedback("");
    setManualReceipt("");
    try {
      if (navigator.share) {
        try {
          await navigator.share({ title: `Basecola receipt · ${transaction.id}`, text });
          setFeedback("Receipt shared.");
          return;
        } catch (error) {
          if (error instanceof Error && error.name === "AbortError") return;
        }
      }
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(text);
      setFeedback("Receipt copied. Paste it into a message to share.");
    } catch {
      setManualReceipt(text);
      setFeedback("Select and copy the receipt below to share it.");
    } finally {
      setSharing(false);
    }
  }

  async function copyReference() {
    if (!transaction) return;
    try {
      await navigator.clipboard.writeText(transaction.id);
      setFeedback("Reference copied.");
    } catch {
      setFeedback(`Reference: ${transaction.id}`);
    }
  }

  if (!transaction) return <AccountShell active="/transactions" title="Transaction details">
    <div className="py-12 text-center"><ReceiptText className="mx-auto mb-4 h-10 w-10 text-muted-foreground" /><h2 className="text-xl font-bold">Transaction not found</h2><p className="mt-2 text-sm text-muted-foreground">This reference is not available in the demo account.</p><Button asChild className="mt-6"><Link to="/transactions"><ArrowLeft />Back to transactions</Link></Button></div>
  </AccountShell>;

  const incoming = transaction.type === "Buy" || transaction.type === "Receive";
  const Direction = incoming ? ArrowDownLeft : ArrowUpRight;
  const StatusIcon = transaction.status === "Completed" ? CircleCheck : transaction.status === "Pending" ? Clock3 : CircleX;
  const statusText = transaction.status === "Completed" ? "This demo transaction is complete." : transaction.status === "Pending" ? "This demo transaction is awaiting confirmation." : "This demo transaction was not completed.";

  return <AccountShell active="/transactions" title="Transaction details">
    <Button asChild variant="ghost" className="mb-4 -ml-3 text-muted-foreground"><Link to="/transactions"><ArrowLeft />Transactions</Link></Button>
    <section aria-label="Transaction summary" className="border-b pb-7 text-center">
      <span className={`mx-auto grid h-16 w-16 place-items-center rounded-full ${incoming ? "bg-green-soft text-success" : "bg-pink-soft text-pink"}`}><Direction className="h-8 w-8" /></span>
      <p className="mt-4 text-sm font-medium text-muted-foreground">{transaction.type} {transaction.sym}</p>
      <h2 className="mt-2 text-3xl font-extrabold">{transaction.quantity}</h2>
      <p className="mb-4 mt-2 text-lg text-muted-foreground">{money(transaction.value)}</p>
      <TransactionStatus status={transaction.status} />
    </section>
    <section className="py-6"><h2 className="mb-2 text-lg font-bold">Receipt details</h2>
      <dl className="divide-y text-sm">
        {[["Transaction type", transaction.type], ["Asset", transaction.sym], ["Amount", transaction.quantity], ["USD value", money(transaction.value)], ["Date & time", transaction.date]].map(([label, value]) => <div key={label} className="flex flex-wrap justify-between gap-x-4 gap-y-2 py-4"><dt className="text-muted-foreground">{label}</dt><dd className="font-medium">{value}</dd></div>)}
        <div className="flex flex-wrap items-center justify-between gap-2 py-3"><dt className="text-muted-foreground">Reference</dt><dd className="flex items-center gap-2 font-medium">{transaction.id}<Button variant="ghost" size="icon" aria-label="Copy transaction reference" title="Copy reference" onClick={copyReference}><Copy /></Button></dd></div>
      </dl>
    </section>
    <div className="mb-6 flex items-center gap-3 border-y py-4"><StatusIcon className={`h-5 w-5 shrink-0 ${transaction.status === "Completed" ? "text-success" : transaction.status === "Pending" ? "text-warning" : "text-destructive"}`} /><p className="text-sm text-muted-foreground">{statusText}</p></div>
    <Button className="h-12 w-full" onClick={shareReceipt} disabled={sharing}><Share2 />{sharing ? "Sharing…" : "Share receipt"}</Button>
    {feedback && <p role="status" className="mt-3 flex items-start justify-center gap-2 text-center text-sm text-muted-foreground"><Check className="mt-0.5 h-4 w-4 shrink-0" />{feedback}</p>}
    {manualReceipt && <textarea readOnly aria-label="Receipt to copy" className="mt-4 min-h-52 w-full rounded-md border bg-card p-3 text-sm" value={manualReceipt} onFocus={event => event.target.select()} />}
    <p className="mt-5 text-center text-xs text-muted-foreground">Sample transaction — not proof of payment.</p>
  </AccountShell>;
}