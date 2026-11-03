import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";
import { AccountShell } from "@/components/account-shell";
import { SecuritySuccess } from "@/components/security-success";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/change-pin")({
  head: () => ({ meta: [
    { title: "Change PIN — Basecola" }, { name: "description", content: "Change the 4-digit PIN you use to unlock your Basecola account." },
    { property: "og:title", content: "Change PIN — Basecola" }, { property: "og:description", content: "Securely update your Basecola sign-in PIN." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: ChangePinPage,
});

function digits(value: string) {
  return value.replace(/\D/g, "").slice(0, 4);
}

function ChangePinPage() {
  const [hasPin, setHasPin] = useState<boolean | null>(null);
  const [signedIn, setSignedIn] = useState(true);
  const [busy, setBusy] = useState(false);
  useEffect(() => { void (async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) { setSignedIn(false); return; }
    const { data: has } = await supabase.rpc("has_login_pin"); setHasPin(!!has);
  })(); }, []);
  const [currentPin, setCurrentPin] = useState("");
  const [pin, setPin] = useState("");
  const [pinAgain, setPinAgain] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (hasPin && currentPin.length !== 4) { setError("Enter your current 4-digit PIN."); return; }
    if (pin.length !== 4) { setError("New PIN must be 4 digits."); return; }
    if (pin !== pinAgain) { setError("PINs do not match."); return; }
    if (hasPin && pin === currentPin) { setError("Choose a PIN different from your current one."); return; }
    setBusy(true);
    const { error: e } = hasPin ? await supabase.rpc("change_login_pin", { _current_pin: currentPin, _new_pin: pin }) : await supabase.rpc("set_login_pin", { _pin: pin });
    setBusy(false);
    if (e) { setError(e.message); setCurrentPin(""); return; }
    setHasPin(true);
    setCurrentPin(""); setPin(""); setPinAgain("");
    setError("");
    setSuccess(true);
  }

  return <AccountShell active="/profile" title="Change PIN">
    <Button asChild variant="link" className="mb-4 h-auto px-0"><Link to="/security"><ArrowLeft />Back to security</Link></Button>
    <form className="space-y-4 rounded-3xl bg-card p-5 shadow-soft" onSubmit={save}>
      {!signedIn ? <><p className="text-sm text-muted-foreground">Log in to change your PIN.</p><Button asChild className="h-12 w-full"><Link to="/login">Log in</Link></Button></> : <>
      <p className="text-sm text-muted-foreground">{hasPin ? "Enter your current PIN, then choose a new 4-digit PIN for unlocking your account." : "Choose a 4-digit PIN to unlock your account after login."}</p>
      {hasPin && <div className="space-y-2"><Label htmlFor="current-pin">Current PIN</Label><Input id="current-pin" inputMode="numeric" autoComplete="off" maxLength={4} value={currentPin} onChange={e => { setCurrentPin(digits(e.target.value)); setError(""); }} /></div>}
      <div className="space-y-2"><Label htmlFor="new-pin">New PIN</Label><Input id="new-pin" inputMode="numeric" autoComplete="off" maxLength={4} value={pin} onChange={e => { setPin(digits(e.target.value)); setError(""); }} aria-invalid={!!error} aria-describedby={error ? "pin-error" : undefined} /></div>
      <div className="space-y-2"><Label htmlFor="confirm-pin">Confirm PIN</Label><Input id="confirm-pin" inputMode="numeric" autoComplete="off" maxLength={4} value={pinAgain} onChange={e => { setPinAgain(digits(e.target.value)); setError(""); }} /></div>
      {error && <p id="pin-error" role="alert" className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="h-12 w-full" disabled={busy || hasPin === null}>{busy ? "Saving…" : hasPin === false ? "Set PIN" : "Update PIN"}</Button></>}
    </form>
    <SecuritySuccess open={success} title="PIN updated" detail="Use your new PIN next time you log in." onClose={() => setSuccess(false)} />
  </AccountShell>;
}
