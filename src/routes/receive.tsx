import { useServerFn } from "@tanstack/react-start";
import { emailReceipt } from "@/lib/receipt.functions";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Check, TriangleAlert } from "lucide-react";
import { WalletLayout, WalletCoinSelect } from "@/components/wallet-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WalletRecords } from "@/components/wallet-records";
import { useQueryClient } from "@tanstack/react-query";
import { saveReceive } from "@/lib/wallet-records";
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
  const [amount, setAmount] = useState("");
  const [saveMsg, setSaveMsg] = useState("");
  const qc = useQueryClient();
  const sendReceiptEmail = useServerFn(emailReceipt);
  const code = demoReceiveCode(symbol);
  const asset = WALLET_ASSETS.find(item => item.sym === symbol);
  async function copy() {
    try { await navigator.clipboard.writeText(code); setCopyState("Copied demo code"); }
    catch { setCopyState("Copy unavailable. Select the demo code below to copy it manually."); }
  }
  async function save() {
    setSaveMsg("");
    const n = amount.trim() ? Number(amount) : null;
    if (n !== null && !(n > 0)) { setSaveMsg("Enter a valid amount."); return; }
    try { const recordId = await saveReceive({ coin: symbol, network: asset?.network ?? "", wallet_address: code, amount: n }); void sendReceiptEmail({ data: { kind: "receive", id: recordId } }).catch(() => {}); setAmount(""); setSaveMsg("Receive request saved."); qc.invalidateQueries({ queryKey: ["wallet-records", "receives"] }); }
    catch (e) { setSaveMsg((e as Error).message); }
  }
  return <WalletLayout title="Receive Crypto">
    <WalletCoinSelect symbol={symbol} onChange={value => { setSymbol(value); setCopyState(""); }} />
    <div className="mt-6 flex items-start gap-3 rounded-lg bg-warning-soft p-4 text-sm"><TriangleAlert className="h-5 w-5 shrink-0 text-warning" /><div><p className="font-bold">Do not send funds to this code</p><p className="mt-1 text-muted-foreground">This is a demo identifier, not a cryptocurrency address.</p></div></div>
    <div className="my-7 flex flex-col items-center gap-3"><div className="rounded-lg border bg-card p-5"><QRCodeSVG value={code} size={184} bgColor="var(--card)" fgColor="var(--foreground)" title={`Demo ${symbol} identifier — not a wallet address`} /></div><p className="text-sm font-semibold">{asset?.name} · {asset?.network}</p><span className="text-xs text-muted-foreground">Demo QR code</span></div>
    <div className="space-y-2"><Label htmlFor="receive-code">Demo receive identifier</Label><Input id="receive-code" value={code} readOnly className="h-12 bg-card font-mono text-xs" onFocus={e => e.target.select()} /></div>
    <Button className="mt-4 h-12 w-full" onClick={copy}>{copyState === "Copied demo code" ? <Check /> : <Copy />}Copy demo code</Button>
    {copyState && <p role="status" className="mt-3 text-center text-sm text-muted-foreground">{copyState}</p>}
    <div className="mt-6 space-y-2"><Label htmlFor="receive-amount">Expected amount (optional)</Label><Input id="receive-amount" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} className="h-12 bg-card" placeholder={`0.00 ${symbol}`} /></div>
    <Button variant="outline" className="mt-3 h-12 w-full" onClick={save}>Save receive request</Button>
    {saveMsg && <p role="status" className="mt-3 text-center text-sm text-muted-foreground">{saveMsg}</p>}
    <WalletRecords kind="receives" />
  </WalletLayout>;
}