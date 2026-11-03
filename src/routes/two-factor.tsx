import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft } from "lucide-react";
import { AccountShell } from "@/components/account-shell";
import { SecuritySuccess } from "@/components/security-success";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/two-factor")({
  head: () => ({ meta: [
    { title: "Two-Factor Authentication — Basecola" }, { name: "description", content: "Protect your Basecola account with an authenticator app code at sign-in." },
    { property: "og:title", content: "Two-Factor Authentication — Basecola" }, { property: "og:description", content: "Turn on authenticator-app two-factor authentication for Basecola." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: TwoFactorPage,
});

type Enrollment = { id: string; qr: string; secret: string };

function TwoFactorPage() {
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(true);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState<Enrollment | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState<"on" | "off" | null>(null);

  async function refresh() {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { setSignedIn(false); setLoading(false); return; }
    const { data } = await supabase.auth.mfa.listFactors();
    setFactorId(data?.totp.find(f => f.status === "verified")?.id ?? null);
    setLoading(false);
  }
  useEffect(() => { void refresh(); }, []);

  async function start() {
    setBusy(true); setError("");
    const { data: list } = await supabase.auth.mfa.listFactors();
    for (const f of list?.all ?? []) if (f.status === "unverified") await supabase.auth.mfa.unenroll({ factorId: f.id });
    const { data, error: e } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: `Basecola ${Date.now()}` });
    setBusy(false);
    if (e || !data) { setError(e?.message ?? "Could not start setup."); return; }
    setEnrolling({ id: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
  }

  async function confirm(event: FormEvent) {
    event.preventDefault();
    if (!enrolling || code.length !== 6) { setError("Enter the 6-digit code from your authenticator app."); return; }
    setBusy(true); setError("");
    const { error: e } = await supabase.auth.mfa.challengeAndVerify({ factorId: enrolling.id, code });
    setBusy(false);
    if (e) { setError(e.message); setCode(""); return; }
    setEnrolling(null); setCode(""); setSuccess("on"); await refresh();
  }

  async function turnOff() {
    if (!factorId) return;
    setBusy(true); setError("");
    const { error: e } = await supabase.auth.mfa.unenroll({ factorId });
    setBusy(false);
    if (e) { setError(e.message.includes("aal2") ? "Sign out and sign in again with your authenticator code, then turn off 2FA." : e.message); return; }
    setSuccess("off"); await refresh();
  }

  const on = !!factorId;
  return <AccountShell active="/profile" title="Two-factor">
    <Button asChild variant="link" className="mb-4 h-auto px-0"><Link to="/security"><ArrowLeft />Back to security</Link></Button>
    <section className="rounded-3xl bg-card p-5 shadow-soft">
      <div className="flex items-center justify-between gap-3"><h2 className="font-bold">Two-factor authentication</h2>{!loading && signedIn && <span className={`rounded-full px-2 py-1 text-xs font-semibold ${on ? "bg-green-soft text-success" : "bg-muted text-muted-foreground"}`}>{on ? "On" : "Off"}</span>}</div>
      {loading ? <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
      : !signedIn ? <div className="mt-4 space-y-4"><p className="text-sm text-muted-foreground">Log in to manage two-factor authentication.</p><Button asChild className="h-12 w-full"><Link to="/login">Log in</Link></Button></div>
      : on ? <div className="mt-4 space-y-4">
        <p className="text-sm text-muted-foreground">Your account asks for a code from your authenticator app each time you sign in.</p>
        <Button type="button" variant="outline" className="h-12 w-full" disabled={busy} onClick={turnOff}>{busy ? "Turning off…" : "Turn off 2FA"}</Button>
      </div>
      : enrolling ? <form className="mt-4 space-y-4" onSubmit={confirm}>
        <p className="text-sm text-muted-foreground">Scan this QR code with Google Authenticator, Authy or a similar app, then enter the 6-digit code it shows.</p>
        <div className="mx-auto w-48 rounded-xl bg-background p-3"><img src={enrolling.qr} alt="Authenticator setup QR code" className="h-full w-full" /></div>
        <p className="break-all rounded-xl bg-accent px-4 py-3 text-center text-sm font-semibold text-primary">Setup key: {enrolling.secret}</p>
        <div className="space-y-2"><Label htmlFor="auth-code">6-digit code</Label><Input id="auth-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={e => { setCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }} aria-invalid={!!error} /></div>
        <Button type="submit" className="h-12 w-full" disabled={busy}>{busy ? "Verifying…" : "Confirm 2FA"}</Button>
        <Button type="button" variant="ghost" className="w-full" onClick={() => { setEnrolling(null); setCode(""); }}>Cancel</Button>
      </form>
      : <div className="mt-4 space-y-4">
        <p className="text-sm text-muted-foreground">Add a second step at sign-in using an authenticator app on your phone.</p>
        <Button type="button" className="h-12 w-full" disabled={busy} onClick={start}>{busy ? "Starting…" : "Set up 2FA"}</Button>
      </div>}
      {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
    </section>
    <SecuritySuccess open={success !== null} title={success === "off" ? "Two-factor authentication is off" : "Two-factor authentication is on"} detail={success === "off" ? "You'll sign in with just your password and PIN." : "You'll need a code from your authenticator app each time you sign in."} onClose={() => setSuccess(null)} />
  </AccountShell>;
}
