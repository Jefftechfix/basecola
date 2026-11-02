import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { MailOpen, Mail, CheckCircle2, X } from "lucide-react";
import { AuthShell } from "@/components/brand";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/verify")({
  validateSearch: (s: Record<string, unknown>) => ({ email: typeof s["email"] === "string" ? (s["email"] as string) : "" }),
  head: () => ({
    meta: [
      { title: "Verify your email — Basecola" },
      { name: "description", content: "Enter the 6-digit code we sent to verify your Basecola account." },
      { property: "og:title", content: "Verify your email — Basecola" },
      { property: "og:description", content: "Verify your Basecola account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Verify,
});

function Verify() {
  const { email } = Route.useSearch();
  const nav = useNavigate();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [secs, setSecs] = useState(58);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function verify() {
    setBusy(true); setError("");
    const { error } = await supabase.auth.verifyOtp({ email, token: code.join(""), type: "signup" });
    setBusy(false);
    if (error) { setError(error.message); return; }
    setDone(true);
  }
  async function resend() {
    setError("");
    const { error } = await supabase.auth.resend({ type: "signup", email, options: { emailRedirectTo: window.location.origin } });
    if (error) { setError(error.message); return; }
    setSecs(58);
  }
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  useEffect(() => { if (secs <= 0) return; const t = setTimeout(() => setSecs(secs - 1), 1000); return () => clearTimeout(t); }, [secs]);

  const set = (i: number, v: string) => {
    const d = v.replace(/\D/g, "").slice(-1);
    const n = [...code]; n[i] = d; setCode(n);
    if (d && i < 5) refs.current[i + 1]?.focus();
  };

  return (
    <AuthShell>
      <div className="text-center">
        <MailOpen className="mx-auto h-24 w-24 text-primary" strokeWidth={1.3} />
        <h1 className="mt-4 text-3xl font-extrabold">Verify Your Email</h1>
        <p className="mt-2 text-muted-foreground">We've sent a 6-digit verification code to</p>
        <p className="font-bold text-primary">{email || "your email"}</p>
      </div>
      <div className="mt-8 flex justify-center gap-2">
        {code.map((c, i) => (
          <input key={i} ref={(el) => { refs.current[i] = el; }} value={c} inputMode="numeric" aria-label={`Digit ${i + 1}`}
            onChange={(e) => set(i, e.target.value)}
            onKeyDown={(e) => { if (e.key === "Backspace" && !c && i) refs.current[i - 1]?.focus(); }}
            className="h-14 w-12 rounded-xl border border-input bg-card text-center text-2xl font-bold outline-none focus:ring-2 focus:ring-ring" />
        ))}
      </div>
      <p className="mt-6 text-center text-sm">Didn't receive the code?{" "}
        <button disabled={secs > 0} onClick={resend} className="font-bold text-primary disabled:opacity-80">Resend Code{secs > 0 ? ` (${secs}s)` : ""}</button>
      </p>
      {error && <p role="alert" className="mt-4 text-center text-sm text-destructive">{error}</p>}
      <button disabled={code.join("").length < 6 || busy || !email} onClick={verify} className="mt-6 w-full rounded-2xl bg-primary py-4 text-lg font-bold text-primary-foreground disabled:opacity-60">{busy ? "Verifying…" : "Verify Email"}</button>
      <div className="mt-6 flex items-center gap-3 rounded-2xl bg-accent p-4 text-sm"><Mail className="h-5 w-5 text-primary" />Check your inbox (and spam folder) for the verification code.</div>

      {done && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-navy/50 p-6 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-3xl bg-card p-6 text-center shadow-phone">
            <button onClick={() => setDone(false)} aria-label="Close" className="absolute right-4 top-4 rounded-full bg-muted p-1"><X className="h-4 w-4" /></button>
            <CheckCircle2 className="mx-auto h-20 w-20 text-success" />
            <h2 className="mt-3 text-2xl font-extrabold">Email Verified Successfully!</h2>
            <p className="mt-2 text-muted-foreground">Your email has been verified. Create a 4-digit PIN to continue.</p>
            <button onClick={() => nav({ to: "/wallet" })} className="mt-6 w-full rounded-2xl bg-primary py-4 font-bold text-primary-foreground">Continue</button>
          </div>
        </div>
      )}
    </AuthShell>
  );
}
