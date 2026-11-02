import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Check, TriangleAlert } from "lucide-react";
import { WalletLayout, WalletCoinSelect } from "@/components/wallet-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { demoReceiveCode, WALLET_ASSETS } from "@/lib/wallet-demo";

export const Route = createFileRoute("/receive")({
  head: () => ({ meta: [
    { title: "Receive Crypto — Basecola" }, { name: "description", content: "Preview your Basecola receive screen and cryptocurrency network selection." },
    { property: "og:title", content: "Receive Crypto — Basecola" }, { property: "og:description", content: "Basecola demo cryptocurrency receive details." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: ReceivePage,
});

function ReceivePage() {
  const [symbol, setSymbol] = useState("BTC");
  const [copyState, setCopyState] = useState("");
  const code = demoReceiveCode(symbol);
  const asset = WALLET_ASSETS.find(item => item.sym === symbol);
  async function copy() {
    try { await navigator.clipboard.writeText(code); setCopyState("Copied demo code"); }
    catch { setCopyState("Copy unavailable. Select the demo code below to copy it manually."); }
  }
  return <WalletLayout title="Receive Crypto">
    <WalletCoinSelect symbol={symbol} onChange={value => { setSymbol(value); setCopyState(""); }} />
    <div className="mt-6 flex items-start gap-3 rounded-lg bg-warning-soft p-4 text-sm"><TriangleAlert className="h-5 w-5 shrink-0 text-warning" /><div><p className="font-bold">Do not send funds to this code</p><p className="mt-1 text-muted-foreground">This is a demo identifier, not a cryptocurrency address.</p></div></div>
    <div className="my-7 flex flex-col items-center gap-3"><div className="rounded-lg border bg-card p-5"><QRCodeSVG value={code} size={184} bgColor="var(--card)" fgColor="var(--foreground)" title={`Demo ${symbol} identifier — not a wallet address`} /></div><p className="text-sm font-semibold">{asset?.name} · {asset?.network}</p><span className="text-xs text-muted-foreground">Demo QR code</span></div>
    <div className="space-y-2"><Label htmlFor="receive-code">Demo receive identifier</Label><Input id="receive-code" value={code} readOnly className="h-12 bg-card font-mono text-xs" onFocus={e => e.target.select()} /></div>
    <Button className="mt-4 h-12 w-full" onClick={copy}>{copyState === "Copied demo code" ? <Check /> : <Copy />}Copy demo code</Button>
    {copyState && <p role="status" className="mt-3 text-center text-sm text-muted-foreground">{copyState}</p>}
  </WalletLayout>;
}