import { useServerFn } from "@tanstack/react-start";
import { emailReceipt } from "@/lib/receipt.functions";
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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { loadWalletBalance } from "@/lib/wallet-balance";

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
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ reference: string; balance: number } | null>(null);
  const qc = useQueryClient();
  const sendReceiptEmail = useServerFn(emailReceipt);
  const { data: balance, isPending: balanceLoading } = useQuery({ queryKey: ["wallet-balance"], queryFn: loadWalletBalance });
  const asset = WALLET_ASSETS.find(item => item.sym === symbol);
  if (!asset) return null;
  const unit = sampleUnitPrice(asset.price);
  const usd = Number(amount);
  const crypto = Number.isFinite(usd) && usd > 0 && unit > 0 ? usd / unit : 0;
  const fee = quoteTradeFee(usd);
  const total = usd > 0 ? usd + fee : 0;
  const headline = `${formatAssetAmount(crypto)} ${symbol}`;

  async function confirmBuy() {
    if (!asset) return;
    setBusy(true);
    const { data, error: rpcError } = await supabase.rpc("buy_crypto_with_balance", { _coin: symbol, _network: asset.network, _usd_amount: usd, _price_usd: unit });
    setBusy(false);
    if (rpcError) { setError(rpcError.message); setStep("form"); return; }
    const out = data as { reference: string; balance: number; transaction_id: string };
    void sendReceiptEmail({ data: { kind: "buy", id: out.transaction_id } }).catch(() => {});
    setResult(out);
    setStep("success");
    for (const key of [["wallet-balance"], ["transactions"], ["wallet-records"]]) qc.invalidateQueries({ queryKey: key });
  }

  function reset() {
    setResult(null);
    setAmount("");
    setError("");
    setStep("form");
  }

  return <WalletLayout title="Buy Crypto">
    <form className="space-y-6" onSubmit={event => { event.preventDefault(); if (!balance) { setError("Please log in to buy with your wallet balance."); return; } const message = amountError(amount) || (total > balance.total ? `Insufficient wallet balance. Available: ${money(balance.total)}` : ""); setError(message); if (!message) setStep("preview"); }}>
      <div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-lg bg-accent text-primary"><Bitcoin /></span><div><h2 className="text-xl font-bold">Buy crypto</h2><p className="text-sm text-muted-foreground">Pay with wallet balance · Sample price</p></div></div>
      <div className="flex items-center justify-between rounded-lg border bg-card p-4 text-sm"><span className="text-muted-foreground">Wallet balance</span>{balanceLoading ? <span>Loading…</span> : balance ? <span className="font-semibold">{money(balance.total)}</span> : <Link to="/login" className="font-semibold text-primary">Log in</Link>}</div>
      <WalletCoinSelect symbol={symbol} onChange={value => { setSymbol(value); setAmount(""); setError(""); setStep("form"); }} />
      <div className="space-y-2"><Label htmlFor="buy-amount">Amount (USD)</Label><Input id="buy-amount" inputMode="decimal" placeholder="0.00" value={amount} onChange={event => { setAmount(event.target.value); setError(""); }} className="h-14 bg-card text-2xl" aria-invalid={!!error} aria-describedby={error ? "buy-error" : undefined} />{error && <p id="buy-error" role="alert" className="text-sm text-destructive">{error}</p>}</div>
      <div className="grid grid-cols-3 gap-3">{[50, 100, 250].map(value => <Button key={value} type="button" variant="outline" onClick={() => { setAmount(String(value)); setError(""); }}>{money(value)}</Button>)}</div>
      <div className="space-y-3 border-y py-4 text-sm">
        <div className="flex justify-between gap-4"><span className="text-muted-foreground">Estimated {symbol}</span><span className="text-right font-semibold">{crypto > 0 ? headline : "—"}</span></div>
        <div className="flex justify-between gap-4"><span className="text-muted-foreground">Fee 1.5%</span><span className="font-semibold">{fee > 0 ? money(fee) : "—"}</span></div>
        <div className="flex justify-between gap-4"><span className="text-muted-foreground">Total</span><span className="font-semibold">{total > 0 ? money(total) : "—"}</span></div>
      </div>
      <Button className="h-12 w-full" type="submit">Review purchase<ArrowRight /></Button>
    </form>
    <TradePreviewModal
      open={step === "preview"}
      title="Review purchase"
      headline={headline}
      detail={`You pay ${money(total)} · Sample price ${asset.price}`}
      rows={[{ label: "Asset", value: asset.name }, { label: "Network", value: asset.network }, { label: "Amount", value: money(usd) }, { label: "Fee 1.5%", value: money(fee) }, { label: "Total", value: money(total) }]}
      note={`Paid from your wallet balance${balance ? ` (${money(balance.total)} available)` : ""}. Price is a fixed sample price.`}
      confirmLabel={busy ? "Buying…" : "Confirm purchase"}
      editLabel="Edit purchase"
      onConfirm={() => { if (!busy) void confirmBuy(); }}
      onClose={() => setStep("form")}
    />
    <TradeSuccessModal
      open={step === "success"}
      title="Purchase complete"
      headline={headline}
      detail={result ? `Reference ${result.reference}. New wallet balance ${money(result.balance)}. A receipt was sent to your email.` : ""}
      againLabel="Buy more"
      onAgain={reset}
      onClose={reset}
    />
  </WalletLayout>;
}
