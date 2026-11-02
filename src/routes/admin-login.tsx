import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Eye, EyeOff, Lock, Mail, ShieldCheck } from "lucide-react";
import { AuthShell } from "@/components/brand";
import { ADMIN_DEMO_EMAIL, ADMIN_DEMO_PASSWORD, adminLoginError, writeAdminSession } from "@/lib/admin-demo";

export const Route = createFileRoute("/admin-login")({
  head: () => ({ meta: [
    { title: "Admin Login — Basecola" }, { name: "description", content: "Sign in to the Basecola demo admin preview." },
    { property: "og:title", content: "Admin Login — Basecola" }, { property: "og:description", content: "Preview the Basecola admin sign-in. No account is accessed." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: AdminLoginPage,
});

const field = "flex items-center gap-3 rounded-xl border border-input bg-card px-4 py-3 focus-within:ring-2 focus-within:ring-ring";
const input = "w-full bg-transparent outline-none placeholder:text-muted-foreground";

function AdminLoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    const problem = adminLoginError(email, password);
    if (problem) { setError(problem); return; }
    writeAdminSession();
    nav({ to: "/admin" });
  }

  return <AuthShell>
    <div className="relative mx-auto mb-6 h-24 w-24">
      <div className="grid h-24 w-24 place-items-center rounded-[1.75rem] bg-gradient-primary text-primary-foreground shadow-soft"><ShieldCheck className="h-12 w-12" /></div>
      <span className="absolute -bottom-1 -right-1 grid h-9 w-9 place-items-center rounded-full bg-card text-primary shadow-soft"><Lock className="h-5 w-5" /></span>
    </div>
    <h1 className="text-center text-3xl font-extrabold">Admin Login</h1>
    <p className="mt-2 text-center text-muted-foreground">Sign in to the Basecola demo admin</p>
    <p className="mt-4 rounded-xl bg-muted px-3 py-2 text-center text-xs leading-relaxed text-muted-foreground">Demo sign-in: <span className="font-semibold text-foreground">{ADMIN_DEMO_EMAIL}</span> / <span className="font-semibold text-foreground">{ADMIN_DEMO_PASSWORD}</span></p>
    <form className="mt-6 space-y-4" onSubmit={submit}>
      <div className={field}><Mail className="h-5 w-5 text-muted-foreground" /><input required type="email" autoComplete="username" value={email} onChange={event => { setEmail(event.target.value); setError(""); }} className={input} placeholder="Admin email" aria-label="Admin email" aria-invalid={!!error} aria-describedby={error ? "admin-login-error" : undefined} /></div>
      <div className={field}><Lock className="h-5 w-5 text-muted-foreground" /><input required type={show ? "text" : "password"} autoComplete="current-password" value={password} onChange={event => { setPassword(event.target.value); setError(""); }} className={input} placeholder="Password" aria-label="Password" /><button type="button" onClick={() => setShow(value => !value)} aria-label={show ? "Hide password" : "Show password"} className="text-muted-foreground">{show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button></div>
      {error && <p id="admin-login-error" role="alert" className="text-sm text-destructive">{error}</p>}
      <button className="w-full rounded-2xl bg-primary py-4 text-lg font-bold text-primary-foreground shadow-soft">Log in</button>
    </form>
    <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground">This sign-in stays in the browser. It does not open a live admin account.</p>
    <p className="mt-6 text-center text-sm"><Link to="/login" className="font-bold text-primary">Customer login</Link></p>
  </AuthShell>;
}
