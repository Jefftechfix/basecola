import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Eye, EyeOff, PlusCircle, Download, ArrowUp, ArrowRight, Bitcoin, RefreshCw, BarChart3 } from "lucide-react";
import { Logo, COINS, CoinIcon, Change } from "@/components/brand";
import { NotificationBell } from "@/components/notification-bell";
import coins from "@/assets/coins.png";
import { AccountNav } from "@/components/account-shell";
import { Button } from "@/components/ui/button";
import { accountFirstName, accountInitials, loadAccountProfile } from "@/lib/account-profile";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Basecola" },
      { name: "description", content: "Your Basecola balance, quick actions, and live market overview." },
      { property: "og:title", content: "Dashboard — Basecola" },
      { property: "og:description", content: "Your Basecola crypto dashboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

function Spark({ up, seed }: { up: boolean; seed: number }) {
  const pts = Array.from({ length: 12 }, (_, i) => {
    const y = 20 + Math.sin(i * 1.3 + seed) * 6 + (up ? -i * 1.4 : i * 0.6);
    return `${i * 8},${y}`;
  }).join(" ");
  return <svg viewBox="0 0 88 40" className={`h-8 w-24 ${up ? "text-success" : "text-destructive"}`}><polyline points={pts} fill="none" stroke="currentColor" strokeWidth="2" /></svg>;
}

function Dashboard() {
  const [hide, setHide] = useState(false);
  const { data: profile, isPending } = useQuery({ queryKey: ["account-profile"], queryFn: loadAccountProfile });
  const greeting = profile ? accountFirstName(profile) : "";
  const initials = profile ? accountInitials(profile) : "BC";
  const actions = [
    { i: Bitcoin, t: "Buy", d: "Buy crypto instantly", bg: "bg-accent", c: "text-primary", to: "/buy" },
    { i: RefreshCw, t: "Sell", d: "Sell crypto to cash", bg: "bg-pink-soft", c: "text-pink", to: "/sell" },
    { i: BarChart3, t: "Invest", d: "Grow your crypto", bg: "bg-green-soft", c: "text-success" },
  ] as const;
  return (
    <div className="min-h-screen pb-28">
      <div className="mx-auto max-w-3xl px-5 pt-5">
        <div className="flex items-center justify-between"><Logo /><NotificationBell /></div>
        <div className="mt-5 flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-accent font-bold text-primary">{initials}</span>
          <div>
            <p className="text-xl font-bold">{isPending ? "Hello" : profile ? `Hello, ${greeting}` : "Hello"}</p>
            <p className="text-sm text-muted-foreground">{profile?.email || (isPending ? "Loading your account" : <Link to="/login" className="font-semibold text-primary">Log in</Link>)}</p>
          </div>
        </div>

        <div className="relative mt-5 overflow-hidden rounded-3xl bg-gradient-primary p-6 text-primary-foreground shadow-soft">
          <img src={coins} alt="" width={1024} height={768} className="absolute -right-6 -top-6 w-28 opacity-90 sm:w-48" />
          <p className="flex items-center gap-2 text-sm opacity-90">Sample balance <button onClick={() => setHide(!hide)} aria-label="Toggle balance">{hide ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></p>
          <p className="mt-1 text-4xl font-extrabold">{hide ? "••••••" : "$12,480.21"}</p>
          <p className="mt-1 font-semibold text-success">▲ +4.32% (24h)</p>
          <div className="relative mt-5 grid grid-cols-3 gap-2 text-sm font-semibold">
            <Button asChild variant="secondary" className="h-12 gap-1.5 rounded-lg bg-card px-2 text-foreground"><Link to="/fund-wallet"><PlusCircle className="text-primary" />Fund</Link></Button>
            <Button asChild variant="ghost" className="h-12 gap-1.5 rounded-lg bg-primary-foreground/25 px-2 text-primary-foreground hover:bg-primary-foreground/35 hover:text-primary-foreground"><Link to="/receive"><Download />Receive</Link></Button>
            <Button asChild variant="ghost" className="h-12 gap-1.5 rounded-lg bg-primary-foreground/25 px-2 text-primary-foreground hover:bg-primary-foreground/35 hover:text-primary-foreground"><Link to="/send"><ArrowUp />Send</Link></Button>
          </div>
        </div>

        <Head t="Quick Actions" l="View All" />
        <div className="grid grid-cols-3 gap-3">
          {actions.map(action => {
            const body = <><span className="flex items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-full bg-card"><action.i className={`h-5 w-5 ${action.c}`} /></span><b>{action.t}</b></span><p className="mt-2 text-xs text-muted-foreground">{action.d}</p></>;
            return "to" in action ? <Link key={action.t} to={action.to} className={`${action.bg} rounded-2xl p-3 text-left`}>{body}</Link> : <button key={action.t} className={`${action.bg} rounded-2xl p-3 text-left`}>{body}</button>;
          })}
        </div>

        <Head t="Market" l="See All" />
        <div className="divide-y rounded-2xl border bg-card px-4">
          {COINS.map((c, i) => (
            <div key={c.sym} className="flex items-center gap-3 py-3">
              <CoinIcon coin={c} size="h-11 w-11 text-lg" />
              <div className="w-20"><p className="font-bold">{c.name}</p><p className="text-sm text-muted-foreground">{c.sym}</p></div>
              <div className="flex flex-1 justify-center"><Spark up={c.change > 0} seed={i} /></div>
              <div className="text-right"><p className="font-bold">{c.price}</p><p className="text-sm"><Change v={c.change} /></p></div>
            </div>
          ))}
        </div>
      </div>

      <AccountNav active="/dashboard" />
    </div>
  );
}

function Head({ t, l }: { t: string; l: string }) {
  return <div className="mb-3 mt-7 flex items-center justify-between"><h2 className="text-xl font-extrabold">{t}</h2><span className="flex items-center gap-1 text-sm font-semibold text-primary">{l}<ArrowRight className="h-4 w-4" /></span></div>;
}
