import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, CreditCard, Download, CheckCircle2 } from "lucide-react";
import { WalletLayout } from "@/components/wallet-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { amountError } from "@/lib/wallet-demo";
import { money } from "@/lib/account-demo";

export const Route = createFileRoute("/fund-wallet")({
  head: () => ({ meta: [
    { title: "Fund Wallet — Basecola" }, { name: "description", content: "Preview funding your Basecola wallet or receiving cryptocurrency." },
    { property: "og:title", content: "Fund Wallet — Basecola" }, { property: "og:description", content: "Explore Basecola demo wallet funding options." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: FundWalletPage,
});

function FundWalletPage() {
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [review, setReview] = useState(false);
  return <WalletLayout title="Fund Wallet" active="/fund-wallet">
    {review ? <section className="space-y-5 text-center"><CheckCircle2 className="mx-auto h-14 w-14 text-success" /><h2 className="text-2xl font-bold">Funding preview</h2><p className="text-4xl font-extrabold">{money(Number(amount))}</p><p className="text-sm leading-relaxed text-muted-foreground">No payment has been taken. Card payments are not connected for this demo account.</p><Button variant="outline" className="w-full" onClick={() => setReview(false)}>Edit amount</Button></section> : <>
      <div className="mb-6 flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-lg bg-accent text-primary"><CreditCard /></span><div><h2 className="text-xl font-bold">Add money</h2><p className="text-sm text-muted-foreground">Card funding · USD</p></div></div>
      <form className="space-y-5" onSubmit={e => { e.preventDefault(); const message = amountError(amount); setError(message); if (!message) setReview(true); }}>
        <div className="space-y-2"><Label htmlFor="fund-amount">Amount (USD)</Label><Input id="fund-amount" inputMode="decimal" placeholder="0.00" value={amount} onChange={e => { setAmount(e.target.value); setError(""); }} className="h-14 bg-card text-2xl" aria-invalid={!!error} aria-describedby={error ? "fund-error" : undefined} />{error && <p id="fund-error" role="alert" className="text-sm text-destructive">{error}</p>}</div>
        <div className="grid grid-cols-3 gap-3">{[50, 100, 250].map(value => <Button key={value} type="button" variant="outline" onClick={() => { setAmount(String(value)); setError(""); }}>{money(value)}</Button>)}</div>
        <div className="flex items-center justify-between border-y py-4 text-sm"><span className="text-muted-foreground">Payment method</span><span className="font-semibold">Card · Demo only</span></div>
        <Button className="h-12 w-full" type="submit">Preview funding<ArrowRight /></Button>
      </form>
      <section className="mt-8 border-t pt-6"><div className="mb-3 flex items-center gap-2"><Download className="h-5 w-5 text-primary" /><h2 className="font-bold">Receive crypto instead</h2></div><Button asChild variant="outline" className="h-12 w-full justify-between"><Link to="/receive">Receive cryptocurrency<ArrowRight /></Link></Button></section>
    </>}
  </WalletLayout>;
}