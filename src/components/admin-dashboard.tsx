import { LiveAccountDeletionManagement, LiveAssetsWalletManagement, LiveDepositsMonitoring, LiveReferralManagement, LiveTradeManagement, LiveTransactionsManagement, LiveTreasuryManagement, LiveUsersManagement, LiveVerificationManagement } from "@/components/admin-live";
import { LiveSignupAnalytics, SignupCountryCard } from "@/components/admin-signup-analytics";
import { useState, type ReactNode } from "react";
import { ArrowDownToLine, BadgeCheck, BarChart3, Bell, Calendar, ChevronDown, CircleDollarSign, Globe2, Home, Info, Landmark, Menu, RefreshCw, Settings, SlidersHorizontal, Ticket, Trash2, UserPlus, Users, Wallet, X, type LucideIcon } from "lucide-react";
import { COINS, CoinIcon } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ReportsManagement, SettingsManagement, UsersManagement } from "@/components/admin-management";
import { VerificationManagement } from "@/components/admin-verifications";
import { ADMIN_NOTICES, ADMIN_PERIODS, ADMIN_QUICK_ACTIONS, adminCount, adminMoney } from "@/lib/admin-demo";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAdminDashboardOverview, type AdminDashboardOverview } from "@/lib/admin.functions";

export type AdminSection = "dashboard" | "users" | "signup-analytics" | "verifications" | "deletions" | "transactions" | "deposits" | "assets" | "trade" | "earn" | "pricing" | "treasury" | "reports" | "referrals" | "settings";

const NAV: { id: AdminSection; label: string; icon: typeof Home }[] = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "users", label: "Users", icon: Users },
  { id: "signup-analytics", label: "Signups by Country", icon: Globe2 },
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
      <header className="flex flex-wrap items-center xl:flex-nowrap gap-3 border-b bg-white/80 px-4 py-4 sm:px-6">
        <button type="button" className="grid h-10 w-10 place-items-center rounded-xl border lg:hidden" aria-label="Open admin menu" onClick={() => setOpen(true)}><Menu className="h-5 w-5" /></button>
        <div className="mr-auto min-w-0 flex-1"><h1 className="text-2xl font-extrabold">{section === "users" ? "Users Management" : section === "transactions" ? "Transactions Management" : section === "assets" ? "Assets / Wallet Management" : section === "trade" ? "Buy & Sell Management" : section === "pricing" ? "Pricing & Rate Management" : section === "treasury" ? "Treasury Management" : section === "signup-analytics" ? "Signup Analytics" : section === "reports" ? "Reports & Analytics" : section === "referrals" ? "Referral Management" : section === "settings" ? "Settings Management" : NAV.find(item => item.id === section)?.label}</h1><p className="text-sm text-muted-foreground">{section === "users" ? "View, manage, and monitor all platform users" : section === "transactions" ? "Monitor, search, and manage all platform transactions" : section === "assets" ? "Configure supported networks, view customer wallet addresses, and request treasury operations" : section === "trade" ? "Review settled trades and configure enforced customer rates and limits" : section === "pricing" ? "Configure persisted buy/sell prices, trading availability, and order limits" : section === "treasury" ? "Review trusted balance observations and manage unexecuted operation requests" : section === "signup-analytics" ? "See which countries bring in the most new member signups" : section === "reports" ? "Insights, performance, and detailed reports across the platform" : section === "referrals" ? "Manage referrals, commissions, rewards, and promo programs" : section === "deposits" ? "Monitor, verify, and manage all user crypto deposits in real time" : section === "deletions" ? "Review account closure requests and download member data" : section === "verifications" ? "Review and manage user identity verification submissions." : section === "settings" ? "Configure platform policies, support, communications, security, and system features" : "Welcome back, Admin 👋"}</p></div>
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

const QUICK_TARGET: Record<string, AdminSection> = { "add-user": "users", "fund-wallet": "users", "adjust-rates": "pricing", "create-promo": "referrals", "view-reports": "reports", settings: "settings" };

