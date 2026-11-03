import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";
import { AccountShell } from "@/components/account-shell";
import { SecuritySuccess } from "@/components/security-success";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/change-password")({
  head: () => ({ meta: [
    { title: "Change Password — Basecola" }, { name: "description", content: "Change the password for your Basecola account." },
    { property: "og:title", content: "Change Password — Basecola" }, { property: "og:description", content: "Securely update your Basecola account password." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: ChangePasswordPage,
});

function ChangePasswordPage() {
  const [email, setEmail] = useState<string | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  useEffect(() => { void supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null)); }, []);
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [passwordAgain, setPasswordAgain] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (busy || !email) return;
    if (!currentPassword) { setError("Enter your current password."); return; }
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) { setError("New password needs at least 8 characters with uppercase, lowercase and a number."); return; }
    if (password !== passwordAgain) { setError("Passwords do not match."); return; }
    if (password === currentPassword) { setError("Choose a password different from your current one."); return; }
    setBusy(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: currentPassword });
    if (signInError) { setBusy(false); setError("Current password is incorrect."); return; }
    const { error: e } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (e) { setError(e.message.includes("AAL2") || e.message.includes("aal2") ? "Sign out and sign in with your two-factor code, then try again." : e.message); return; }
    setCurrentPassword(""); setPassword(""); setPasswordAgain("");
    setError("");
    setSuccess(true);
  }

  return <AccountShell active="/profile" title="Change password">
    <Button asChild variant="link" className="mb-4 h-auto px-0"><Link to="/security"><ArrowLeft />Back to security</Link></Button>
    <form className="space-y-4 rounded-3xl bg-card p-5 shadow-soft" onSubmit={save}>
      {email === null ? <><p className="text-sm text-muted-foreground">Log in to change your password.</p><Button asChild className="h-12 w-full"><Link to="/login">Log in</Link></Button></> : <>
      <p className="text-sm text-muted-foreground">Enter your current password, then choose a new one with at least 8 characters, uppercase, lowercase and a number.</p>
      <div className="space-y-2"><Label htmlFor="current-password">Current password</Label><Input id="current-password" type="password" autoComplete="current-password" value={currentPassword} onChange={e => { setCurrentPassword(e.target.value); setError(""); }} /></div>
      <div className="space-y-2"><Label htmlFor="new-password">New password</Label><Input id="new-password" type="password" autoComplete="new-password" value={password} onChange={e => { setPassword(e.target.value); setError(""); }} aria-invalid={!!error} aria-describedby={error ? "password-error" : undefined} /></div>
      <div className="space-y-2"><Label htmlFor="confirm-password">Confirm password</Label><Input id="confirm-password" type="password" autoComplete="new-password" value={passwordAgain} onChange={e => { setPasswordAgain(e.target.value); setError(""); }} /></div>
      {error && <p id="password-error" role="alert" className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="h-12 w-full" disabled={busy || email === undefined}>{busy ? "Updating…" : "Update password"}</Button></>}
    </form>
    <SecuritySuccess open={success} title="Password updated" detail="Use your new password next time you log in." onClose={() => setSuccess(false)} />
  </AccountShell>;
}
