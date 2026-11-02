import { useState, type FormEvent } from "react";
import { Building2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { STRIPE_DEMO_PASSWORD, STRIPE_DEMO_USERNAME, matchingStripeDemoBanks, stripeDemoLoginError, type ConnectedStripeBank, type StripeDemoBank } from "@/lib/wallet-demo";

export function StripeBankDemo({ open, onOpenChange, onConnect }: { open: boolean; onOpenChange: (open: boolean) => void; onConnect: (bank: ConnectedStripeBank) => void }) {
  const [step, setStep] = useState<"banks" | "login" | "accounts">("banks");
  const [query, setQuery] = useState("");
  const [bank, setBank] = useState<StripeDemoBank | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [accountId, setAccountId] = useState("");
  const [error, setError] = useState("");
  const banks = matchingStripeDemoBanks(query);

  function close(next: boolean) {
    if (!next) {
      setStep("banks");
      setQuery("");
      setBank(null);
      setUsername("");
      setPassword("");
      setAccountId("");
      setError("");
    }
    onOpenChange(next);
  }

  function pickBank(next: StripeDemoBank) {
    setBank(next);
    setAccountId(next.accounts[0]?.id ?? "");
    setUsername("");
    setPassword("");
    setError("");
    setStep("login");
  }

  function signIn(event: FormEvent) {
    event.preventDefault();
    const message = stripeDemoLoginError(username, password);
    setError(message);
    if (message) return;
    setPassword("");
    setStep("accounts");
  }

  function connect() {
    const account = bank?.accounts.find(item => item.id === accountId);
    if (!bank || !account) return;
    onConnect({ bankId: bank.id, bankName: bank.name, accountId: account.id, accountType: account.type, last4: account.last4, holder: account.holder });
    close(false);
  }

  return <Dialog open={open} onOpenChange={close}>
    <DialogContent className="max-h-[85vh] max-w-sm overflow-y-auto rounded-3xl">
      <DialogHeader>
        <p className="text-sm font-semibold tracking-tight text-[#635bff]">stripe <span className="ml-1 rounded bg-[#635bff]/10 px-1.5 py-0.5 align-middle text-[10px] font-bold uppercase tracking-wide">Demo</span></p>
        <DialogTitle>{step === "banks" ? "Select a bank" : step === "login" ? bank?.name : "Select an account"}</DialogTitle>
        <DialogDescription>{step === "login" ? "Sample sign-in for this preview. It stays in Basecola and is not sent to Stripe or a bank." : "Stripe demo. Basecola does not contact Stripe."}</DialogDescription>
      </DialogHeader>
      {step === "banks" ? <div className="space-y-3">
        <div className="space-y-2"><Label htmlFor="stripe-bank-search">Search demo banks</Label><Input id="stripe-bank-search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Bank name" className="h-11 bg-card" /></div>
        <ul className="space-y-2">
          {banks.map(item => <li key={item.id}><Button type="button" variant="outline" className="h-14 w-full justify-between" onClick={() => pickBank(item)}><span className="flex items-center gap-2"><Building2 />{item.name}</span><ChevronRight /></Button></li>)}
        </ul>
        {banks.length === 0 && <p className="text-sm text-muted-foreground">No demo bank matches that name.</p>}
      </div> : step === "login" && bank ? <form className="space-y-4" onSubmit={signIn}>
        <p className="rounded-xl bg-muted px-3 py-2 text-xs leading-relaxed text-muted-foreground">Demo sign-in: <span className="font-semibold text-foreground">{STRIPE_DEMO_USERNAME}</span> / <span className="font-semibold text-foreground">{STRIPE_DEMO_PASSWORD}</span></p>
        <div className="space-y-2"><Label htmlFor="stripe-demo-user">Username</Label><Input id="stripe-demo-user" autoComplete="off" value={username} onChange={event => { setUsername(event.target.value); setError(""); }} className="h-11 bg-card" aria-invalid={!!error} aria-describedby={error ? "stripe-demo-error" : undefined} /></div>
        <div className="space-y-2"><Label htmlFor="stripe-demo-pass">Password</Label><Input id="stripe-demo-pass" type="password" autoComplete="off" value={password} onChange={event => { setPassword(event.target.value); setError(""); }} className="h-11 bg-card" /></div>
        {error && <p id="stripe-demo-error" role="alert" className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="h-11 w-full bg-[#635bff] text-white hover:bg-[#635bff]/90">Continue</Button>
        <Button type="button" variant="ghost" className="w-full" onClick={() => { setStep("banks"); setError(""); }}><ChevronLeft />Back</Button>
      </form> : bank ? <div className="space-y-3">
        <div role="radiogroup" aria-label="Demo accounts" className="space-y-2">
          {bank.accounts.map(account => <Button key={account.id} type="button" role="radio" aria-checked={accountId === account.id} variant={accountId === account.id ? "default" : "outline"} className="h-14 w-full justify-between" onClick={() => setAccountId(account.id)}><span>{account.type}</span><span>Ending {account.last4}</span></Button>)}
        </div>
        <Button type="button" className="h-11 w-full bg-[#635bff] text-white hover:bg-[#635bff]/90" onClick={connect}>Connect account</Button>
        <Button type="button" variant="ghost" className="w-full" onClick={() => setStep("login")}><ChevronLeft />Back</Button>
      </div> : null}
    </DialogContent>
  </Dialog>;
}
