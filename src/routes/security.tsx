import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, ChevronRight, KeyRound, Lock, ShieldCheck } from "lucide-react";
import { AccountShell } from "@/components/account-shell";
import { Button } from "@/components/ui/button";
import { getSecuritySession, subscribeSecurity } from "@/lib/security-demo";

export const Route = createFileRoute("/security")({
  head: () => ({ meta: [
    { title: "Security — Basecola" }, { name: "description", content: "Change your Basecola demo PIN, password, and two-factor authentication." },
    { property: "og:title", content: "Security — Basecola" }, { property: "og:description", content: "Preview security settings for the Basecola demo." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: SecurityPage,
});

function SecurityPage() {
  const session = useSyncExternalStore(subscribeSecurity, getSecuritySession, getSecuritySession);
  const [twoFactor, setTwoFactor] = useState<boolean | null>(null);
  useEffect(() => { void supabase.auth.mfa.listFactors().then(({ data }) => setTwoFactor(!!data?.totp.some(f => f.status === "verified"))); }, []);
  const items = [
    { to: "/change-pin", icon: KeyRound, title: "Change PIN", detail: "Set a 4-digit preview PIN", status: session.pinSet ? "Saved" : "Not set" },
    { to: "/change-password", icon: Lock, title: "Change password", detail: "Update the preview password", status: session.passwordSet ? "Saved" : "Not set" },
    { to: "/two-factor", icon: ShieldCheck, title: "Two-factor authentication", detail: "Authenticator app code at sign-in", status: twoFactor === null ? "…" : twoFactor ? "On" : "Off" },
  ] as const;

  return <AccountShell active="/profile" title="Security">
    <Button asChild variant="link" className="mb-4 h-auto px-0"><Link to="/profile"><ArrowLeft />Back to profile</Link></Button>
    <section className="rounded-3xl bg-gradient-primary p-6 text-primary-foreground shadow-soft">
      <p className="text-sm text-primary-foreground/80">Security</p>
      <p className="mt-2 text-2xl font-extrabold">Protect this preview</p>
      <p className="mt-2 text-sm text-primary-foreground/90">PIN, password, and two-factor settings stay on this device. They do not protect a live account.</p>
    </section>
    <div className="mt-4 space-y-3">
      {items.map(item => <Link key={item.to} to={item.to} className="flex w-full items-center gap-3 rounded-2xl bg-card px-3 py-3 text-left shadow-soft">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent text-primary"><item.icon className="h-5 w-5" /></span>
        <span className="min-w-0 flex-1"><span className="block font-bold">{item.title}</span><span className="block text-xs text-muted-foreground">{item.detail}</span></span>
        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${item.status === "Off" || item.status === "Not set" ? "bg-muted text-muted-foreground" : "bg-green-soft text-success"}`}>{item.status}</span>
        <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
      </Link>)}
    </div>
  </AccountShell>;
}
