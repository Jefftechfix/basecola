import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  Share2,
  Check,
  Copy,
  Clock3,
  CircleCheck,
  CircleX,
  ReceiptText,
  LoaderCircle,
} from "lucide-react";
import { AccountShell } from "@/components/account-shell";
import { TransactionCoin } from "@/components/transaction-coin";
import { Button } from "@/components/ui/button";
import { TRANSACTIONS, money } from "@/lib/account-demo";
import { transactionReceipt } from "@/lib/transaction-receipt";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const Route = createFileRoute("/transactions_/$transactionId")({
  head: ({ params }) => {
    const transaction = TRANSACTIONS.find((item) => item.id === params.transactionId);
    const title = transaction
      ? `${transaction.type} ${transaction.sym} · ${transaction.id} — Basecola`
      : "Transaction unavailable — Basecola";
    const description =
      "View and share a Basecola transaction receipt, including its amount, date, reference and status.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
        ...(!transaction ? [{ name: "robots", content: "noindex" }] : []),
      ],
    };
  },
  component: TransactionDetailsPage,
});

function TransactionDetailsPage() {
  const { transactionId } = Route.useParams();
  const demo = TRANSACTIONS.find((item) => item.id === transactionId);
  const {
    data: record,
    isPending,
    error,
  } = useQuery({
    queryKey: ["transaction-detail", transactionId],
    enabled: UUID.test(transactionId),
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return null;
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("id", transactionId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
  });
  const transaction = demo
    ? {
        ...demo,
        reference: demo.id,
        sample: true,
        network: "",
        counterparty: "",
        txHash: "",
        note: "",
      }
    : record
      ? {
          id: record.id,
          type: record.kind.charAt(0).toUpperCase() + record.kind.slice(1),
          sym: record.coin ?? (record.kind === "funding" ? "USD" : ""),
          quantity:
            record.crypto_amount != null
              ? `${record.crypto_amount} ${record.coin ?? ""}`.trim()
              : money(Number(record.usd_amount)),
          value: Number(record.usd_amount),
          fee: Number(record.fee_usd),
          date: new Date(record.created_at).toLocaleString(),
          status: record.status.charAt(0).toUpperCase() + record.status.slice(1),
          reference: record.reference ?? record.id,
          sample: false,
          network: record.network ?? "",
          counterparty: record.counterparty ?? "",
          txHash: record.tx_hash ?? "",
          note: record.note ?? "",
        }
      : null;

  const [feedback, setFeedback] = useState("");
  const [manualReceipt, setManualReceipt] = useState("");
  const [sharing, setSharing] = useState(false);

  async function shareReceipt() {
    if (!transaction || sharing) return;
    const receiptText = transactionReceipt(transaction);
    const shareText = `${receiptText}\n\nView transaction: ${window.location.href}`;
    setSharing(true);
    setFeedback("");
    setManualReceipt("");
    try {
      if (navigator.share) {
        try {
          await navigator.share({
            title: `Basecola receipt · ${transaction.reference}`,
            text: receiptText,
            url: window.location.href,
          });
          setFeedback("Receipt shared.");
          return;
        } catch (error) {
          if (error instanceof Error && error.name === "AbortError") return;
        }
      }
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(shareText);
      setFeedback("Receipt and link copied. Paste them into a message to share.");
    } catch {
      setManualReceipt(shareText);
      setFeedback("Select and copy the receipt and link below to share them.");
    } finally {
      setSharing(false);
    }
  }

  async function copyReference() {
    if (!transaction) return;
    try {
      await navigator.clipboard.writeText(transaction.reference);
      setFeedback("Reference copied.");
    } catch {
      setManualReceipt(transaction.reference);
      setFeedback("Select and copy the reference below.");
    }
  }

  if (isPending && !demo)
    return (
      <AccountShell active="/transactions" title="Transaction details">
        <p className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Loading transaction…
        </p>
      </AccountShell>
    );

  if (error)
    return (
      <AccountShell active="/transactions" title="Transaction details">
        <div role="alert" className="py-12 text-center">
          <ReceiptText className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
          <h2 className="text-xl font-bold">Could not load transaction</h2>
          <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
          <Button asChild className="mt-6">
            <Link to="/transactions">
              <ArrowLeft />
              Back to transactions
            </Link>
          </Button>
        </div>
      </AccountShell>
    );

  if (!transaction)
    return (
      <AccountShell active="/transactions" title="Transaction details">
        <div className="py-12 text-center">
          <ReceiptText className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
          <h2 className="text-xl font-bold">Transaction not found</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            This transaction is unavailable in your account.
          </p>
          <Button asChild className="mt-6">
            <Link to="/transactions">
              <ArrowLeft />
              Back to transactions
            </Link>
          </Button>
        </div>
      </AccountShell>
    );

  const incoming =
    transaction.type === "Buy" || transaction.type === "Receive" || transaction.type === "Funding";
  const status = transaction.status.toLowerCase();
  const completed = status === "completed";
  const pending = status === "pending" || status === "processing";
  const StatusIcon = completed ? CircleCheck : pending ? Clock3 : CircleX;
  const statusText = completed
    ? "This transaction is complete."
    : pending
      ? "This transaction is awaiting confirmation."
      : `This transaction is ${status}.`;
  const detailRows: Array<[string, string]> = [
    ["Transaction type", transaction.type],
    ["Asset", transaction.sym || "—"],
    ["Amount", transaction.quantity],
    ["USD value", money(transaction.value)],
    ["Fee", money(transaction.fee)],
    ...(transaction.network ? [["Network", transaction.network] as [string, string]] : []),
    ...(transaction.counterparty
      ? [["Counterparty", transaction.counterparty] as [string, string]]
      : []),
    ...(transaction.note ? [["Note", transaction.note] as [string, string]] : []),
    ["Date & time", transaction.date],
  ];

  return (
    <AccountShell active="/transactions" title="Transaction details">
      <Button asChild variant="ghost" className="mb-4 -ml-3 text-muted-foreground">
        <Link to="/transactions">
          <ArrowLeft />
          Transactions
        </Link>
      </Button>
      <article className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <section
          aria-label="Transaction summary"
          className="border-b bg-accent/35 px-5 py-7 text-center sm:px-8"
        >
          <div className="flex justify-center">
            <TransactionCoin symbol={transaction.sym} incoming={incoming} size="h-14 w-14" />
          </div>
          <p className="mt-4 text-sm font-semibold text-muted-foreground">
            {transaction.type} {transaction.sym}
          </p>
          <h2 className="mt-2 wrap-break-word text-2xl font-extrabold sm:text-3xl">
            {transaction.quantity}
          </h2>
          <p className="mt-1 text-lg font-semibold text-muted-foreground">
            {money(transaction.value)}
          </p>
          <div
            className={`mx-auto mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${completed ? "bg-green-soft text-success" : pending ? "bg-warning-soft text-warning" : "bg-destructive/10 text-destructive"}`}
          >
            <StatusIcon className="h-4 w-4" />
            {transaction.status}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{statusText}</p>
        </section>
        <section className="px-5 py-5 sm:px-8">
          <h2 className="mb-1 text-lg font-bold">Receipt details</h2>
          <dl className="divide-y text-sm">
            {detailRows.map(([label, value]) => (
              <div key={label} className="flex flex-wrap justify-between gap-x-4 gap-y-2 py-3.5">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="max-w-[70%] wrap-break-word text-right font-medium">{value}</dd>
              </div>
            ))}
            {transaction.reference && (
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3.5">
                <dt className="text-muted-foreground">Reference</dt>
                <dd className="flex max-w-[75%] items-center gap-1 break-all text-right font-medium">
                  {transaction.reference}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-primary"
                    aria-label="Copy transaction reference"
                    title="Copy reference"
                    onClick={copyReference}
                  >
                    <Copy />
                  </Button>
                </dd>
              </div>
            )}
            {transaction.txHash && (
              <div className="flex flex-wrap justify-between gap-x-4 gap-y-2 py-3.5">
                <dt className="text-muted-foreground">Transaction hash</dt>
                <dd className="max-w-[75%] break-all text-right font-mono text-xs">
                  {transaction.txHash}
                </dd>
              </div>
            )}
          </dl>
        </section>
        <div className="border-t bg-background/70 px-5 py-4 sm:px-8">
          <Button
            className="h-12 w-full font-bold shadow-soft"
            onClick={shareReceipt}
            disabled={sharing}
          >
            {sharing ? <LoaderCircle className="animate-spin" /> : <Share2 />}
            {sharing ? "Preparing share…" : "Share receipt"}
          </Button>
        </div>
      </article>
      {feedback && (
        <p
          role="status"
          aria-live="polite"
          className="mt-3 flex items-start justify-center gap-2 text-center text-sm text-muted-foreground"
        >
          <Check className="mt-0.5 h-4 w-4 shrink-0" />
          {feedback}
        </p>
      )}
      {manualReceipt && (
        <textarea
          readOnly
          autoFocus
          aria-label="Text to copy"
          className="mt-4 min-h-40 w-full rounded-lg border bg-card p-3 text-sm"
          value={manualReceipt}
          onFocus={(event) => event.target.select()}
        />
      )}
      {transaction.sample && (
        <p className="mt-5 text-center text-xs text-muted-foreground">
          Sample transaction — not proof of payment.
        </p>
      )}
    </AccountShell>
  );
}
