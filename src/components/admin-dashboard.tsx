import { LiveAccountDeletionManagement, LiveAssetsWalletManagement, LiveDepositsMonitoring, LiveReferralManagement, LiveTradeManagement, LiveTransactionsManagement, LiveTreasuryManagement, LiveUsersManagement, LiveVerificationManagement } from "@/components/admin-live";
import { useState, type FormEvent, type ReactNode } from "react";
import { ArrowDownToLine, BadgeCheck, BarChart3, Bell, Calendar, ChevronDown, CircleDollarSign, Home, Info, Landmark, Menu, RefreshCw, Settings, SlidersHorizontal, Ticket, Trash2, UserPlus, Users, Wallet, X, type LucideIcon } from "lucide-react";
import { COINS, CoinIcon } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ReportsManagement, SettingsManagement, UsersManagement } from "@/components/admin-management";
import { VerificationManagement } from "@/components/admin-verifications";
import { ADMIN_ACTIVITY, ADMIN_MARKET, ADMIN_NOTICES, ADMIN_PERIODS, ADMIN_QUICK_ACTIONS, ADMIN_STATS, ADMIN_USERS, adminCount, adminMoney } from "@/lib/admin-demo";

export type AdminSection = "dashboard" | "users" | "verifications" | "deletions" | "transactions" | "deposits" | "assets" | "trade" | "earn" | "pricing" | "treasury" | "reports" | "referrals" | "settings";

const NAV: { id: AdminSection; label: string; icon: typeof Home }[] = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "users", label: "Users", icon: Users },
  { id: "verifications", label: "Verification Management", icon: BadgeCheck },
  { id: "deletions", label: "Deletion Requests", icon: Trash2 },
  { id: "transactions", label: "Transactions", icon: RefreshCw },
  { id: "deposits", label: "Deposits Monitoring", icon: ArrowDownToLine },
  { id: "assets", label: "Assets / Wallets", icon: Wallet },
  { id: "trade", label: "Buy & Sell (OTC)", icon: CircleDollarSign },
  { id: "earn", label: "Invest / Earn", icon: BarChart3 },
  { id: "pricing", label: "Pricing & Rates", icon: SlidersHorizontal },
  { id: "treasury", label: "Treasury", icon: Landmark },
  { id: "reports", label: "Reports & Analytics", icon: BarChart3 },
  { id: "referrals", label: "Referral Management", icon: UserPlus },
  { id: "settings", label: "Settings", icon: Settings },
];

const ACTION_COPY: Record<string, { title: string; detail: string; fields: string[] }> = {
  "add-user": { title: "Add User", detail: "This adds a name only inside the preview.", fields: ["Name", "Email"] },
  "fund-wallet": { title: "Fund Wallet", detail: "This sample does not credit a customer wallet.", fields: ["Username", "Amount (USD)"] },
  "adjust-rates": { title: "Adjust Rates", detail: "This sample does not change customer prices.", fields: ["Asset", "Rate"] },
  "create-promo": { title: "Create Promo", detail: "This sample code is not issued to customers.", fields: ["Promo code", "Reward (USD)"] },
};