export function AdminDashboard({ onSection, periodId }: { onSection: (section: AdminSection) => void; periodId: (typeof ADMIN_PERIODS)[number]["id"] }) {
  const [metric, setMetric] = useState<"volume" | "transactions">("volume");
  const period = ADMIN_PERIODS.find(item => item.id === periodId) ?? ADMIN_PERIODS[0];
  const fetchOverview = useServerFn(getAdminDashboardOverview);
  const { data, isPending, error } = useQuery({ queryKey: ["admin-dashboard-overview", period.days], queryFn: () => fetchOverview({ data: { days: period.days } }), refetchInterval: 60_000 });
  const s = data?.stats;
  const u = data?.users;
  const dash = isPending ? "…" : "—";
  const stats = [
    { id: "users", label: "Total Users", value: s ? adminCount(s.users) : dash, change: s?.usersChange ?? 0 },
    { id: "transactions", label: `Transactions (${period.label})`, value: s ? adminCount(s.transactions) : dash, change: s?.transactionsChange ?? 0 },
    { id: "volume", label: "Completed Volume (USD)", value: s ? adminMoney(s.volume, 2) : dash, change: s?.volumeChange ?? 0 },
    { id: "revenue", label: "Fees Earned", value: s ? adminMoney(s.fees, 2) : dash, change: s?.feesChange ?? 0 },
  ];

  return <>
    {error && <p role="alert" className="mb-4 rounded-2xl bg-destructive/10 p-3 text-sm text-destructive">Could not load dashboard figures: {error.message}</p>}
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {stats.map(stat => <StatCard key={stat.id} label={stat.label} value={stat.value} change={stat.change} tone={stat.id} />)}
    </div>
    <div className="mt-4 grid gap-4 xl:grid-cols-4">
      <section className="rounded-3xl bg-white p-5 shadow-sm xl:col-span-2">
        <div className="flex flex-wrap items-center gap-3"><h2 className="flex items-center gap-2 font-bold">Transaction Volume <Info className="h-4 w-4 text-muted-foreground" aria-label="Live totals for the selected dates" /></h2>
          <div className="ml-auto flex rounded-full bg-[#f4f5fb] p-1 text-sm">
            <button type="button" className={`rounded-full px-3 py-1 font-semibold ${metric === "volume" ? "bg-[#6d4dff] text-white" : "text-muted-foreground"}`} aria-pressed={metric === "volume"} onClick={() => setMetric("volume")}>Volume</button>
            <button type="button" className={`rounded-full px-3 py-1 font-semibold ${metric === "transactions" ? "bg-[#6d4dff] text-white" : "text-muted-foreground"}`} aria-pressed={metric === "transactions"} onClick={() => setMetric("transactions")}>Transactions</button>
          </div>
        </div>
        <p className="mt-4 text-3xl font-extrabold">{s ? (metric === "volume" ? adminMoney(s.volume, 2) : adminCount(s.transactions)) : dash}</p>
        {s && <ChangeLine value={metric === "volume" ? s.volumeChange : s.transactionsChange} label={`vs previous ${period.days === 1 ? "day" : `${period.days} days`}`} />}
        <VolumeChart points={data?.points ?? []} metric={metric} />
      </section>
      <section className="rounded-3xl bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 font-bold"><Users className="h-4 w-4 text-[#6d4dff]" />Users Overview</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <Row label="Total Users" value={u ? adminCount(u.total) : dash} />
          <Row label="Verified Users" value={u ? adminCount(u.verified) : dash} mark="text-emerald-600" />
          <Row label="Unverified Users" value={u ? adminCount(u.unverified) : dash} mark="text-amber-500" />
          <Row label="Active (30 days)" value={u ? adminCount(u.active) : dash} mark="text-emerald-600" />
          <Row label="New Users (Today)" value={u ? adminCount(u.joinedToday) : dash} mark="text-[#6d4dff]" />
        </dl>
        <Button type="button" variant="outline" className="mt-5 h-11 w-full rounded-xl border-[#6d4dff] text-[#6d4dff]" onClick={() => onSection("users")}>View All Users</Button>
      </section>
      <SignupCountryCard onViewAll={() => onSection("signup-analytics")} />
      <section className="rounded-3xl bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between"><h2 className="font-bold">Platform Rates (USD)</h2><button type="button" className="text-sm font-semibold text-[#6d4dff]" onClick={() => onSection("pricing")}>Edit</button></div>
        <p className="mt-1 text-xs text-muted-foreground">Buy / sell prices members currently get</p>
        {data && !data.market.length && <p className="mt-3 text-sm text-muted-foreground">No rates configured yet.</p>}
        <ul className="mt-3 space-y-3">{(data?.market ?? []).map(asset => <li key={asset.coin} className="flex items-center gap-2 text-sm"><AssetMark symbol={asset.coin} /><span className="font-semibold">{asset.coin}</span><span className="ml-auto text-right"><span className="block font-semibold">{adminMoney(asset.buy, 2)}</span><span className="block text-xs text-muted-foreground">Sell {adminMoney(asset.sell, 2)}</span></span></li>)}</ul>
      </section>
      <section className="rounded-3xl bg-white p-5 shadow-sm xl:col-span-3">
        <div className="mb-3 flex items-center justify-between"><h2 className="font-bold">Recent Transactions</h2><button type="button" className="text-sm font-semibold text-[#6d4dff]" onClick={() => onSection("transactions")}>View All</button></div>
        {data && !data.recent.length ? <p className="py-6 text-center text-sm text-muted-foreground">No transactions yet.</p> : <div className="overflow-x-auto"><ActivityTable rows={data?.recent ?? []} /></div>}
      </section>
      <section className="rounded-3xl bg-white p-5 shadow-sm">
        <h2 className="font-bold">Quick Actions</h2>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {ADMIN_QUICK_ACTIONS.map(item => { const Icon = QUICK_ICONS[item.id]; return <button key={item.id} type="button" className="flex flex-col items-center gap-2 rounded-2xl bg-[#f4f5fb] px-3 py-4 text-sm font-semibold" onClick={() => onSection(QUICK_TARGET[item.id] ?? "dashboard")}><Icon className="h-5 w-5 text-[#6d4dff]" />{item.label}</button>; })}
        </div>
      </section>
    </div>
    <p className="mt-4 text-xs leading-relaxed text-muted-foreground">Live figures from member accounts and transactions. Updates every minute.</p>
  </>;
}

