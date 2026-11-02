import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminDashboard, AdminPanel, AdminShell, type AdminSection } from "@/components/admin-dashboard";
import { ADMIN_PERIODS, clearAdminSession, readAdminSession } from "@/lib/admin-demo";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [
    { title: "Admin Dashboard — Basecola" }, { name: "description", content: "Preview the Basecola admin dashboard with sample users, volume, and activity." },
    { property: "og:title", content: "Admin Dashboard — Basecola" }, { property: "og:description", content: "Sample admin dashboard. No customer funds are moved." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: AdminPage,
});

function AdminPage() {
  const nav = useNavigate();
  const [ready, setReady] = useState(false);
  const [section, setSection] = useState<AdminSection>("dashboard");
  const [periodId, setPeriodId] = useState<(typeof ADMIN_PERIODS)[number]["id"]>("week");

  useEffect(() => {
    if (!readAdminSession()) nav({ to: "/admin-login" });
    else setReady(true);
  }, [nav]);

  function signOut() {
    clearAdminSession();
    nav({ to: "/admin-login" });
  }

  if (!ready) return null;

  return <AdminShell section={section} onSection={setSection} onSignOut={signOut} periodId={periodId} onPeriod={setPeriodId}>
    {section === "dashboard" ? <AdminDashboard onSection={setSection} periodId={periodId} /> : <AdminPanel section={section} />}
  </AdminShell>;
}
