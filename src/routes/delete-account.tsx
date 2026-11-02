import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ArrowLeft, Trash2 } from "lucide-react";
import { AccountShell } from "@/components/account-shell";
import { SecuritySuccess } from "@/components/security-success";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteAccountError } from "@/lib/account-demo";
import { resetSecuritySession } from "@/lib/security-demo";

export const Route = createFileRoute("/delete-account")({
  head: () => ({ meta: [
    { title: "Delete Account — Basecola" }, { name: "description", content: "Close this Basecola preview account. No live account is removed." },
    { property: "og:title", content: "Delete Account — Basecola" }, { property: "og:description", content: "Close the Basecola demo account for this visit." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: DeleteAccountPage,
});

function DeleteAccountPage() {
  const navigate = useNavigate();
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const confirmed = deleteAccountError(confirmation) === "";

  function removeAccount(event: FormEvent) {
    event.preventDefault();
    const problem = deleteAccountError(confirmation);
    if (problem) { setError(problem); return; }
    resetSecuritySession();
    setError("");
    setSuccess(true);
  }

  function finish() {
    navigate({ to: "/" });
  }

  return <AccountShell active="/profile" title="Delete account">
    <Button asChild variant="link" className="mb-4 h-auto px-0"><Link to="/profile"><ArrowLeft />Back to profile</Link></Button>
    <section className="rounded-3xl bg-pink-soft p-6 text-pink shadow-soft">
      <p className="flex items-center gap-2 text-sm font-semibold"><Trash2 className="h-4 w-4" />Delete account</p>
      <p className="mt-2 text-2xl font-extrabold">Close this preview</p>
      <p className="mt-2 text-sm">This closes the demo account for this visit. No live account, money, or cryptocurrency is removed.</p>
    </section>
    <form className="mt-4 space-y-4 rounded-3xl bg-card p-5 shadow-soft" onSubmit={removeAccount}>
      <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
        <li>Profile details from this visit are cleared.</li>
        <li>The preview PIN, password, and two-factor setting are cleared.</li>
        <li>Sample balances are not a wallet and are not paid out.</li>
      </ul>
      <div className="space-y-2">
        <Label htmlFor="delete-confirm">Type DELETE to confirm</Label>
        <Input id="delete-confirm" autoComplete="off" value={confirmation} onChange={e => { setConfirmation(e.target.value); setError(""); }} placeholder="DELETE" aria-invalid={!!error} aria-describedby={error ? "delete-error" : undefined} />
      </div>
      {error && <p id="delete-error" role="alert" className="text-sm text-destructive">{error}</p>}
      <Button type="submit" variant="destructive" className="h-12 w-full" disabled={!confirmed}><Trash2 />Delete account</Button>
    </form>
    <SecuritySuccess open={success} title="Account deleted" detail="This preview account is closed. No live account was removed." onClose={finish} />
  </AccountShell>;
}
