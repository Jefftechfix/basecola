import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, RefreshCw } from "lucide-react";
import { TradePreviewModal, TradeSuccessModal } from "@/components/trade-modals";
import { WalletLayout, WalletCoinSelect } from "@/components/wallet-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { amountError, formatAssetAmount, quoteTradeFee, sampleUnitPrice, WALLET_ASSETS } from "@/lib/wallet-demo";
import { money } from "@/lib/account-demo";

export const Route = createFileRoute("/sell")({
  head: () => ({ meta: [
    { title: "Sell Crypto — Basecola" }, { name: "description", content: "Preview selling cryptocurrency from your Basecola demo wallet." },
    { property: "og:title", content: "Sell Crypto — Basecola" }, { property: "og:description", content: "Review a demo cryptocurrency sale on Basecola." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: SellPage,
});

function SellPage() {
  const [symbol, setSymbol] = useState("BTC");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState<"form" | "preview" | "success">("form");
  const asset = WALLET_ASSETS.find(item => item.sym === symbol);
  if (!asset) return null;
  const unit = sampleUnitPrice(asset.price);
  const crypto = Number(amount);
  const usd = Number.isFinite(crypto) && crypto > 0 && unit > 0 ? crypto * unit : 0;
  const fee = quoteTradeFee(usd);
  const payout = usd > 0 ? Math.max(0, usd - fee) : 0;
  const headline = `${formatAssetAmount(crypto)} ${symbol}`;

  function reset() {
    setAmount("");
    setError("");
    setStep("form");
  }

  return <WalletLayout title="Sell Crypto">
    <form className="space-y-6" onSubmit={event => { event.preventDefault(); const message = amountError(amount, asset.balance); setError(message); if (!message) setStep("preview"); }}>
      <div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-lg bg-pink-soft text-pink"><RefreshCw /></span><div><h2 className="text-xl font-bold">Sell crypto</h2><p className="text-sm text-muted-foreground">Cash out · Sample price</p></div></div>
      <WalletCoinSelect symbol={symbol} onChange={value => { setSymbol(value); setAmount(""); setError(""); setStep("form"); }} />
      <div className="space-y-2"><Label htmlFor="sell-amount">Amount ({symbol})</Label><div className="relative"><Input id="sell-amount" inputMode="decimal" placeholder="0.00" value={amount} onChange={event => { setAmount(event.target.value); setError(""); }} className="h-14 bg-card pr-20 text-xl" aria-invalid={!!error} aria-describedby={error ? "sell-error" : undefined} /><Button type="button" variant="ghost" className="absolute right-2 top-2 text-primary" onClick={() => { setAmount(String(asset.balance)); setError(""); }}>Max</Button></div><div className="flex justify-between gap-2 text-xs text-muted-foreground"><span>Available: {asset.quantity} {symbol}</span><span>Demo balance</span></div>{error && <p id="sell-error" role="alert" className="text-sm text-destructive">{error}</p>}</div>
      <div className="space-y-3 border-y py-4 text-sm">
        <div className="flex justify-between gap-4"><span className="text-muted-foreground">Estimated cash</span><span className="text-right font-semibold">{usd > 0 ? money(usd) : "—"}</span></div>
        <div className="flex justify-between gap-4"><span className="text-muted-foreground">Fee 1.5%</span><span className="font-semibold">{fee > 0 ? money(fee) : "—"}</span></div>
        <div className="flex justify-between gap-4"><span className="text-muted-foreground">You receive</span><span className="font-semibold">{payout > 0 ? money(payout) : "—"}</span></div>
      </div>
      <Button className="h-12 w-full" type="submit">Review demo sale<ArrowRight /></Button>
    </form>
    <TradePreviewModal
      open={step === "preview"}
      title="Review demo sale"
      headline={headline}
      detail={`You receive ${money(payout)} · Sample price ${asset.price}`}
      rows={[{ label: "Asset", value: asset.name }, { label: "Network", value: asset.network }, { label: "Estimated cash", value: money(usd) }, { label: "Fee 1.5%", value: money(fee) }, { label: "You receive", value: money(payout) }]}
      note="This quote uses a fixed sample price. The fee is a sample and confirming does not place an order or change your balance."
      confirmLabel="Confirm preview"
      editLabel="Edit sale"
      onConfirm={() => setStep("success")}
      onClose={() => setStep("form")}
    />
    <TradeSuccessModal
      open={step === "success"}
      title="Sale preview complete"
      headline={money(payout)}
      detail={`Sample fee ${money(fee)}. No cash was paid out. Your balance and transactions have not changed.`}
      againLabel="New demo sale"
      onAgain={reset}
      onClose={reset}
    />
  </WalletLayout>;
}
