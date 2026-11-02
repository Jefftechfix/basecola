import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useSyncExternalStore, type FormEvent } from "react";
import { ArrowLeft } from "lucide-react";
import { AccountShell } from "@/components/account-shell";
import { SecuritySuccess } from "@/components/security-success";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { applyTwoFactor, DEMO_AUTH_CODE, getSecuritySession, subscribeSecurity, twoFactorCodeError } from "@/lib/security-demo";

export const Route = createFileRoute("/two-factor")({
  head: () => ({ meta: [
    { title: "Two-Factor Authentication — Basecola" }, { name: "description", content: "Turn the Basecola demo two-factor step on or off." },
    { property: "og:title", content: "Two-Factor Authentication — Basecola" }, { property: "og:description", content: "Preview a second sign-in step. No authenticator is enrolled." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: TwoFactorPage,
});

function TwoFactorPage() {
  const session = useSyncExternalStore(subscribeSecurity, getSecuritySession, getSecuritySession);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<"on" | "off" | null>(null);

  function confirm(event: FormEvent) {
    event.preventDefault();
    const problem = twoFactorCodeError(code);
    if (problem) { setError(problem); return; }
    applyTwoFactor(true);
    setCode("");
    setError("");
    setSuccess("on");
  }

  function turnOff() {
    applyTwoFactor(false);
    setSuccess("off");
  }

  return <AccountShell active="/profile" title="Two-factor">
    <Button asChild variant="link" className="mb-4 h-auto px-0"><Link to="/security"><ArrowLeft />Back to security</Link></Button>
    <section className="rounded-3xl bg-card p-5 shadow-soft">
      <div className="flex items-center justify-between gap-3"><h2 className="font-bold">Two-factor authentication</h2><span className={`rounded-full px-2 py-1 text-xs font-semibold ${session.twoFactor ? "bg-green-soft text-success" : "bg-muted text-muted-foreground"}`}>{session.twoFactor ? "On" : "Off"}</span></div>
      {session.twoFactor ? <div className="mt-4 space-y-4">
        <p className="text-sm text-muted-foreground">A second step is enabled for this preview only. No authenticator app is connected.</p>
        <Button type="button" variant="outline" className="h-12 w-full" onClick={turnOff}>Turn off 2FA</Button>
      </div> : <form className="mt-4 space-y-4" onSubmit={confirm}>
        <p className="text-sm text-muted-foreground">Enter the demo code below to turn on a second step. This does not enroll a real authenticator.</p>
        <p className="rounded-xl bg-accent px-4 py-3 text-center text-2xl font-bold tracking-[0.3em] text-primary">{DEMO_AUTH_CODE}</p>
        <div className="space-y-2"><Label htmlFor="auth-code">6-digit code</Label><Input id="auth-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={e => { setCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }} aria-invalid={!!error} aria-describedby={error ? "auth-error" : undefined} /></div>
        {error && <p id="auth-error" role="alert" className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="h-12 w-full">Confirm 2FA</Button>
      </form>}
    </section>
    <SecuritySuccess open={success !== null} title={success === "off" ? "Two-factor authentication is off" : "Two-factor authentication is on"} detail={success === "off" ? "The second step is off for this preview." : "A second step is enabled for this preview. No authenticator app is connected."} onClose={() => setSuccess(null)} />
  </AccountShell>;
}
