import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Eye, EyeOff, Lock, Mail, ShieldCheck } from "lucide-react";
import { AuthShell } from "@/components/brand";
import { Checkbox } from "@/components/ui/checkbox";
import { loginError, REMEMBERED_EMAIL_KEY } from "@/lib/login-demo";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [
    { title: "Log In — Basecola" }, { name: "description", content: "Log in to the Basecola demo account." },
    { property: "og:title", content: "Log In — Basecola" }, { property: "og:description", content: "Welcome back to the Basecola preview." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: LoginPage,
});

const field = "flex items-center gap-3 rounded-xl border border-input bg-card px-4 py-3 focus-within:ring-2 focus-within:ring-ring";
const input = "w-full bg-transparent outline-none placeholder:text-muted-foreground";

function rememberedEmail() {
  if (typeof sessionStorage === "undefined") return "";
  return sessionStorage.getItem(REMEMBERED_EMAIL_KEY) ?? "";
}

function LoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState(rememberedEmail);
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(Boolean(rememberedEmail()));
  const [error, setError] = useState("");

  const [busy, setBusy] = useState(false);
  const [pinStep, setPinStep] = useState(false);
  const [pin, setPin] = useState("");
  const [mfa, setMfa] = useState<{ factorId: string } | null>(null);
  const [mfaCode, setMfaCode] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    const problem = loginError(email, password);
    if (problem) { setError(problem); return; }
    setBusy(true);
    const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (authError) { setBusy(false); setError(authError.message); return; }
    if (remember) sessionStorage.setItem(REMEMBERED_EMAIL_KEY, email.trim());
    else sessionStorage.removeItem(REMEMBERED_EMAIL_KEY);
    setPassword("");
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal?.nextLevel === "aal2" && aal.currentLevel !== "aal2") {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const factor = factors?.totp.find(f => f.status === "verified");
      if (factor) { setBusy(false); setMfa({ factorId: factor.id }); return; }
    }
    await afterSecondStep();
  }

  async function afterSecondStep() {
    const { data: hasPin } = await supabase.rpc("has_login_pin");
    setBusy(false);
    if (!hasPin) { nav({ to: "/wallet" }); return; }
    setPassword("");
    setPinStep(true);
  }

  async function submitMfa(event: FormEvent) {
    event.preventDefault();
    if (busy || !mfa || mfaCode.length !== 6) return;
    setBusy(true); setError("");
    const { error: e } = await supabase.auth.mfa.challengeAndVerify({ factorId: mfa.factorId, code: mfaCode });
    if (e) { setBusy(false); setError("Incorrect or expired code. Try the latest code from your app."); setMfaCode(""); return; }
    setMfa(null); setMfaCode("");
    setBusy(true);
    await afterSecondStep();
  }

  async function submitPin(event: FormEvent) {
    event.preventDefault();
    if (busy || pin.length !== 4) return;
    setBusy(true); setError("");
    const { data: ok, error: pinError } = await supabase.rpc("verify_login_pin", { _pin: pin });
    setBusy(false);
    if (pinError) { setError(pinError.message); setPin(""); return; }
    if (!ok) { setError("Incorrect PIN. After 5 wrong tries PIN entry locks for 15 minutes."); setPin(""); return; }
    nav({ to: "/dashboard" });
  }

  async function cancelPin() {
    await supabase.auth.signOut();
    setPinStep(false); setPin(""); setError(""); setMfa(null); setMfaCode("");
  }

  if (mfa) return <AuthShell back={false}>
    <div className="mx-auto mb-6 grid h-24 w-24 place-items-center rounded-[1.75rem] bg-gradient-primary text-primary-foreground shadow-soft"><Lock className="h-12 w-12" /></div>
    <h1 className="text-center text-3xl font-extrabold">Two-Factor Code</h1>
    <p className="mt-2 text-center text-muted-foreground">Enter the 6-digit code from your authenticator app</p>
    <form className="mt-6 space-y-4" onSubmit={submitMfa}>
      <input autoFocus inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={mfaCode} onChange={e => { setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }} aria-label="6-digit authenticator code" placeholder="000000" className="w-full rounded-xl border border-input bg-card px-4 py-4 text-center text-3xl font-bold tracking-[0.4em] outline-none focus:ring-2 focus:ring-ring" />
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <button disabled={busy || mfaCode.length !== 6} className="w-full rounded-2xl bg-primary py-4 text-lg font-bold text-primary-foreground shadow-soft disabled:opacity-60">{busy ? "Checking…" : "Verify"}</button>
    </form>
    <button type="button" onClick={cancelPin} className="mt-6 w-full text-center text-sm font-bold text-primary">Use a different account</button>
  </AuthShell>;

  if (pinStep) return <AuthShell back={false}>
    <div className="mx-auto mb-6 grid h-24 w-24 place-items-center rounded-[1.75rem] bg-gradient-primary text-primary-foreground shadow-soft"><Lock className="h-12 w-12" /></div>
    <h1 className="text-center text-3xl font-extrabold">Enter Your PIN</h1>
    <p className="mt-2 text-center text-muted-foreground">Enter your 4-digit PIN to access your account</p>
    <form className="mt-6 space-y-4" onSubmit={submitPin}>
      <input autoFocus inputMode="numeric" autoComplete="off" type="password" maxLength={4} value={pin} onChange={e => { setPin(e.target.value.replace(/\D/g, "").slice(0, 4)); setError(""); }} aria-label="4-digit PIN" placeholder="••••" className="w-full rounded-xl border border-input bg-card px-4 py-4 text-center text-3xl font-bold tracking-[0.6em] outline-none focus:ring-2 focus:ring-ring" />
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <button disabled={busy || pin.length !== 4} className="w-full rounded-2xl bg-primary py-4 text-lg font-bold text-primary-foreground shadow-soft disabled:opacity-60">{busy ? "Checking…" : "Unlock"}</button>
    </form>
    <button type="button" onClick={cancelPin} className="mt-6 w-full text-center text-sm font-bold text-primary">Use a different account</button>
  </AuthShell>;

  return <AuthShell back={false}>
    <div className="relative mx-auto mb-6 h-24 w-24">
      <div className="grid h-24 w-24 place-items-center rounded-[1.75rem] bg-gradient-primary text-primary-foreground shadow-soft"><Lock className="h-12 w-12" /></div>
      <span className="absolute -bottom-1 -right-1 grid h-9 w-9 place-items-center rounded-full bg-card text-primary shadow-soft"><ShieldCheck className="h-5 w-5" /></span>
    </div>
    <h1 className="text-center text-3xl font-extrabold">Welcome Back</h1>
    <p className="mt-2 text-center text-muted-foreground">Login to your Basecola account</p>
    <form className="mt-6 space-y-4" onSubmit={submit}>
      <div className={field}><Mail className="h-5 w-5 text-muted-foreground" /><input required type="email" autoComplete="email" value={email} onChange={e => { setEmail(e.target.value); setError(""); }} className={input} placeholder="Email Address" aria-label="Email Address" aria-invalid={!!error} /></div>
      <div className={field}><Lock className="h-5 w-5 text-muted-foreground" /><input required type={show ? "text" : "password"} autoComplete="current-password" value={password} onChange={e => { setPassword(e.target.value); setError(""); }} className={input} placeholder="Password" aria-label="Password" /><button type="button" onClick={() => setShow(value => !value)} aria-label={show ? "Hide password" : "Show password"} className="text-muted-foreground">{show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button></div>
      <div className="flex items-center justify-between gap-3 text-sm">
        <label className="flex items-center gap-2 font-medium"><Checkbox checked={remember} onCheckedChange={value => setRemember(value === true)} aria-label="Remember me" />Remember me</label>
        <Link to="/forgot-password" className="font-bold text-primary">Forgot Password?</Link>
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <button disabled={busy} className="w-full rounded-2xl bg-primary py-4 text-lg font-bold text-primary-foreground shadow-soft disabled:opacity-60">{busy ? "Logging in…" : "Log In"}</button>
    </form>
    <p className="mt-6 text-center text-sm">Don't have an account? <Link to="/signup" className="font-bold text-primary">Sign Up</Link></p>
  </AuthShell>;
}
