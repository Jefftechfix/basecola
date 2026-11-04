import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ArrowLeft, Trash2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { AccountShell } from "@/components/account-shell";
import { SecuritySuccess } from "@/components/security-success";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteAccountError } from "@/lib/account-demo";
import { requestAccountDeletion } from "@/lib/admin.functions";

export const Route = createFileRoute("/delete-account")({
  head: () => ({ meta: [
    { title: "Request Account Deletion — Basecola" }, { name: "description", content: "Submit an account deletion request for review." },
    { property: "og:title", content: "Request Account Deletion — Basecola" }, { property: "og:description", content: "Submit an account deletion request for review." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: DeleteAccountPage,
});

function DeleteAccountPage() {
  const navigate = useNavigate();
  const submitDeletionRequest = useServerFn(requestAccountDeletion);
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const confirmed = deleteAccountError(confirmation) === "";

  async function removeAccount(event: FormEvent) {
    event.preventDefault();
    const problem = deleteAccountError(confirmation);
    if (problem) { setError(problem); return; }
    try {
      await submitDeletionRequest({ data: { confirmation } });
      setError("");
      setSuccess(true);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function finish() {
    navigate({ to: "/" });
  }

  return <AccountShell active="/profile" title="Delete account">
    <Button asChild variant="link" className="mb-4 h-auto px-0"><Link to="/profile"><ArrowLeft />Back to profile</Link></Button>
    <section className="rounded-3xl bg-pink-soft p-6 text-pink shadow-soft">
      <p className="flex items-center gap-2 text-sm font-semibold"><Trash2 className="h-4 w-4" />Delete account</p>
      <p className="mt-2 text-2xl font-extrabold">Request account deletion</p>
      <p className="mt-2 text-sm">Your request will be reviewed by our support team. Your account is not deleted immediately, and applicable financial records may need to be retained.</p>
    </section>
    <form className="mt-4 space-y-4 rounded-3xl bg-card p-5 shadow-soft" onSubmit={removeAccount}>
      <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
        <li>You can request a copy of your account data before deletion is completed.</li>
        <li>Pending transactions and custody balances must be reviewed before account closure.</li>
        <li>Some records may be retained where required by law.</li>
      </ul>
      <div className="space-y-2">
        <Label htmlFor="delete-confirm">Type DELETE to confirm</Label>
        <Input id="delete-confirm" autoComplete="off" value={confirmation} onChange={e => { setConfirmation(e.target.value); setError(""); }} placeholder="DELETE" aria-invalid={!!error} aria-describedby={error ? "delete-error" : undefined} />
      </div>
      {error && <p id="delete-error" role="alert" className="text-sm text-destructive">{error}</p>}
      <Button type="submit" variant="destructive" className="h-12 w-full" disabled={!confirmed}><Trash2 />Submit deletion request</Button>
    </form>
    <SecuritySuccess open={success} title="Request submitted" detail="An administrator will review your request. Your account remains available until the request is resolved." onClose={finish} />
  </AccountShell>;
}