export function AdminShell({ section, onSection, onSignOut, periodId, onPeriod, children }: { section: AdminSection; onSection: (section: AdminSection) => void; onSignOut: () => void; periodId: (typeof ADMIN_PERIODS)[number]["id"]; onPeriod: (id: (typeof ADMIN_PERIODS)[number]["id"]) => void; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(section === "settings");

  function choose(next: AdminSection) {
    onSection(next);
    setOpen(false);
    if (next === "settings") setSettingsOpen(true);
  }

  const nav = <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4" aria-label="Admin">
    {NAV.map(item => {
      const active = section === item.id;
      const Icon = item.icon;
      if (item.id === "settings") return <div key={item.id}>
        <button type="button" className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${active ? "bg-[#6d4dff] text-white" : "text-white/75 hover:bg-white/10"}`} aria-expanded={settingsOpen} aria-current={active ? "page" : undefined} onClick={() => choose("settings")}><Icon className="h-4 w-4" />{item.label}<ChevronDown className={`ml-auto h-4 w-4 transition ${settingsOpen ? "rotate-180" : ""}`} /></button>
        {settingsOpen && <div className="ml-8 mt-1 space-y-1">
          <button type="button" className="block w-full rounded-lg px-3 py-2 text-left text-sm text-white/75 hover:bg-white/10" onClick={() => choose("settings")}>Preferences</button>
          <button type="button" className="block w-full rounded-lg px-3 py-2 text-left text-sm text-white/75 hover:bg-white/10" onClick={onSignOut}>Sign out</button>
        </div>}
      </div>;
      return <button key={item.id} type="button" aria-current={active ? "page" : undefined} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium ${active ? "bg-[#6d4dff] text-white" : "text-white/75 hover:bg-white/10"}`} onClick={() => choose(item.id)}><Icon className="h-4 w-4" />{item.label}</button>;
    })}
  </nav>;

  return <div className="min-h-screen bg-[#f4f5fb] lg:grid lg:grid-cols-[260px_1fr]">
    <aside className="hidden min-h-screen flex-col bg-[#1b1240] text-white lg:flex">
      <div className="flex items-center gap-3 px-5 py-6"><img src="/logo.png" alt="Basecola" className="h-14 w-auto rounded-lg bg-white" /><p className="text-xs text-white/60">Admin Dashboard</p></div>
      {nav}
      <button type="button" className="m-4 flex items-center gap-3 rounded-2xl bg-white/10 px-3 py-3 text-left" onClick={onSignOut}><span className="relative grid h-9 w-9 place-items-center rounded-full bg-[#6d4dff] text-sm font-bold">B<span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#1b1240] bg-emerald-400" /></span><span className="min-w-0"><span className="block text-sm font-semibold">Basecola Admin</span><span className="block truncate text-xs text-white/60">admin@basecola.com</span></span></button>
    </aside>
    {open && <div className="fixed inset-0 z-40 lg:hidden"><button type="button" aria-label="Close menu" className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} /><aside className="relative flex h-full w-72 flex-col bg-[#1b1240] text-white"><div className="flex items-center justify-between px-5 py-5"><img src="/logo.png" alt="Basecola" className="h-12 w-auto rounded-lg bg-white" /><button type="button" aria-label="Close menu" onClick={() => setOpen(false)}><X /></button></div>{nav}</aside></div>}
    <div className="min-w-0">
      <header className="flex flex-wrap items-center gap-3 border-b bg-white/80 px-4 py-4 sm:px-6">
        <button type="button" className="grid h-10 w-10 place-items-center rounded-xl border lg:hidden" aria-label="Open admin menu" onClick={() => setOpen(true)}><Menu className="h-5 w-5" /></button>
        <div className="mr-auto"><h1 className="text-2xl font-extrabold">{section === "users" ? "Users Management" : section === "transactions" ? "Transactions Management" : section === "assets" ? "Assets / Wallet Management" : section === "trade" ? "Buy & Sell Management" : section === "pricing" ? "Pricing & Rate Management" : section === "treasury" ? "Treasury Management" : section === "reports" ? "Reports & Analytics" : section === "referrals" ? "Referral Management" : section === "settings" ? "Settings Management" : NAV.find(item => item.id === section)?.label}</h1><p className="text-sm text-muted-foreground">{section === "users" ? "View, manage, and monitor all platform users" : section === "transactions" ? "Monitor, search, and manage all platform transactions" : section === "assets" ? "Configure supported networks, view customer wallet addresses, and request treasury operations" : section === "trade" ? "Review settled trades and configure enforced customer rates and limits" : section === "pricing" ? "Configure persisted buy/sell prices, trading availability, and order limits" : section === "treasury" ? "Review trusted balance observations and manage unexecuted operation requests" : section === "reports" ? "Insights, performance, and detailed reports across the platform" : section === "referrals" ? "Manage referrals, commissions, rewards, and promo programs" : section === "deposits" ? "Monitor, verify, and manage all user crypto deposits in real time" : section === "deletions" ? "Review account closure requests and download member data" : section === "verifications" ? "Review and manage user identity verification submissions." : section === "settings" ? "Configure platform policies, support, communications, security, and system features" : "Welcome back, Admin 👋"}</p></div>
        {(section === "dashboard" || section === "transactions" || section === "assets" || section === "trade" || section === "pricing" || section === "treasury" || section === "reports" || section === "referrals" || section === "deposits" || section === "settings") && <label className="flex h-10 items-center gap-2 rounded-xl border bg-white px-3 text-sm"><Calendar className="h-4 w-4 text-muted-foreground" /><span className="sr-only">Reporting dates</span><select aria-label="Reporting dates" value={periodId} onChange={event => onPeriod(event.target.value as (typeof ADMIN_PERIODS)[number]["id"])} className="bg-transparent outline-none">{ADMIN_PERIODS.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>}
        <Popover>
          <PopoverTrigger asChild><Button variant="ghost" size="icon" className="rounded-full bg-white" aria-label="Admin notifications"><Bell /></Button></PopoverTrigger>
          <PopoverContent align="end" className="w-72 p-0">
            <p className="border-b px-4 py-3 text-sm font-bold">Notifications</p>
            <ul>{ADMIN_NOTICES.map(item => <li key={item.id} className="border-b px-4 py-3 text-sm last:border-0"><p className="font-semibold">{item.title}</p><p className="text-xs text-muted-foreground">{item.detail}</p></li>)}</ul>
          </PopoverContent>
        </Popover>
        <DropdownMenu>
          <DropdownMenuTrigger asChild><button type="button" className="flex items-center gap-2 rounded-full bg-white py-1 pl-1 pr-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-[#6d4dff] text-sm font-bold text-white">B</span><span className="text-left text-sm leading-tight"><span className="block font-bold">Admin</span><span className="text-xs text-muted-foreground">Super Admin</span></span><ChevronDown className="h-4 w-4 text-muted-foreground" /></button></DropdownMenuTrigger>
          <DropdownMenuContent align="end"><DropdownMenuItem onClick={onSignOut}>Sign out</DropdownMenuItem></DropdownMenuContent>
        </DropdownMenu>
      </header>
      <div className="px-4 py-5 sm:px-6">{children}</div>
    </div>
  </div>;
}

