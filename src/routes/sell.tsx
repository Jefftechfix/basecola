import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, RefreshCw } from "lucide-react";
import { TradePreviewModal, TradeSuccessModal } from "@/components/trade-modals";
import { WalletLayout, WalletCoinSelect } from "@/components/wallet-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { amountError, formatAssetAmount, quoteTradeFee, WALLET_ASSETS } from "@/lib/wallet-demo";
import { money } from "@/lib/account-demo";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { emailReceipt } from "@/lib/receipt.functions";
import { loadTradeSettings, tradeCryptoLimitError } from "@/lib/trade-settings";

async function loadHoldings() {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data, error } = await supabase.from("transactions").select("kind, coin, crypto_amount, status").in("kind", ["buy", "sell"]).eq("status", "completed");
  if (error) throw new Error(error.message);
  const held: Record<string, number> = {};
  for (const r of data ?? []) if (r.coin) held[r.coin] = (held[r.coin] ?? 0) + (r.kind === "buy" ? 1 : -1) * Number(r.crypto_amount ?? 0);
  return held;
}

export const Route = createFileRoute("/sell")({
  head: () => ({ meta: [
    { title: "Sell Crypto — Basecola" }, { name: "description", content: "Sell cryptocurrency into your Basecola wallet balance." },
    { property: "og:title", content: "Sell Crypto — Basecola" }, { property: "og:description", content: "Sell crypto on Basecola." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: SellPage,
});

function SellPage() {
  const [symbol, setSymbol] = useState("BTC");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState<"form" | "preview" | "success">("form");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ reference: string; payout: number; fee: number; price_usd: number } | null>(null);
  const qc = useQueryClient();
  const sendReceiptEmail = useServerFn(emailReceipt);
  const { data: holdings } = useQuery({ queryKey: ["holdings"], queryFn: loadHoldings });
  const { data: tradeSettings, isPending: settingsLoading, error: settingsError } = useQuery({ queryKey: ["trade-settings"], queryFn: loadTradeSettings });
  const available = Math.max(0, Math.floor((holdings?.[symbol] ?? 0) * 1e8) / 1e8);
  const asset = WALLET_ASSETS.find(item => item.sym === symbol);
  if (!asset) return null;
  const setting = tradeSettings?.find(item => item.coin === symbol && item.network === asset.network);
  const unit = setting?.sell_price_usd ?? 0;
  const crypto = Number(amount);
  const usd = Number.isFinite(crypto) && crypto > 0 && unit > 0 ? crypto * unit : 0;
  const fee = quoteTradeFee(usd);
  const payout = usd > 0 ? Math.max(0, usd - fee) : 0;
  const headline = `${formatAssetAmount(crypto)} ${symbol}`;

  async function confirmSell() {
    if (!asset || busy) return;
    setBusy(true);
    const { data, error: e } = await supabase.rpc("sell_crypto_to_balance", { _coin: symbol, _network: asset.network, _crypto_amount: crypto, _price_usd: unit });
    setBusy(false);
    if (e) { setError(e.message); setStep("form"); return; }
    const out = data as { reference: string; transaction_id: string; payout: number; fee: number; price_usd: number };
    setResult(out);
    void sendReceiptEmail({ data: { kind: "sell", id: out.transaction_id } }).catch(() => {});
    for (const key of [["wallet-balance"], ["transactions"], ["holdings"]]) qc.invalidateQueries({ queryKey: key });
    setStep("success");
  }

  function reset() {
    setResult(null);
    setAmount("");
    setError("");
    setStep("form");
  }

  return <WalletLayout title="Sell Crypto">
    <form className="space-y-6" onSubmit={event => { event.preventDefault(); if (settingsLoading) { setError("Loading current trade settings."); return; } if (settingsError || !setting) { setError("Sell settings are unavailable for this asset."); return; } if (!setting.sell_enabled) { setError("Selling this asset is currently unavailable."); return; } if (!holdings) { setError("Please log in to sell crypto."); return; } const limitError = tradeCryptoLimitError(crypto, setting.minimum_crypto_amount, setting.maximum_crypto_amount).replace("Amount", "Sell amount").replace("crypto", symbol); const message = amountError(amount, available) || limitError; setError(message); if (!message) setStep("preview"); }}>
      <div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-lg bg-pink-soft text-pink"><RefreshCw /></span><div><h2 className="text-xl font-bold">Sell crypto</h2><p className="text-sm text-muted-foreground">Cash out to wallet balance · Admin-configured price</p></div></div>
      <WalletCoinSelect symbol={symbol} onChange={value => { setSymbol(value); setAmount(""); setError(""); setStep("form"); }} />
      <div className="space-y-2"><Label htmlFor="sell-amount">Amount ({symbol})</Label><div className="relative"><Input id="sell-amount" inputMode="decimal" placeholder="0.00" value={amount} onChange={event => { setAmount(event.target.value); setError(""); }} className="h-14 bg-card pr-20 text-xl" aria-invalid={!!error} aria-describedby={error ? "sell-error" : undefined} /><Button type="button" variant="ghost" className="absolute right-2 top-2 text-primary" onClick={() => { setAmount(String(available)); setError(""); }}>Max</Button></div><div className="flex justify-between gap-2 text-xs text-muted-foreground"><span>Available: {available} {symbol}</span></div>{error && <p id="sell-error" role="alert" className="text-sm text-destructive">{error}</p>}</div>
      <div className="space-y-3 border-y py-4 text-sm">
        <div className="flex justify-between gap-4"><span className="text-muted-foreground">Estimated cash</span><span className="text-right font-semibold">{usd > 0 ? money(usd) : "—"}</span></div>
        <div className="flex justify-between gap-4"><span className="text-muted-foreground">Fee 1.5%</span><span className="font-semibold">{fee > 0 ? money(fee) : "—"}</span></div>
        <div className="flex justify-between gap-4"><span className="text-muted-foreground">You receive</span><span className="font-semibold">{payout > 0 ? money(payout) : "—"}</span></div>
      </div>
      {(settingsError || (tradeSettings && !setting)) && <p role="alert" className="text-sm text-destructive">{settingsError ? (settingsError as Error).message : "Sell settings are unavailable for this asset."}</p>}
      <Button className="h-12 w-full" type="submit" disabled={settingsLoading || !setting?.sell_enabled}>{settingsLoading ? "Loading trade settings…" : !setting?.sell_enabled ? "Selling unavailable" : "Review sale"}<ArrowRight /></Button>
    </form>
    <TradePreviewModal
      open={step === "preview"}
      title="Review sale"
      headline={headline}
      detail={`You receive ${money(payout)} · Current sell price ${money(unit)}`}
      rows={[{ label: "Asset", value: asset.name }, { label: "Network", value: asset.network }, { label: "Estimated cash", value: money(usd) }, { label: "Fee 1.5%", value: money(fee) }, { label: "You receive", value: money(payout) }]}
      note="The cash minus the 1.5% fee goes into your wallet balance. Settlement uses the current server-configured price."
      confirmLabel={busy ? "Selling…" : "Confirm sale"}
      editLabel="Edit sale"
      onConfirm={() => void confirmSell()}
      onClose={() => setStep("form")}
    />
    <TradeSuccessModal
      open={step === "success"}
      title="Sale complete"
      headline={money(result?.payout ?? payout)}
      detail={result ? `Settled at ${money(result.price_usd)} per ${symbol}. Fee ${money(result.fee)}. Reference ${result.reference}. ${money(result.payout)} was added to your wallet balance. A receipt was sent to your email.` : ""}
      againLabel="Sell more"
      onAgain={reset}
      onClose={reset}
    />
  </WalletLayout>;
}
