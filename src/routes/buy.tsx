import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Bitcoin } from "lucide-react";
import { TradePreviewModal, TradeSuccessModal } from "@/components/trade-modals";
import { WalletLayout, WalletCoinSelect } from "@/components/wallet-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { amountError, formatAssetAmount, quoteTradeFee, sampleUnitPrice, WALLET_ASSETS } from "@/lib/wallet-demo";
import { money } from "@/lib/account-demo";

export const Route = createFileRoute("/buy")({
  head: () => ({ meta: [
    { title: "Buy Crypto — Basecola" }, { name: "description", content: "Preview buying cryptocurrency in your Basecola demo wallet." },
    { property: "og:title", content: "Buy Crypto — Basecola" }, { property: "og:description", content: "Review a demo cryptocurrency purchase on Basecola." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: BuyPage,
});

function BuyPage() {
  const [symbol, setSymbol] = useState("BTC");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState<"form" | "preview" | "success">("form");
  const asset = WALLET_ASSETS.find(item => item.sym === symbol);
  if (!asset) return null;
  const unit = sampleUnitPrice(asset.price);
  const usd = Number(amount);
  const crypto = Number.isFinite(usd) && usd > 0 && unit > 0 ? usd / unit : 0;
  const fee = quoteTradeFee(usd);
  const total = usd > 0 ? usd + fee : 0;
  const headline = `${formatAssetAmount(crypto)} ${symbol}`;

  function reset() {
    setAmount("");
    setError("");
    setStep("form");
  }

  return <WalletLayout title="Buy Crypto">
    <form className="space-y-6" onSubmit={event => { event.preventDefault(); const message = amountError(amount); setError(message); if (!message) setStep("preview"); }}>
      <div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-lg bg-accent text-primary"><Bitcoin /></span><div><h2 className="text-xl font-bold">Buy crypto</h2><p className="text-sm text-muted-foreground">Pay in USD · Sample price</p></div></div>
      <WalletCoinSelect symbol={symbol} onChange={value => { setSymbol(value); setAmount(""); setError(""); setStep("form"); }} />
      <div className="space-y-2"><Label htmlFor="buy-amount">Amount (USD)</Label><Input id="buy-amount" inputMode="decimal" placeholder="0.00" value={amount} onChange={event => { setAmount(event.target.value); setError(""); }} className="h-14 bg-card text-2xl" aria-invalid={!!error} aria-describedby={error ? "buy-error" : undefined} />{error && <p id="buy-error" role="alert" className="text-sm text-destructive">{error}</p>}</div>
      <div className="grid grid-cols-3 gap-3">{[50, 100, 250].map(value => <Button key={value} type="button" variant="outline" onClick={() => { setAmount(String(value)); setError(""); }}>{money(value)}</Button>)}</div>
      <div className="space-y-3 border-y py-4 text-sm">
        <div className="flex justify-between gap-4"><span className="text-muted-foreground">Estimated {symbol}</span><span className="text-right font-semibold">{crypto > 0 ? headline : "—"}</span></div>
        <div className="flex justify-between gap-4"><span className="text-muted-foreground">Fee 1.5%</span><span className="font-semibold">{fee > 0 ? money(fee) : "—"}</span></div>
        <div className="flex justify-between gap-4"><span className="text-muted-foreground">Total</span><span className="font-semibold">{total > 0 ? money(total) : "—"}</span></div>
      </div>
      <Button className="h-12 w-full" type="submit">Review demo purchase<ArrowRight /></Button>
    </form>
    <TradePreviewModal
      open={step === "preview"}
      title="Review demo purchase"
      headline={headline}
      detail={`You pay ${money(total)} · Sample price ${asset.price}`}
      rows={[{ label: "Asset", value: asset.name }, { label: "Network", value: asset.network }, { label: "Amount", value: money(usd) }, { label: "Fee 1.5%", value: money(fee) }, { label: "Total", value: money(total) }]}
      note="This quote uses a fixed sample price. The fee is a sample and confirming does not place an order or change your balance."
      confirmLabel="Confirm preview"
      editLabel="Edit purchase"
      onConfirm={() => setStep("success")}
      onClose={() => setStep("form")}
    />
    <TradeSuccessModal
      open={step === "success"}
      title="Purchase preview complete"
      headline={headline}
      detail={`Sample fee ${money(fee)}. No payment was taken. Your balance and transactions have not changed.`}
      againLabel="New demo purchase"
      onAgain={reset}
      onClose={reset}
    />
  </WalletLayout>;
}
