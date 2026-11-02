import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useSyncExternalStore, type FormEvent } from "react";
import { ArrowLeft } from "lucide-react";
import { AccountShell } from "@/components/account-shell";
import { SecuritySuccess } from "@/components/security-success";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { applyPin, getSecuritySession, pinChangeError, subscribeSecurity } from "@/lib/security-demo";

export const Route = createFileRoute("/change-pin")({
  head: () => ({ meta: [
    { title: "Change PIN — Basecola" }, { name: "description", content: "Update the 4-digit PIN for this Basecola preview." },
    { property: "og:title", content: "Change PIN — Basecola" }, { property: "og:description", content: "Set a demo PIN that stays on this device." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: ChangePinPage,
});

function digits(value: string) {
  return value.replace(/\D/g, "").slice(0, 4);
}

function ChangePinPage() {
  const session = useSyncExternalStore(subscribeSecurity, getSecuritySession, getSecuritySession);
  const [currentPin, setCurrentPin] = useState("");
  const [pin, setPin] = useState("");
  const [pinAgain, setPinAgain] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function save(event: FormEvent) {
    event.preventDefault();
    const problem = pinChangeError(currentPin, pin, pinAgain);
    if (problem) { setError(problem); return; }
    applyPin(pin);
    setCurrentPin(""); setPin(""); setPinAgain("");
    setError("");
    setSuccess(true);
  }

  return <AccountShell active="/profile" title="Change PIN">
    <Button asChild variant="link" className="mb-4 h-auto px-0"><Link to="/security"><ArrowLeft />Back to security</Link></Button>
    <form className="space-y-4 rounded-3xl bg-card p-5 shadow-soft" onSubmit={save}>
      <p className="text-sm text-muted-foreground">Choose a 4-digit PIN for this preview. It is not sent anywhere.</p>
      {session.pinSet && <div className="space-y-2"><Label htmlFor="current-pin">Current PIN</Label><Input id="current-pin" inputMode="numeric" autoComplete="off" maxLength={4} value={currentPin} onChange={e => { setCurrentPin(digits(e.target.value)); setError(""); }} /></div>}
      <div className="space-y-2"><Label htmlFor="new-pin">New PIN</Label><Input id="new-pin" inputMode="numeric" autoComplete="off" maxLength={4} value={pin} onChange={e => { setPin(digits(e.target.value)); setError(""); }} aria-invalid={!!error} aria-describedby={error ? "pin-error" : undefined} /></div>
      <div className="space-y-2"><Label htmlFor="confirm-pin">Confirm PIN</Label><Input id="confirm-pin" inputMode="numeric" autoComplete="off" maxLength={4} value={pinAgain} onChange={e => { setPinAgain(digits(e.target.value)); setError(""); }} /></div>
      {error && <p id="pin-error" role="alert" className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="h-12 w-full">Update PIN</Button>
    </form>
    <SecuritySuccess open={success} title="PIN updated" detail="Your preview PIN is saved on this device. It was not sent anywhere." onClose={() => setSuccess(false)} />
  </AccountShell>;
}