function ChangeLine({ value, label }: { value: number; label: string }) {
  const up = value >= 0;
  return <p className={`mt-1 text-sm font-semibold ${up ? "text-emerald-600" : "text-destructive"}`}>{up ? "↑ +" : "↓ "}{value.toFixed(1)}% <span className="font-medium text-muted-foreground">{label}</span></p>;
}

export function AdminPanel({ section }: { section: Exclude<AdminSection, "dashboard"> }) {
  if (section === "users") return <LiveUsersManagement />;
  if (section === "signup-analytics") return <LiveSignupAnalytics />;
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
  return <article className={`rounded-3xl p-5 ${toneClass}`}><p className="text-sm opacity-80">{label}</p><p className="mt-2 text-2xl font-extrabold">{value}</p><p className={`mt-3 inline-flex rounded-full px-2 py-1 text-xs font-bold ${tone === "users" ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-700"}`}>{change >= 0 ? "↑ +" : "↓ "}{change.toFixed(1)}%</p></article>;
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

type RecentRow = AdminDashboardOverview["recent"][number];
const KIND_TONE: Record<string, string> = { sell: "text-orange-500", send: "text-sky-600", receive: "text-sky-600", funding: "text-violet-600" };
const STATUS_TONE: Record<string, string> = { completed: "bg-emerald-100 text-emerald-700", pending: "bg-amber-100 text-amber-700", failed: "bg-destructive/10 text-destructive" };

function ActivityTable({ rows }: { rows: RecentRow[] }) {
  return <table className="w-full min-w-[760px] text-left text-sm"><thead className="text-xs text-muted-foreground"><tr>{["Reference", "User", "Type", "Asset", "Amount", "Value (USD)", "Status", "Date"].map(heading => <th key={heading} className="px-2 py-2 font-medium">{heading}</th>)}</tr></thead><tbody>{rows.map(item => <tr key={item.id} className="border-t"><td className="max-w-[140px] truncate px-2 py-3 font-medium" title={item.reference}>{item.reference}</td><td className="max-w-[160px] truncate px-2 py-3">{item.user}</td><td className={`px-2 py-3 font-semibold capitalize ${KIND_TONE[item.kind] ?? "text-emerald-600"}`}>{item.kind}</td><td className="px-2 py-3"><span className="inline-flex items-center gap-2"><AssetMark symbol={item.coin} />{item.coin}</span></td><td className="px-2 py-3">{item.amount ? item.amount.toLocaleString("en-US", { maximumFractionDigits: 8 }) : "—"}</td><td className="px-2 py-3">{adminMoney(item.usd, 2)}</td><td className="px-2 py-3"><span className={`rounded-full px-2 py-1 text-xs font-semibold capitalize ${STATUS_TONE[item.status] ?? "bg-muted text-muted-foreground"}`}>{item.status}</span></td><td className="px-2 py-3 text-muted-foreground">{new Date(item.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</td></tr>)}</tbody></table>;
}

function VolumeChart({ points, metric }: { points: readonly { label: string; volume: number; transactions: number }[]; metric: "volume" | "transactions" }) {
  const values = points.map(point => metric === "volume" ? point.volume : point.transactions);
  const top = Math.max(...values, 0);
  const max = top <= 0 ? 6 : Math.ceil(top / 6) * 6 || 6;
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
  const ticks = [6, 5, 4, 3, 2, 1, 0].map(step => (max / 6) * step);
  return <div className="mt-4 overflow-x-auto"><svg viewBox={`0 0 ${width} ${height}`} className="h-56 min-w-[520px] w-full" role="img" aria-label={metric === "volume" ? "Daily completed volume chart" : "Daily transaction count chart"}>
    <defs><linearGradient id="admin-volume" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6d4dff" stopOpacity="0.35" /><stop offset="100%" stopColor="#6d4dff" stopOpacity="0.02" /></linearGradient></defs>
    {ticks.map(tick => {
      const y = height - pad - (tick / max) * (height - pad * 2);
      const axis = metric === "volume" ? `$${Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(tick)}` : Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(tick);
      return <g key={tick}><line x1={pad} x2={width - 8} y1={y} y2={y} stroke="#eceef5" /><text x="0" y={y + 4} className="fill-muted-foreground" fontSize="11">{axis}</text></g>;
    })}
    <path d={area} fill="url(#admin-volume)" /><polyline points={line} fill="none" stroke="#6d4dff" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
    {coords.map((point, index) => (points.length <= 10 || index % Math.ceil(points.length / 8) === 0) && <text key={points[index].label} x={point[0]} y={height - 8} textAnchor="middle" fontSize="10" className="fill-muted-foreground">{points[index].label}</text>)}
  </svg></div>;
}

