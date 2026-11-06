import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminDashboard, AdminPanel, AdminShell, type AdminSection } from "@/components/admin-dashboard";
import { ADMIN_PERIODS, currentUserIsAdmin } from "@/lib/admin-demo";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [
    { title: "Admin Dashboard — Basecola" }, { name: "description", content: "Live Basecola platform metrics, users, transactions, and market prices." },
    { property: "og:title", content: "Admin Dashboard — Basecola" }, { property: "og:description", content: "Live Basecola platform metrics and activity." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: AdminPage,
});

function AdminPage() {
  const nav = useNavigate();
  const [ready, setReady] = useState(false);
  const [verificationFailed, setVerificationFailed] = useState(false);
  const [verificationAttempt, setVerificationAttempt] = useState(0);
  const [section, setSection] = useState<AdminSection>("dashboard");
  const [periodId, setPeriodId] = useState<(typeof ADMIN_PERIODS)[number]["id"]>("week");

  useEffect(() => {
    let active = true;
    setVerificationFailed(false);
    currentUserIsAdmin()
      .then(async ok => {
        if (!active) return;
        if (ok) setReady(true);
        else await nav({ to: "/admin-login", replace: true });
      })
      .catch(error => {
        console.error("[Admin dashboard] Could not verify admin access.", error);
        if (active) setVerificationFailed(true);
      });
    return () => { active = false; };
  }, [nav, verificationAttempt]);

  async function signOut() {
    await supabase.auth.signOut();
    nav({ to: "/admin-login", replace: true });
  }

  if (verificationFailed)
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold text-foreground">Couldn’t verify admin access</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Check your connection and try again.
          </p>
          <button
            type="button"
            onClick={() => setVerificationAttempt(attempt => attempt + 1)}
            className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Try again
          </button>
        </div>
      </div>
    );
  if (!ready) return null;

  return <AdminShell section={section} onSection={setSection} onSignOut={signOut} periodId={periodId} onPeriod={setPeriodId}>
    {section === "dashboard" ? <AdminDashboard onSection={setSection} periodId={periodId} /> : <AdminPanel section={section} />}
  </AdminShell>;
}