const QUICK_ICONS: Record<(typeof ADMIN_QUICK_ACTIONS)[number]["id"], LucideIcon> = {
  "add-user": UserPlus,
  "fund-wallet": Wallet,
  "adjust-rates": SlidersHorizontal,
  "create-promo": Ticket,
  "view-reports": BarChart3,
  settings: Settings,
};

export function AdminDashboard({ onSection, periodId }: { onSection: (section: AdminSection) => void; periodId: (typeof ADMIN_PERIODS)[number]["id"] }) {
  const [metric, setMetric] = useState<"volume" | "transactions">("volume");
  const [action, setAction] = useState<string | null>(null);
  const [saved, setSaved] = useState("");
  const period = ADMIN_PERIODS.find(item => item.id === periodId) ?? ADMIN_PERIODS[0];
  const prompt = action ? ACTION_COPY[action] : null;

  function runAction(id: string) {
    if (id === "view-reports") onSection("reports");
    else if (id === "settings") onSection("settings");
    else { setSaved(""); setAction(id); }
  }

  function submitAction(event: FormEvent) {
    event.preventDefault();
    setSaved("Saved in this preview only. Customer wallets and prices are unchanged.");
  }

  return <>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {ADMIN_STATS.map(stat => <StatCard key={stat.id} label={stat.label} value={stat.kind === "money" ? adminMoney(stat.value) : adminCount(stat.value)} change={stat.change} tone={stat.id} />)}
    </div>
    <div className="mt-4 grid gap-4 xl:grid-cols-4">
      <section className="rounded-3xl bg-white p-5 shadow-sm xl:col-span-2">
        <div className="flex flex-wrap items-center gap-3"><h2 className="flex items-center gap-2 font-bold">Transaction Volume <Info className="h-4 w-4 text-muted-foreground" aria-label="Sample volume for the selected dates" /></h2>
          <div className="ml-auto flex rounded-full bg-[#f4f5fb] p-1 text-sm">
            <button type="button" className={`rounded-full px-3 py-1 font-semibold ${metric === "volume" ? "bg-[#6d4dff] text-white" : "text-muted-foreground"}`} aria-pressed={metric === "volume"} onClick={() => setMetric("volume")}>Volume</button>
            <button type="button" className={`rounded-full px-3 py-1 font-semibold ${metric === "transactions" ? "bg-[#6d4dff] text-white" : "text-muted-foreground"}`} aria-pressed={metric === "transactions"} onClick={() => setMetric("transactions")}>Transactions</button>
          </div>
        </div>
        <p className="mt-4 text-3xl font-extrabold">{metric === "volume" ? adminMoney(period.volume) : adminCount(period.transactions)}</p>
        <p className="mt-1 text-sm font-semibold text-emerald-600">↑ +{(metric === "volume" ? period.volumeChange : period.transactionChange).toFixed(1)}% <span className="font-medium text-muted-foreground">vs last 7 days</span></p>
        <VolumeChart points={period.points} metric={metric} />
      </section>
      <section className="rounded-3xl bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 font-bold"><Users className="h-4 w-4 text-[#6d4dff]" />Users Overview</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <Row label="Total Users" value={adminCount(ADMIN_USERS.total)} />
          <Row label="Verified Users" value={adminCount(ADMIN_USERS.verified)} mark="text-emerald-600" />
          <Row label="Unverified Users" value={adminCount(ADMIN_USERS.unverified)} mark="text-amber-500" />
          <Row label="Active (30 days)" value={adminCount(ADMIN_USERS.active)} mark="text-emerald-600" />
          <Row label="New Users (Today)" value={adminCount(ADMIN_USERS.joinedToday)} mark="text-[#6d4dff]" />
        </dl>
        <Button type="button" variant="outline" className="mt-5 h-11 w-full rounded-xl border-[#6d4dff] text-[#6d4dff]" onClick={() => onSection("users")}>View All Users</Button>
      </section>
      <section className="rounded-3xl bg-white p-5 shadow-sm">
        <h2 className="font-bold">Crypto Market (USD)</h2>
        <ul className="mt-3 space-y-3">{ADMIN_MARKET.map(asset => <li key={asset.sym} className="flex items-center gap-2 text-sm"><AssetMark symbol={asset.sym} /><span className="font-semibold">{asset.sym}</span><span className="ml-auto font-semibold">{adminMoney(asset.price, 2)}</span><Change value={asset.change} /></li>)}</ul>
      </section>
      <section className="rounded-3xl bg-white p-5 shadow-sm xl:col-span-3">
        <div className="mb-3 flex items-center justify-between"><h2 className="font-bold">Recent Transactions</h2><button type="button" className="text-sm font-semibold text-[#6d4dff]" onClick={() => onSection("transactions")}>View All</button></div>
        <div className="overflow-x-auto"><ActivityTable /></div>
      </section>
      <section className="rounded-3xl bg-white p-5 shadow-sm">
        <h2 className="font-bold">Quick Actions</h2>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {ADMIN_QUICK_ACTIONS.map(item => { const Icon = QUICK_ICONS[item.id]; return <button key={item.id} type="button" className="flex flex-col items-center gap-2 rounded-2xl bg-[#f4f5fb] px-3 py-4 text-sm font-semibold" onClick={() => runAction(item.id)}><Icon className="h-5 w-5 text-[#6d4dff]" />{item.label}</button>; })}
        </div>
      </section>
    </div>
    <p className="mt-4 text-xs leading-relaxed text-muted-foreground">Sample platform figures for this preview. Actions here do not move customer funds or change live prices.</p>
    <Dialog open={!!prompt} onOpenChange={open => { if (!open) setAction(null); }}>
      <DialogContent className="max-w-sm rounded-3xl">
        {prompt && <form className="space-y-4" onSubmit={submitAction}>
          <DialogHeader><DialogTitle>{prompt.title}</DialogTitle><DialogDescription>{prompt.detail}</DialogDescription></DialogHeader>
          {prompt.fields.map(field => <div key={field} className="space-y-2"><Label htmlFor={`admin-${field}`}>{field}</Label><Input id={`admin-${field}`} required className="h-11 bg-card" /></div>)}
          {saved && <p role="status" className="text-sm text-muted-foreground">{saved}</p>}
          <Button type="submit" className="h-11 w-full">Save preview</Button>
        </form>}
      </DialogContent>
    </Dialog>
  </>;
}

