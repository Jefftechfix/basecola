import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useSyncExternalStore, type FormEvent } from "react";
import { ArrowLeft } from "lucide-react";
import { AccountShell } from "@/components/account-shell";
import { SecuritySuccess } from "@/components/security-success";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { applyPassword, getSecuritySession, passwordChangeError, subscribeSecurity } from "@/lib/security-demo";

export const Route = createFileRoute("/change-password")({
  head: () => ({ meta: [
    { title: "Change Password — Basecola" }, { name: "description", content: "Update the password for this Basecola preview." },
    { property: "og:title", content: "Change Password — Basecola" }, { property: "og:description", content: "Set a demo password that stays on this device." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: ChangePasswordPage,
});

function ChangePasswordPage() {
  const session = useSyncExternalStore(subscribeSecurity, getSecuritySession, getSecuritySession);
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [passwordAgain, setPasswordAgain] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function save(event: FormEvent) {
    event.preventDefault();
    const problem = passwordChangeError(currentPassword, password, passwordAgain);
    if (problem) { setError(problem); return; }
    applyPassword(password);
    setCurrentPassword(""); setPassword(""); setPasswordAgain("");
    setError("");
    setSuccess(true);
  }

  return <AccountShell active="/profile" title="Change password">
    <Button asChild variant="link" className="mb-4 h-auto px-0"><Link to="/security"><ArrowLeft />Back to security</Link></Button>
    <form className="space-y-4 rounded-3xl bg-card p-5 shadow-soft" onSubmit={save}>
      <p className="text-sm text-muted-foreground">Choose a password with at least 8 characters. It is not sent anywhere.</p>
      {session.passwordSet && <div className="space-y-2"><Label htmlFor="current-password">Current password</Label><Input id="current-password" type="password" autoComplete="current-password" value={currentPassword} onChange={e => { setCurrentPassword(e.target.value); setError(""); }} /></div>}
      <div className="space-y-2"><Label htmlFor="new-password">New password</Label><Input id="new-password" type="password" autoComplete="new-password" value={password} onChange={e => { setPassword(e.target.value); setError(""); }} aria-invalid={!!error} aria-describedby={error ? "password-error" : undefined} /></div>
      <div className="space-y-2"><Label htmlFor="confirm-password">Confirm password</Label><Input id="confirm-password" type="password" autoComplete="new-password" value={passwordAgain} onChange={e => { setPasswordAgain(e.target.value); setError(""); }} /></div>
      {error && <p id="password-error" role="alert" className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="h-12 w-full">Update password</Button>
    </form>
    <SecuritySuccess open={success} title="Password updated" detail="Your preview password is saved on this device. It was not sent anywhere." onClose={() => setSuccess(false)} />
  </AccountShell>;
}
