import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { CheckCircle2, Eye, EyeOff, Lock } from "lucide-react";
import { AuthShell } from "@/components/brand";
import { applyPassword } from "@/lib/security-demo";
import { resetPasswordChecks, resetPasswordError } from "@/lib/login-demo";

export const Route = createFileRoute("/reset-password")({
  validateSearch: (search: Record<string, unknown>) => ({ email: typeof search.email === "string" ? search.email : "" }),
  head: () => ({ meta: [
    { title: "Reset Password — Basecola" }, { name: "description", content: "Choose a new password for this Basecola preview." },
    { property: "og:title", content: "Reset Password — Basecola" }, { property: "og:description", content: "Create a new demo password." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: ResetPasswordPage,
});

const field = "flex items-center gap-3 rounded-xl border border-input bg-card px-4 py-3 focus-within:ring-2 focus-within:ring-ring";
const input = "w-full bg-transparent outline-none placeholder:text-muted-foreground";

function ResetPasswordPage() {
  const nav = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const checks = resetPasswordChecks(password);
  const ready = resetPasswordError(password, confirm) === "";

  function submit(event: FormEvent) {
    event.preventDefault();
    const problem = resetPasswordError(password, confirm);
    if (problem) { setError(problem); return; }
    applyPassword(password);
    nav({ to: "/reset-password-success" });
  }

  return <AuthShell>
    <div className="mx-auto mb-6 grid h-24 w-24 place-items-center rounded-[1.75rem] bg-gradient-primary text-primary-foreground shadow-soft"><Lock className="h-12 w-12" /></div>
    <h1 className="text-center text-3xl font-extrabold">Reset Password</h1>
    <p className="mt-2 text-center text-muted-foreground">Create a new password for your account.</p>
    <form className="mt-6 space-y-4" onSubmit={submit}>
      <div className={field}><Lock className="h-5 w-5 text-muted-foreground" /><input required type={showPassword ? "text" : "password"} autoComplete="new-password" value={password} onChange={e => { setPassword(e.target.value); setError(""); }} className={input} placeholder="New Password" aria-label="New Password" /><button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? "Hide new password" : "Show new password"} className="text-muted-foreground">{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button></div>
      <div className={field}><Lock className="h-5 w-5 text-muted-foreground" /><input required type={showConfirm ? "text" : "password"} autoComplete="new-password" value={confirm} onChange={e => { setConfirm(e.target.value); setError(""); }} className={input} placeholder="Confirm New Password" aria-label="Confirm New Password" /><button type="button" onClick={() => setShowConfirm(value => !value)} aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"} className="text-muted-foreground">{showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button></div>
      <ul className="space-y-2 rounded-2xl bg-accent p-4 text-sm">
        {checks.map(rule => <li key={rule.label} className={`flex items-center gap-2 ${rule.ok ? "text-success" : "text-muted-foreground"}`}><CheckCircle2 className="h-4 w-4" />{rule.label}</li>)}
      </ul>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <button disabled={!ready} className="w-full rounded-2xl bg-primary py-4 text-lg font-bold text-primary-foreground shadow-soft disabled:opacity-60">Reset Password</button>
    </form>
    <p className="mt-4 text-center text-xs text-muted-foreground">The new password stays in this preview. It is not sent anywhere.</p>
  </AuthShell>;
}
