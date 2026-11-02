import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, CreditCard } from "lucide-react";
import { WalletLayout } from "@/components/wallet-layout";
import { WalletRecords } from "@/components/wallet-records";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { money } from "@/lib/account-demo";
import { confirmStripeFunding, startStripeFunding, stripeFundingAmountError, type StripeFundingReceipt } from "@/lib/stripe-funding";

type FundSearch = { session_id?: string; checkout?: "cancel" };

export const Route = createFileRoute("/fund-wallet")({
  validateSearch: (search: Record<string, unknown>): FundSearch => ({
    ...(typeof search.session_id === "string" && search.session_id ? { session_id: search.session_id } : {}),
    ...(search.checkout === "cancel" ? { checkout: "cancel" as const } : {}),
  }),
  head: () => ({ meta: [
    { title: "Fund Wallet — Basecola" },
    { name: "description", content: "Add USD to a Basecola wallet with Stripe. Card details are entered on Stripe, and the funding stays pending until an admin completes it." },
    { property: "og:title", content: "Fund Wallet — Basecola" },
    { property: "og:description", content: "Pay with Stripe to fund a Basecola wallet. The card is charged by Stripe." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: FundWalletPage,
});

function FundWalletPage() {
  const { session_id: sessionId = "", checkout } = Route.useSearch();
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [receipt, setReceipt] = useState<StripeFundingReceipt | null>(null);
  const [confirming, setConfirming] = useState(Boolean(sessionId));
  const qc = useQueryClient();

  useEffect(() => {
    if (!sessionId) return;
    let active = true;
    confirmStripeFunding(sessionId)
      .then(next => {
        if (!active) return;
        setReceipt(next);
        qc.invalidateQueries({ queryKey: ["wallet-records", "fundings"] });
      })
      .catch(reason => {
        if (active) setError(reason instanceof Error ? reason.message : "Stripe did not confirm this payment.");
      })
      .finally(() => {
        if (active) setConfirming(false);
      });
    return () => {
      active = false;
    };
  }, [sessionId, qc]);

  async function pay(event: FormEvent) {
    event.preventDefault();
    const problem = stripeFundingAmountError(amount);
    setError(problem);
    if (problem) return;
    try {
      await startStripeFunding(amount, () => setSaving(true));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Stripe checkout could not start.");
      setSaving(false);
    }
  }

  const notice = "Stripe charges the card on its own page. A paid funding stays pending until an admin completes it. The sample dashboard balance does not change here.";

  return <WalletLayout title="Fund Wallet" notice={notice}>
    {confirming ? <p className="text-sm text-muted-foreground">Confirming the Stripe payment…</p> : receipt ? <section className="space-y-5 text-center">
      <CheckCircle2 className="mx-auto h-14 w-14 text-success" />
      <h2 className="text-2xl font-bold">Payment received</h2>
      <p className="text-4xl font-extrabold">{money(receipt.amount)}</p>
      <p className="text-sm text-muted-foreground">{receipt.paymentMethod}</p>
      <p className="text-sm leading-relaxed text-muted-foreground">Stripe confirmed this charge. The funding record is {receipt.status} until an admin completes it, and the sample dashboard balance is unchanged.</p>
      <Button asChild variant="outline" className="w-full"><Link to="/fund-wallet">Fund again</Link></Button>
    </section> : <>
      <div className="mb-6 flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-lg bg-accent text-primary"><CreditCard /></span>
        <div><h2 className="text-xl font-bold">Add money</h2><p className="text-sm text-muted-foreground">Debit or credit card · USD · Stripe</p></div>
      </div>
      <form className="space-y-5" onSubmit={pay}>
        <div className="space-y-2">
          <Label htmlFor="fund-amount">Amount (USD)</Label>
          <Input id="fund-amount" inputMode="decimal" placeholder="0.00" value={amount} onChange={event => { setAmount(event.target.value); setError(""); }} className="h-14 bg-card text-2xl" aria-invalid={!!error} aria-describedby={error ? "fund-error" : undefined} />
        </div>
        <div className="grid grid-cols-3 gap-3">{[50, 100, 250].map(value => <Button key={value} type="button" variant="outline" onClick={() => { setAmount(String(value)); setError(""); }}>{money(value)}</Button>)}</div>
        {checkout === "cancel" && !error && <p className="text-sm text-muted-foreground">Stripe checkout was canceled. No card was charged.</p>}
        {error && <p id="fund-error" role="alert" className="text-sm text-destructive">{error}</p>}
        <p className="text-xs leading-relaxed text-muted-foreground">Continue to Stripe to enter the card. Basecola does not collect the card number or security code. The charge is live, from $1.00 to $10,000.00.</p>
        <Button className="h-12 w-full" type="submit" disabled={saving}>{saving ? "Opening Stripe…" : "Pay with Stripe"}<ArrowRight /></Button>
      </form>
    </>}
    <WalletRecords kind="fundings" />
  </WalletLayout>;
}