export function AdminPanel({ section }: { section: Exclude<AdminSection, "dashboard"> }) {
  if (section === "users") return <LiveUsersManagement />;
  if (section === "transactions") return <LiveTransactionsManagement />;
  if (section === "assets") return <LiveAssetsWalletManagement />;
  if (section === "trade") return <LiveTradeManagement />;
  if (section === "earn") return <Panel title="Invest / Earn" text="Sample earn products. Rewards are not added to a wallet.">
    <ul className="grid gap-3 sm:grid-cols-2">{[["BTC Earn", "4.2% sample APY"], ["USDT Earn", "6.0% sample APY"], ["SOL Earn", "5.1% sample APY"], ["ETH Earn", "3.4% sample APY"]].map(([name, rate]) => <li key={name} className="rounded-2xl bg-white p-4"><p className="font-bold">{name}</p><p className="text-sm text-muted-foreground">{rate}</p></li>)}</ul>
  </Panel>;
  if (section === "pricing") return <LiveTradeManagement initialTab="settings" />;
  if (section === "treasury") return <LiveTreasuryManagement />;
  if (section === "reports") return <ReportsManagement />;
  if (section === "referrals") return <LiveReferralManagement />;
  if (section === "deposits") return <LiveDepositsMonitoring />;
  if (section === "verifications") return <LiveVerificationManagement />;
  if (section === "deletions") return <LiveAccountDeletionManagement />;
  return <SettingsManagement />;
}

