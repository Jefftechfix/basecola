import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import { WalletLayout, WalletCoinSelect } from "@/components/wallet-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { amountError, recipientError, WALLET_ASSETS } from "@/lib/wallet-demo";
import { money } from "@/lib/account-demo";

export const Route = createFileRoute("/send")({
  head: () => ({ meta: [
    { title: "Send Crypto — Basecola" }, { name: "description", content: "Preview a cryptocurrency transfer from your Basecola demo wallet." },
    { property: "og:title", content: "Send Crypto — Basecola" }, { property: "og:description", content: "Review a demo cryptocurrency transfer on Basecola." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: SendPage,
});

function SendPage() {
  const [symbol, setSymbol] = useState("BTC");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [errors, setErrors] = useState({ recipient: "", amount: "" });
  const [step, setStep] = useState<"form" | "review" | "done">("form");
  const asset = WALLET_ASSETS.find(item => item.sym === symbol);
  if (!asset) return null;
  const usd = Number(amount) * Number(asset.price.replace(/[$,]/g, ""));
  return <WalletLayout title="Send Crypto" active="/send">
    {step === "done" ? <div className="space-y-5 text-center"><CheckCircle2 className="mx-auto h-14 w-14 text-success" /><h2 className="text-2xl font-bold">Demo transfer complete</h2><p className="text-3xl font-extrabold">{amount} {symbol}</p><p className="text-sm text-muted-foreground">No crypto was sent. Your balance and transactions have not changed.</p><Button asChild className="w-full"><Link to="/dashboard">Back to wallet</Link></Button><Button variant="outline" className="w-full" onClick={() => { setAmount(""); setRecipient(""); setStep("form"); }}>New demo transfer</Button></div> : step === "review" ? <section className="space-y-5"><h2 className="text-xl font-bold">Review demo transfer</h2><div className="border-y py-6 text-center"><p className="text-3xl font-extrabold break-words">{amount} {symbol}</p><p className="mt-2 text-sm text-muted-foreground">≈ {money(usd)} · Sample price</p></div><dl className="space-y-4 text-sm"><div className="flex justify-between gap-4"><dt className="text-muted-foreground">Network</dt><dd className="text-right font-semibold">{asset.network}</dd></div><div><dt className="text-muted-foreground">Recipient</dt><dd className="mt-2 break-all rounded-lg bg-muted p-3 font-mono text-xs">{recipient}</dd></div><div className="flex justify-between"><dt className="text-muted-foreground">Network fee</dt><dd>Not quoted · Demo only</dd></div></dl><p className="text-sm text-muted-foreground">Address format and network compatibility are not verified in this demo.</p><Button className="h-12 w-full" onClick={() => setStep("done")}>Simulate transfer<ArrowUpRight /></Button><Button variant="outline" className="w-full" onClick={() => setStep("form")}>Edit transfer</Button></section> : <form className="space-y-6" onSubmit={e => { e.preventDefault(); const next = { recipient: recipientError(recipient), amount: amountError(amount, asset.balance) }; setErrors(next); if (!next.recipient && !next.amount) setStep("review"); }}>
      <WalletCoinSelect symbol={symbol} onChange={value => { setSymbol(value); setAmount(""); setErrors({ recipient: "", amount: "" }); }} />
      <div className="space-y-2"><Label htmlFor="recipient">Recipient address</Label><Input id="recipient" placeholder="Enter a wallet address" autoComplete="off" value={recipient} onChange={e => setRecipient(e.target.value)} className="h-12 bg-card" aria-invalid={!!errors.recipient} aria-describedby={errors.recipient ? "recipient-error" : undefined} />{errors.recipient && <p id="recipient-error" role="alert" className="text-sm text-destructive">{errors.recipient}</p>}</div>
      <div className="space-y-2"><Label htmlFor="send-amount">Amount ({symbol})</Label><div className="relative"><Input id="send-amount" inputMode="decimal" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} className="h-14 bg-card pr-20 text-xl" aria-invalid={!!errors.amount} aria-describedby={errors.amount ? "amount-error" : undefined} /><Button type="button" variant="ghost" className="absolute right-2 top-2 text-primary" onClick={() => setAmount(String(asset.balance))}>Max</Button></div><div className="flex justify-between gap-2 text-xs text-muted-foreground"><span>Available: {asset.quantity} {symbol}</span><span>Demo balance</span></div>{errors.amount && <p id="amount-error" role="alert" className="text-sm text-destructive">{errors.amount}</p>}</div>
      <div className="flex justify-between border-y py-4 text-sm"><span className="text-muted-foreground">Network</span><span className="font-semibold">{asset.network}</span></div>
      <Button className="h-12 w-full" type="submit">Review demo transfer<ArrowUpRight /></Button>
    </form>}
  </WalletLayout>;
}