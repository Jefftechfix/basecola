import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bell, Eye, EyeOff, PlusCircle, Download, ArrowUp, ArrowRight, Bitcoin, RefreshCw, BarChart3, Home, Layers, History, User } from "lucide-react";
import { Logo, COINS, CoinIcon, Change } from "@/components/brand";
import coins from "@/assets/coins.png";

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
  const actions = [
    { i: Bitcoin, t: "Buy", d: "Buy crypto instantly", bg: "bg-accent", c: "text-primary" },
    { i: RefreshCw, t: "Sell", d: "Sell crypto to cash", bg: "bg-pink-soft", c: "text-pink" },
    { i: BarChart3, t: "Invest", d: "Grow your crypto", bg: "bg-green-soft", c: "text-success" },
  ];
  return (
    <div className="min-h-screen pb-28">
      <div className="mx-auto max-w-3xl px-5 pt-5">
        <div className="flex items-center justify-between"><Logo /><span className="relative"><Bell className="h-7 w-7" /><span className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full bg-destructive" /></span></div>
        <div className="mt-5 flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-accent font-bold text-primary">MS</span>
          <div><p className="text-xl font-bold">Hello, Mustapha 👋</p><p className="text-sm text-muted-foreground">Welcome to Basecola</p></div>
        </div>

        <div className="relative mt-5 overflow-hidden rounded-3xl bg-gradient-primary p-6 text-primary-foreground shadow-soft">
          <img src={coins} alt="" width={1024} height={768} className="absolute -right-4 -top-2 w-40 sm:w-56" />
          <p className="flex items-center gap-2 text-sm opacity-90">Total Crypto Balance <button onClick={() => setHide(!hide)} aria-label="Toggle balance">{hide ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></p>
          <p className="mt-1 text-4xl font-extrabold">{hide ? "••••••" : "$12,480.21"}</p>
          <p className="mt-1 font-semibold text-success">▲ +4.32% (24h)</p>
          <div className="relative mt-5 grid grid-cols-3 gap-2 text-sm font-semibold">
            <button className="flex items-center justify-center gap-1.5 rounded-2xl bg-card py-3 text-foreground"><PlusCircle className="h-4 w-4 text-primary" />Fund</button>
            <button className="flex items-center justify-center gap-1.5 rounded-2xl bg-primary-foreground/25 py-3"><Download className="h-4 w-4" />Receive</button>
            <button className="flex items-center justify-center gap-1.5 rounded-2xl bg-primary-foreground/25 py-3"><ArrowUp className="h-4 w-4" />Send</button>
          </div>
        </div>

        <Head t="Quick Actions" l="View All" />
        <div className="grid grid-cols-3 gap-3">
          {actions.map(({ i: I, t, d, bg, c }) => (
            <button key={t} className={`${bg} rounded-2xl p-3 text-left`}>
              <span className="flex items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-full bg-card"><I className={`h-5 w-5 ${c}`} /></span><b>{t}</b></span>
              <p className="mt-2 text-xs text-muted-foreground">{d}</p>
            </button>
          ))}
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

      <nav className="fixed inset-x-0 bottom-0 border-t bg-card">
        <div className="mx-auto flex max-w-3xl justify-around p-2 text-xs">
          {[[Home, "Home"], [Layers, "Assets"], [History, "Transactions"], [User, "Profile"]].map(([I, l]: any, i) => (
            <button key={l} className={`flex flex-col items-center gap-1 rounded-2xl px-5 py-2 ${i === 0 ? "bg-accent text-primary" : "text-muted-foreground"}`}><I className="h-6 w-6" />{l}</button>
          ))}
        </div>
      </nav>
    </div>
  );
}

function Head({ t, l }: { t: string; l: string }) {
  return <div className="mb-3 mt-7 flex items-center justify-between"><h2 className="text-xl font-extrabold">{t}</h2><span className="flex items-center gap-1 text-sm font-semibold text-primary">{l}<ArrowRight className="h-4 w-4" /></span></div>;
}
