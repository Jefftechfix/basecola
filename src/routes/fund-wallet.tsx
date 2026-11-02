import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ArrowRight, Building2, CheckCircle2, CreditCard } from "lucide-react";
import { StripeBankDemo } from "@/components/stripe-bank-demo";
import { WalletLayout } from "@/components/wallet-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { money } from "@/lib/account-demo";
import { amountError, bankAccountError, cardNumberError, cvvError, expiryError, holderNameError, lastDigits, routingNumberError, type ConnectedStripeBank } from "@/lib/wallet-demo";

type Method = "card" | "bank";
type Step = "form" | "review" | "done";

export const Route = createFileRoute("/fund-wallet")({
  head: () => ({ meta: [
    { title: "Fund Wallet — Basecola" }, { name: "description", content: "Preview funding a Basecola wallet by debit or credit card or a US bank account, including a Stripe demo bank connection." },
    { property: "og:title", content: "Fund Wallet — Basecola" }, { property: "og:description", content: "Preview card or US bank funding. The Stripe bank connection is a demo and no payment is taken." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: FundWalletPage,
});

function digits(value: string, max: number) {
  return value.replace(/\D/g, "").slice(0, max);
}

function FundWalletPage() {
  const [method, setMethod] = useState<Method>("card");
  const [step, setStep] = useState<Step>("form");
  const [amount, setAmount] = useState("");
  const [name, setName] = useState("");
  const [card, setCard] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [routing, setRouting] = useState("");
  const [account, setAccount] = useState("");
  const [accountType, setAccountType] = useState("Checking");
  const [connected, setConnected] = useState<ConnectedStripeBank | null>(null);
  const [stripeOpen, setStripeOpen] = useState(false);
  const [error, setError] = useState("");
  const [ending, setEnding] = useState("");
  const [summary, setSummary] = useState("");
  const stripeBank = method === "bank" ? connected : null;
  const previewEnding = stripeBank ? stripeBank.last4 : lastDigits(method === "card" ? card : account);

  function choose(next: Method) {
    setMethod(next);
    setError("");
    setStep("form");
  }

  function review(event: FormEvent) {
    event.preventDefault();
    const problems = [
      amountError(amount),
      ...(method === "card"
        ? [holderNameError(name), cardNumberError(card), expiryError(expiry), cvvError(cvv)]
        : stripeBank
          ? []
          : [holderNameError(name), routingNumberError(routing), bankAccountError(account)]),
    ];
    const message = problems.find(Boolean) ?? "";
    setError(message);
    if (!message) setStep("review");
  }

  function confirm() {
    setEnding(stripeBank ? stripeBank.last4 : lastDigits(method === "card" ? card : account));
    setSummary(method === "card" ? "Debit or credit card" : stripeBank ? `Stripe demo · ${stripeBank.bankName} · ${stripeBank.accountType}` : `US bank · ${accountType}`);
    setCard("");
    setCvv("");
    setRouting("");
    setAccount("");
    setStep("done");
  }

  return <WalletLayout title="Fund Wallet">
    {step === "done" ? <section className="space-y-5 text-center">
      <CheckCircle2 className="mx-auto h-14 w-14 text-success" />
      <h2 className="text-2xl font-bold">Funding preview</h2>
      <p className="text-4xl font-extrabold">{money(Number(amount))}</p>
      <p className="text-sm text-muted-foreground">{summary} ending {ending}</p>
      <p className="text-sm leading-relaxed text-muted-foreground">{summary.startsWith("Stripe demo") ? "Stripe was not contacted. No bank account was linked or charged. Your demo balance is unchanged." : "No card or bank account was charged. Your demo balance is unchanged."}</p>
      <Button variant="outline" className="w-full" onClick={() => setStep("form")}>Fund again</Button>
    </section> : step === "review" ? <section className="space-y-5">
      <h2 className="text-xl font-bold">Review funding</h2>
      <dl className="space-y-3 rounded-3xl bg-card p-5 text-sm shadow-soft">
        <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Amount</dt><dd className="font-bold">{money(Number(amount))}</dd></div>
        <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Method</dt><dd className="font-semibold">{method === "card" ? "Debit or credit card" : stripeBank ? "US bank · Stripe demo" : "US bank"}</dd></div>
        {stripeBank && <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Bank</dt><dd className="font-semibold">{stripeBank.bankName}</dd></div>}
        <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Name</dt><dd className="font-semibold">{stripeBank ? stripeBank.holder : name.trim()}</dd></div>
        <div className="flex justify-between gap-3"><dt className="text-muted-foreground">{method === "card" ? "Card" : "Account"}</dt><dd className="font-semibold">Ending {previewEnding}</dd></div>
        {method === "bank" && <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Account type</dt><dd className="font-semibold">{stripeBank ? stripeBank.accountType : accountType}</dd></div>}
      </dl>
      <p className="text-sm leading-relaxed text-muted-foreground">Confirming this preview does not send card or bank details and does not move money.</p>
      <Button className="h-12 w-full" type="button" onClick={confirm}>Confirm preview</Button>
      <Button variant="outline" className="w-full" type="button" onClick={() => setStep("form")}>Edit details</Button>
    </section> : <>
      <div role="group" aria-label="Funding method" className="mb-5 grid grid-cols-2 gap-3">
        <Button type="button" variant={method === "card" ? "default" : "outline"} className="h-12" aria-pressed={method === "card"} onClick={() => choose("card")}><CreditCard />Card</Button>
        <Button type="button" variant={method === "bank" ? "default" : "outline"} className="h-12" aria-pressed={method === "bank"} onClick={() => choose("bank")}><Building2 />US bank</Button>
      </div>
      <div className="mb-6 flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-lg bg-accent text-primary">{method === "card" ? <CreditCard /> : <Building2 />}</span><div><h2 className="text-xl font-bold">Add money</h2><p className="text-sm text-muted-foreground">{method === "card" ? "Debit or credit card · USD" : "US bank account · USD"}</p></div></div>
      <form className="space-y-5" onSubmit={review}>
        <div className="space-y-2"><Label htmlFor="fund-amount">Amount (USD)</Label><Input id="fund-amount" inputMode="decimal" placeholder="0.00" value={amount} onChange={e => { setAmount(e.target.value); setError(""); }} className="h-14 bg-card text-2xl" aria-invalid={!!error} aria-describedby={error ? "fund-error" : undefined} /></div>
        <div className="grid grid-cols-3 gap-3">{[50, 100, 250].map(value => <Button key={value} type="button" variant="outline" onClick={() => { setAmount(String(value)); setError(""); }}>{money(value)}</Button>)}</div>
        {stripeBank ? <div className="rounded-3xl bg-card p-5 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#635bff]">Connected · Stripe demo</p>
          <p className="mt-2 font-bold">{stripeBank.bankName}</p>
          <p className="text-sm text-muted-foreground">{stripeBank.accountType} · Ending {stripeBank.last4}</p>
          <Button type="button" variant="outline" className="mt-4 w-full" onClick={() => setConnected(null)}>Disconnect</Button>
        </div> : <div className="space-y-2"><Label htmlFor="fund-name">{method === "card" ? "Name on card" : "Account holder"}</Label><Input id="fund-name" autoComplete="name" value={name} onChange={e => { setName(e.target.value); setError(""); }} className="h-12 bg-card" /></div>}
        {method === "card" ? <>
          <div className="space-y-2"><Label htmlFor="fund-card">Card number</Label><Input id="fund-card" inputMode="numeric" autoComplete="off" placeholder="1234 1234 1234 1234" value={card} onChange={e => { setCard(digits(e.target.value, 19).replace(/(\d{4})(?=\d)/g, "$1 ")); setError(""); }} className="h-12 bg-card" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label htmlFor="fund-expiry">Expiry</Label><Input id="fund-expiry" inputMode="numeric" autoComplete="off" placeholder="MM/YY" value={expiry} onChange={e => { const next = digits(e.target.value, 4); setExpiry(next.length <= 2 ? next : `${next.slice(0, 2)}/${next.slice(2)}`); setError(""); }} className="h-12 bg-card" /></div>
            <div className="space-y-2"><Label htmlFor="fund-cvv">Security code</Label><Input id="fund-cvv" inputMode="numeric" autoComplete="off" placeholder="123" value={cvv} onChange={e => { setCvv(digits(e.target.value, 4)); setError(""); }} className="h-12 bg-card" /></div>
          </div>
        </> : stripeBank ? null : <>
          <Button type="button" variant="outline" className="h-12 w-full border-[#635bff] text-[#635bff] hover:bg-[#635bff]/10 hover:text-[#635bff]" onClick={() => setStripeOpen(true)}>Connect with Stripe</Button>
          <p className="text-center text-xs text-muted-foreground">Or enter account numbers</p>
          <div className="space-y-2"><Label htmlFor="fund-type">Account type</Label>
            <select id="fund-type" value={accountType} onChange={e => setAccountType(e.target.value)} className="flex h-12 w-full rounded-md border border-input bg-card px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
              <option>Checking</option><option>Savings</option>
            </select>
          </div>
          <div className="space-y-2"><Label htmlFor="fund-routing">Routing number</Label><Input id="fund-routing" inputMode="numeric" autoComplete="off" placeholder="9 digits" value={routing} onChange={e => { setRouting(digits(e.target.value, 9)); setError(""); }} className="h-12 bg-card" /></div>
          <div className="space-y-2"><Label htmlFor="fund-account">Account number</Label><Input id="fund-account" inputMode="numeric" autoComplete="off" placeholder="Account number" value={account} onChange={e => { setAccount(digits(e.target.value, 17)); setError(""); }} className="h-12 bg-card" /></div>
        </>}
        {error && <p id="fund-error" role="alert" className="text-sm text-destructive">{error}</p>}
        <p className="text-xs leading-relaxed text-muted-foreground">{method === "card" ? "Card details stay on this page until you continue. They are not sent to a card network." : stripeBank ? "This Stripe connection is a preview. Stripe is not contacted, and the demo bank cannot receive a transfer." : "Connect with the Stripe demo, or enter numbers on this page. Neither path contacts Stripe or a bank."}</p>
        <Button className="h-12 w-full" type="submit">Review funding<ArrowRight /></Button>
      </form>
      <StripeBankDemo open={stripeOpen} onOpenChange={setStripeOpen} onConnect={bank => { setConnected(bank); setError(""); }} />
    </>}
  </WalletLayout>;
}