function Panel({ title, text, children }: { title: string; text: string; children: ReactNode }) {
  return <section><h2 className="text-xl font-extrabold">{title}</h2><p className="mb-4 mt-1 text-sm text-muted-foreground">{text}</p>{children}</section>;
}

function StatCard({ label, value, change, tone }: { label: string; value: string; change: number; tone: string }) {
  const toneClass = tone === "users" ? "bg-gradient-to-br from-[#6d4dff] to-[#8b5cff] text-white" : tone === "transactions" ? "bg-[#eef0fb]" : tone === "volume" ? "bg-[#e7f8ef]" : "bg-[#f3eefe]";
  return <article className={`rounded-3xl p-5 ${toneClass}`}><p className="text-sm opacity-80">{label}</p><p className="mt-2 text-2xl font-extrabold">{value}</p><p className={`mt-3 inline-flex rounded-full px-2 py-1 text-xs font-bold ${tone === "users" ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-700"}`}>↑ +{change.toFixed(1)}%</p></article>;
}

function Row({ label, value, mark = "text-foreground" }: { label: string; value: string; mark?: string }) {
  return <div className="flex items-center justify-between gap-3"><dt className="text-muted-foreground">{label}</dt><dd className={`font-bold ${mark}`}>{value}</dd></div>;
}

