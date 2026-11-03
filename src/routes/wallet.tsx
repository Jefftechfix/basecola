import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Lock } from "lucide-react";
import { AuthShell } from "@/components/brand";
import { applyPin, signupPinError } from "@/lib/security-demo";

export const Route = createFileRoute("/wallet")({
  head: () => ({
    meta: [
      { title: "Create your PIN — Basecola" },
      { name: "description", content: "Choose and confirm a 4-digit PIN for this Basecola preview." },
      { property: "og:title", content: "Create your PIN — Basecola" },
      { property: "og:description", content: "The preview PIN stays on this device." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CreatePinPage,
});

function digits(value: string) {
  return value.replace(/\D/g, "").slice(0, 4);
}

function CreatePinPage() {
  const nav = useNavigate();
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  const [busy, setBusy] = useState(false);

  async function save(event: FormEvent) {
    event.preventDefault();
    const problem = signupPinError(pin, confirm);
    if (problem) { setError(problem); return; }
    setBusy(true);
    const { error: rpcError } = await supabase.rpc("set_login_pin", { _pin: pin });
    setBusy(false);
    if (rpcError) { setError(rpcError.message === "Not signed in" ? "Please log in first to create your PIN." : rpcError.message); return; }
    applyPin(pin);
    setPin("");
    setConfirm("");
    nav({ to: "/dashboard" });
  }

  return (
    <AuthShell>
      <h1 className="text-center text-3xl font-extrabold">Create Your PIN</h1>
      <p className="mt-2 text-center text-muted-foreground">Choose a 4-digit PIN and enter it again. You'll use it every time you log in.</p>
      <form className="mt-6 space-y-4" onSubmit={save}>
        <label className="block">
          <span className="mb-1.5 block font-bold">Create PIN</span>
          <span className="flex items-center gap-3 rounded-xl border border-input bg-card px-4 py-3 focus-within:ring-2 focus-within:ring-ring">
            <Lock className="h-5 w-5 shrink-0 text-muted-foreground" />
            <input id="create-pin" inputMode="numeric" autoComplete="off" maxLength={4} value={pin} onChange={event => { setPin(digits(event.target.value)); setError(""); }} placeholder="4-digit PIN" aria-invalid={!!error} aria-describedby={error ? "pin-error" : undefined} className="w-full bg-transparent tracking-[0.4em] outline-none placeholder:tracking-normal placeholder:text-muted-foreground" />
          </span>
        </label>
        <label className="block">
          <span className="mb-1.5 block font-bold">Confirm PIN</span>
          <span className="flex items-center gap-3 rounded-xl border border-input bg-card px-4 py-3 focus-within:ring-2 focus-within:ring-ring">
            <Lock className="h-5 w-5 shrink-0 text-muted-foreground" />
            <input id="confirm-pin" inputMode="numeric" autoComplete="off" maxLength={4} value={confirm} onChange={event => { setConfirm(digits(event.target.value)); setError(""); }} placeholder="Repeat the PIN" className="w-full bg-transparent tracking-[0.4em] outline-none placeholder:tracking-normal placeholder:text-muted-foreground" />
          </span>
        </label>
        {error && <p id="pin-error" role="alert" className="text-sm text-destructive">{error}</p>}
        <button type="submit" className="w-full rounded-2xl bg-primary py-4 text-lg font-bold text-primary-foreground">Continue</button>
      </form>
    </AuthShell>
  );
}
