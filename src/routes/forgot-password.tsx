import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Mail } from "lucide-react";
import { AuthShell } from "@/components/brand";
import { loginError } from "@/lib/login-demo";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [
    { title: "Forgot Password — Basecola" }, { name: "description", content: "Start a Basecola preview password reset." },
    { property: "og:title", content: "Forgot Password — Basecola" }, { property: "og:description", content: "Enter an email to continue the demo password reset." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: ForgotPasswordPage,
});

const field = "flex items-center gap-3 rounded-xl border border-input bg-card px-4 py-3 focus-within:ring-2 focus-within:ring-ring";
const input = "w-full bg-transparent outline-none placeholder:text-muted-foreground";

function ForgotPasswordPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    if (loginError(email, "preview")) { setError("Enter a valid email address."); return; }
    nav({ to: "/reset-password", search: { email: email.trim() } });
  }

  return <AuthShell>
    <div className="mx-auto mb-6 grid h-24 w-24 place-items-center rounded-[1.75rem] bg-gradient-primary text-primary-foreground shadow-soft"><Mail className="h-12 w-12" /></div>
    <h1 className="text-center text-3xl font-extrabold">Forgot Password?</h1>
    <p className="mt-2 text-center text-muted-foreground">No worries. Enter your email address and continue to choose a new password.</p>
    <form className="mt-6 space-y-4" onSubmit={submit}>
      <div className={field}><Mail className="h-5 w-5 text-muted-foreground" /><input required type="email" autoComplete="email" value={email} onChange={e => { setEmail(e.target.value); setError(""); }} className={input} placeholder="Email Address" aria-label="Email Address" aria-invalid={!!error} /></div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <button className="w-full rounded-2xl bg-primary py-4 text-lg font-bold text-primary-foreground shadow-soft">Send Reset Link</button>
    </form>
    <p className="mt-4 text-center text-xs text-muted-foreground">This preview opens the reset screen next. No email is sent.</p>
  </AuthShell>;
}