function Change({ value }: { value: number }) {
  const text = `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
  return <span className={`text-xs font-semibold ${value > 0 ? "text-emerald-600" : value < 0 ? "text-destructive" : "text-muted-foreground"}`}>{text}</span>;
}

function AssetMark({ symbol }: { symbol: string }) {
  const coin = COINS.find(item => item.sym === symbol);
  if (!coin) return <span className="grid h-6 w-6 place-items-center rounded-full bg-sky-500 text-[10px] font-bold text-white">$</span>;
  return <CoinIcon coin={coin} size="h-6 w-6" />;
}

function ActivityTable({ rows = ADMIN_ACTIVITY }: { rows?: readonly (typeof ADMIN_ACTIVITY)[number][] }) {
  return <table className="w-full min-w-[760px] text-left text-sm"><thead className="text-xs text-muted-foreground"><tr>{["Tx ID", "User", "Type", "Asset", "Amount", "Value (USD)", "Status", "Date"].map(heading => <th key={heading} className="px-2 py-2 font-medium">{heading}</th>)}</tr></thead><tbody>{rows.map(item => <tr key={item.id} className="border-t"><td className="px-2 py-3 font-medium">{item.id}</td><td className="px-2 py-3">{item.user}</td><td className={`px-2 py-3 font-semibold ${item.type === "Sell" ? "text-orange-500" : item.type === "Transfer" ? "text-sky-600" : item.type === "Invest" ? "text-violet-600" : "text-emerald-600"}`}>{item.type}</td><td className="px-2 py-3"><span className="inline-flex items-center gap-2"><AssetMark symbol={item.asset} />{item.asset}</span></td><td className="px-2 py-3">{item.amount}</td><td className="px-2 py-3">{adminMoney(item.value, 2)}</td><td className="px-2 py-3"><span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">{item.status}</span></td><td className="px-2 py-3 text-muted-foreground">{item.date}</td></tr>)}</tbody></table>;
}

function VolumeChart({ points, metric }: { points: readonly { label: string; volume: number; transactions: number }[]; metric: "volume" | "transactions" }) {
  const values = points.map(point => metric === "volume" ? point.volume : point.transactions);
  const max = metric === "volume" ? 300 : 6;
  const width = 640;
  const height = 220;
  const pad = 36;
  const coords = values.map((value, index) => {
    const x = pad + (index * (width - pad * 2)) / Math.max(values.length - 1, 1);
    const y = height - pad - (value / max) * (height - pad * 2);
    return [x, y] as const;
  });
  const line = coords.map(point => point.join(",")).join(" ");
  const area = coords.length ? `M ${coords[0][0]},${height - pad} L ${line} L ${coords[coords.length - 1][0]},${height - pad} Z` : "";
  const ticks = metric === "volume" ? [300, 250, 200, 150, 100, 50, 0] : [6, 5, 4, 3, 2, 1, 0];
  return <div className="mt-4 overflow-x-auto"><svg viewBox={`0 0 ${width} ${height}`} className="h-56 min-w-[520px] w-full" role="img" aria-label={metric === "volume" ? "Sample volume chart" : "Sample transaction count chart"}>
    <defs><linearGradient id="admin-volume" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6d4dff" stopOpacity="0.35" /><stop offset="100%" stopColor="#6d4dff" stopOpacity="0.02" /></linearGradient></defs>
    {ticks.map(tick => {
      const y = height - pad - (tick / max) * (height - pad * 2);
      const axis = tick === 0 ? (metric === "volume" ? "$0" : "0") : metric === "volume" ? `$${tick}M` : `${tick}M`;
      return <g key={tick}><line x1={pad} x2={width - 8} y1={y} y2={y} stroke="#eceef5" /><text x="0" y={y + 4} className="fill-muted-foreground" fontSize="11">{axis}</text></g>;
    })}
    <path d={area} fill="url(#admin-volume)" /><polyline points={line} fill="none" stroke="#6d4dff" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
    {coords.map((point, index) => <text key={points[index].label} x={point[0]} y={height - 8} textAnchor="middle" fontSize="10" className="fill-muted-foreground">{points[index].label}</text>)}
  </svg></div>;
}

