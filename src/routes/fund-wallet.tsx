import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Building2, CheckCircle2, CreditCard } from "lucide-react";
import { WalletLayout } from "@/components/wallet-layout";
import { WalletRecords } from "@/components/wallet-records";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { money } from "@/lib/account-demo";
import { confirmStripeFunding, startStripeFunding, stripeFundingAmountError, type StripeFundingMethod, type StripeFundingReceipt } from "@/lib/stripe-funding";

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
  const [method, setMethod] = useState<StripeFundingMethod>("card");
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
        qc.invalidateQueries({ queryKey: ["wallet-balance"] });
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
      await startStripeFunding(amount, () => setSaving(true), method);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Stripe checkout could not start.");
      setSaving(false);
    }
  }

  const notice = "Stripe charges the card on its own page. A confirmed payment is added to your wallet balance automatically.";

  return <WalletLayout title="Fund Wallet" notice={notice}>
    {confirming ? <p className="text-sm text-muted-foreground">Confirming the Stripe payment…</p> : receipt ? <section className="space-y-5 text-center">
      <CheckCircle2 className="mx-auto h-14 w-14 text-success" />
      <h2 className="text-2xl font-bold">{receipt.bankPending ? "Bank payment started" : "Payment received"}</h2>
      <p className="text-4xl font-extrabold">{money(receipt.amount)}</p>
      <p className="text-sm text-muted-foreground">{receipt.paymentMethod}</p>
      {receipt.bankPending ? <p className="text-sm leading-relaxed text-muted-foreground">{receipt.awaitingVerification ? "Stripe will send 2 small deposits to your bank account in 1–2 business days. Stripe then emails you a link to enter the two amounts (or a descriptor code) to verify the account." : "Your bank account is verified. The bank transfer is processing and usually settles in a few business days."} This funding is not added to your balance until the payment clears.</p> : <p className="text-sm leading-relaxed text-muted-foreground">Stripe confirmed this charge. It has been added to your wallet balance.</p>}
      <Button asChild variant="outline" className="w-full"><Link to="/fund-wallet">Fund again</Link></Button>
    </section> : <>
      <div className="mb-6 flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-lg bg-accent text-primary"><CreditCard /></span>
        <div><h2 className="text-xl font-bold">Add money</h2><p className="text-sm text-muted-foreground">{method === "card" ? "Debit or credit card" : "US bank account"} · USD · Stripe</p></div>
      </div>
      <div role="radiogroup" aria-label="Payment method" className="mb-5 grid grid-cols-2 gap-3">
        <Button type="button" role="radio" aria-checked={method === "card"} variant={method === "card" ? "default" : "outline"} className="h-12" onClick={() => setMethod("card")}><CreditCard />Card</Button>
        <Button type="button" role="radio" aria-checked={method === "bank"} variant={method === "bank" ? "default" : "outline"} className="h-12" onClick={() => setMethod("bank")}><Building2 />Bank account</Button>
      </div>
      {method === "bank" && <p className="mb-5 rounded-xl bg-muted px-3 py-2 text-xs leading-relaxed text-muted-foreground">On Stripe, enter your routing and account number. Stripe sends 2 micro-deposits to verify the bank account, then emails you a link to confirm the amounts. Funds are added after verification and the transfer clears.</p>}
      <form className="space-y-5" onSubmit={pay}>
        <div className="space-y-2">
          <Label htmlFor="fund-amount">Amount (USD)</Label>
          <Input id="fund-amount" inputMode="decimal" placeholder="0.00" value={amount} onChange={event => { setAmount(event.target.value); setError(""); }} className="h-14 bg-card text-2xl" aria-invalid={!!error} aria-describedby={error ? "fund-error" : undefined} />
        </div>
        <div className="grid grid-cols-3 gap-3">{[50, 100, 250].map(value => <Button key={value} type="button" variant="outline" onClick={() => { setAmount(String(value)); setError(""); }}>{money(value)}</Button>)}</div>
        {checkout === "cancel" && !error && <p className="text-sm text-muted-foreground">Stripe checkout was canceled. No card was charged.</p>}
        {error && <p id="fund-error" role="alert" className="text-sm text-destructive">{error}</p>}
        <p className="text-xs leading-relaxed text-muted-foreground">{method === "card" ? "Continue to Stripe to enter the card. Basecola does not collect the card number or security code." : "Continue to Stripe to add your bank. Basecola does not collect bank account numbers."} The charge is live, from $1.00 to $10,000.00.</p>
        <Button className="h-12 w-full" type="submit" disabled={saving}>{saving ? "Opening Stripe…" : "Pay with Stripe"}<ArrowRight /></Button>
      </form>
    </>}
    <WalletRecords kind="fundings" />
  </WalletLayout>;
}
