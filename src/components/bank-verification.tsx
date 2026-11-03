import { useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { listRecords } from "@/lib/wallet-records";
import { microdepositInput, verifyMicrodeposits } from "@/lib/stripe-funding";

function VerifyForm({ row }: { row: Record<string, unknown> }) {
  const id = String(row.id);
  const [first, setFirst] = useState("");
  const [second, setSecond] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const qc = useQueryClient();

  async function submit(event: FormEvent) {
    event.preventDefault();
    const input = microdepositInput(first, second, code);
    if ("error" in input) return setError(input.error);
    setBusy(true); setError("");
    try {
      await verifyMicrodeposits(String(row.reference), input);
      setDone(true);
      qc.invalidateQueries({ queryKey: ["wallet-records", "fundings"] });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Verification failed.");
    } finally { setBusy(false); }
  }

  if (done) return <p className="text-sm text-success">Bank verified. The transfer is now processing and will be added to your balance when it clears.</p>;
  return <form onSubmit={submit} className="space-y-3">
    <p className="text-sm text-muted-foreground">Check your bank statement for 2 small deposits from Stripe (1–2 business days), then enter them here. Some banks show a single deposit with a code starting with SM instead.</p>
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1"><Label htmlFor={`d1-${id}`}>Deposit 1 ($)</Label><Input id={`d1-${id}`} inputMode="decimal" placeholder="0.32" value={first} onChange={e => setFirst(e.target.value)} className="bg-card" /></div>
      <div className="space-y-1"><Label htmlFor={`d2-${id}`}>Deposit 2 ($)</Label><Input id={`d2-${id}`} inputMode="decimal" placeholder="0.45" value={second} onChange={e => setSecond(e.target.value)} className="bg-card" /></div>
    </div>
    <div className="space-y-1"><Label htmlFor={`code-${id}`}>Or code (instead of amounts)</Label><Input id={`code-${id}`} placeholder="SM11AA" value={code} onChange={e => setCode(e.target.value)} className="bg-card uppercase" /></div>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <Button type="submit" className="w-full" disabled={busy}>{busy ? "Verifying…" : "Verify bank account"}</Button>
  </form>;
}

export function BankVerification() {
  const { data } = useQuery({ queryKey: ["wallet-records", "fundings"], queryFn: () => listRecords("fundings") });
  const pending = (data ?? []).filter(r => String(r.payment_method).includes("awaiting bank verification") && String(r.reference ?? "").startsWith("cs_"));
  if (!pending.length) return null;
  return <section className="mb-8 space-y-4">
    <h2 className="text-lg font-bold">Verify your bank</h2>
    {pending.map(row => <div key={String(row.id)} className="space-y-3 rounded-2xl bg-card p-4 shadow-soft">
      <p className="flex items-center gap-2 font-semibold"><Building2 className="h-4 w-4" />${Number(row.amount).toFixed(2)} · {String(row.payment_method).replace(/ · awaiting bank verification$/, "")}</p>
      <VerifyForm row={row} />
    </div>)}
  </section>;
}
