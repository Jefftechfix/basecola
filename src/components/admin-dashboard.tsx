import { LiveAccountDeletionManagement, LiveAssetsWalletManagement, LiveDepositsMonitoring, LiveReferralManagement, LiveTradeManagement, LiveTransactionsManagement, LiveTreasuryManagement, LiveUsersManagement, LiveVerificationManagement } from "@/components/admin-live";
import { useState, type ReactNode } from "react";
import { ArrowDownToLine, BadgeCheck, BarChart3, Bell, Calendar, CalendarDays, ChevronDown, CircleDollarSign, Home, Landmark, Mail, MapPin, Menu, Phone, RefreshCw, Settings, SlidersHorizontal, Trash2, UserPlus, UserRound, Users, Wallet, X, type LucideIcon } from "lucide-react";
import { CryptoAssetIcon } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ReportsManagement, SettingsManagement, UsersManagement } from "@/components/admin-management";
import { VerificationManagement } from "@/components/admin-verifications";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useAlchemyMarketPrices } from "@/components/market-prices";
import { getAdminDashboardSummary, getAdminProfile } from "@/lib/admin.functions";
import { ADMIN_PERIODS, type AdminDashboardRecentTransaction } from "@/lib/admin-dashboard-data";
import { adminCount, adminMoney } from "@/lib/admin-demo";
import { MARKET_SYMBOLS } from "@/lib/market-prices";

export type AdminSection = "dashboard" | "users" | "verifications" | "deletions" | "transactions" | "deposits" | "assets" | "trade" | "earn" | "pricing" | "treasury" | "reports" | "referrals" | "profile" | "settings";

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
  { id: "profile", label: "Admin Profile", icon: UserRound },
  { id: "settings", label: "Settings", icon: Settings },
];

export function AdminShell({ section, onSection, onSignOut, periodId, onPeriod, children }: { section: AdminSection; onSection: (section: AdminSection) => void; onSignOut: () => void; periodId: (typeof ADMIN_PERIODS)[number]["id"]; onPeriod: (id: (typeof ADMIN_PERIODS)[number]["id"]) => void; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(section === "settings");
  const loadAdminProfile = useServerFn(getAdminProfile);
  const profileQuery = useQuery({
    queryKey: ["admin-profile"],
    queryFn: () => loadAdminProfile(),
    staleTime: 60_000,
  });
  const profile = profileQuery.data;
  const profileName = profile?.name ?? "Admin";
  const profileEmail = profile?.email ?? "";
  const profileInitial = profileName.trim().charAt(0).toUpperCase() || "A";

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
      <button type="button" className="m-4 flex items-center gap-3 rounded-2xl bg-white/10 px-3 py-3 text-left" onClick={() => choose("profile")}><span className="relative grid h-9 w-9 place-items-center rounded-full bg-[#6d4dff] text-sm font-bold">{profileInitial}<span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#1b1240] bg-emerald-400" /></span><span className="min-w-0"><span className="block text-sm font-semibold">{profileName}</span><span className="block truncate text-xs text-white/60">{profileEmail || "Admin account"}</span></span></button>
    </aside>
    {open && <div className="fixed inset-0 z-40 lg:hidden"><button type="button" aria-label="Close menu" className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} /><aside className="relative flex h-full w-72 flex-col bg-[#1b1240] text-white"><div className="flex items-center justify-between px-5 py-5"><img src="/logo.png" alt="Basecola" className="h-12 w-auto rounded-lg bg-white" /><button type="button" aria-label="Close menu" onClick={() => setOpen(false)}><X /></button></div>{nav}</aside></div>}
    <div className="min-w-0">
      <header className="flex flex-wrap items-center gap-3 border-b bg-white/80 px-4 py-4 sm:px-6">
        <button type="button" className="grid h-10 w-10 place-items-center rounded-xl border lg:hidden" aria-label="Open admin menu" onClick={() => setOpen(true)}><Menu className="h-5 w-5" /></button>
        <div className="mr-auto"><h1 className="text-2xl font-extrabold">{section === "users" ? "Users Management" : section === "transactions" ? "Transactions Management" : section === "assets" ? "Assets / Wallet Management" : section === "trade" ? "Buy & Sell Management" : section === "pricing" ? "Pricing & Rate Management" : section === "treasury" ? "Treasury Management" : section === "reports" ? "Reports & Analytics" : section === "referrals" ? "Referral Management" : section === "profile" ? "Admin Profile" : section === "settings" ? "Settings Management" : NAV.find(item => item.id === section)?.label}</h1><p className="text-sm text-muted-foreground">{section === "users" ? "View, manage, and monitor all platform users" : section === "transactions" ? "Monitor, search, and manage all platform transactions" : section === "assets" ? "Configure supported networks, view customer wallet addresses, and request treasury operations" : section === "trade" ? "Review settled trades and configure enforced customer rates and limits" : section === "pricing" ? "Configure persisted buy/sell prices, trading availability, and order limits" : section === "treasury" ? "Review trusted balance observations and manage unexecuted operation requests" : section === "reports" ? "Insights, performance, and detailed reports across the platform" : section === "referrals" ? "Manage referrals, commissions, rewards, and promo programs" : section === "deposits" ? "Monitor, verify, and manage all user crypto deposits in real time" : section === "deletions" ? "Review account closure requests and download member data" : section === "verifications" ? "Review and manage user identity verification submissions." : section === "profile" ? "View your administrator account details" : section === "settings" ? "Configure platform policies, support, communications, security, and system features" : "Welcome back, Admin 👋"}</p></div>
        {(section === "dashboard" || section === "transactions" || section === "assets" || section === "trade" || section === "pricing" || section === "treasury" || section === "reports" || section === "referrals" || section === "deposits" || section === "settings") && <label className="flex h-10 items-center gap-2 rounded-xl border bg-white px-3 text-sm"><Calendar className="h-4 w-4 text-muted-foreground" /><span className="sr-only">Reporting dates</span><select aria-label="Reporting dates" value={periodId} onChange={event => onPeriod(event.target.value as (typeof ADMIN_PERIODS)[number]["id"])} className="bg-transparent outline-none">{ADMIN_PERIODS.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>}
        <Popover>
          <PopoverTrigger asChild><Button variant="ghost" size="icon" className="rounded-full bg-white" aria-label="Admin notifications"><Bell /></Button></PopoverTrigger>
          <PopoverContent align="end" className="w-72 p-0">
            <p className="border-b px-4 py-3 text-sm font-bold">Notifications</p>
            <p className="px-4 py-3 text-sm text-muted-foreground">Dashboard metrics are loaded from live platform records.</p>
          </PopoverContent>
        </Popover>
        <DropdownMenu>
          <DropdownMenuTrigger asChild><button type="button" className="flex items-center gap-2 rounded-full bg-white py-1 pl-1 pr-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-[#6d4dff] text-sm font-bold text-white">{profileInitial}</span><span className="text-left text-sm leading-tight"><span className="block font-bold">{profileName}</span><span className="text-xs text-muted-foreground">Administrator</span></span><ChevronDown className="h-4 w-4 text-muted-foreground" /></button></DropdownMenuTrigger>
          <DropdownMenuContent align="end"><DropdownMenuItem onClick={() => choose("profile")}>Admin Profile</DropdownMenuItem><DropdownMenuItem onClick={onSignOut}>Sign out</DropdownMenuItem></DropdownMenuContent>
        </DropdownMenu>
      </header>
      <div className="px-4 py-5 sm:px-6">{children}</div>
    </div>
  </div>;
}

const QUICK_ACTIONS: { label: string; section: AdminSection; icon: LucideIcon }[] = [
  { label: "Manage users", section: "users", icon: Users },
  { label: "Review verification", section: "verifications", icon: BadgeCheck },
  { label: "Transactions", section: "transactions", icon: RefreshCw },
  { label: "Deposits", section: "deposits", icon: ArrowDownToLine },
  { label: "Treasury", section: "treasury", icon: Landmark },
  { label: "Reports", section: "reports", icon: BarChart3 },
];

export function AdminDashboard({ onSection, periodId }: { onSection: (section: AdminSection) => void; periodId: (typeof ADMIN_PERIODS)[number]["id"] }) {
  const [metric, setMetric] = useState<"volume" | "transactions">("volume");
  const period = ADMIN_PERIODS.find(item => item.id === periodId) ?? ADMIN_PERIODS[0];
  const loadSummary = useServerFn(getAdminDashboardSummary);
  const summaryQuery = useQuery({
    queryKey: ["admin-dashboard-summary", periodId],
    queryFn: () => loadSummary({ data: { periodId } }),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
  const { data: marketQuotes, isPending: marketPending } = useAlchemyMarketPrices();
  const summary = summaryQuery.data;
  const stats = [
    { id: "users", label: "Total Users", value: summary ? adminCount(summary.users.total) : "—", change: null, note: "Registered profiles" },
    { id: "transactions", label: `Transactions · ${period.label}`, value: summary ? adminCount(summary.period.transactions) : "—", change: summary?.period.transactionChange ?? null, note: `vs previous ${period.label.toLowerCase()}` },
    { id: "volume", label: `Completed Volume · ${period.label}`, value: summary ? adminMoney(summary.period.volume) : "—", change: summary?.period.volumeChange ?? null, note: `vs previous ${period.label.toLowerCase()}` },
    { id: "revenue", label: `Platform Revenue · ${period.label}`, value: summary ? adminMoney(summary.revenue.periodTotal) : "—", change: null, note: "Recorded completed-transaction fees" },
  ];

  return <>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {stats.map(stat => <StatCard key={stat.id} label={stat.label} value={stat.value} change={stat.change} note={stat.note} tone={stat.id} />)}
    </div>
    {summaryQuery.error && <p role="alert" className="mt-4 rounded-xl border border-destructive/30 bg-white p-4 text-sm text-destructive">{summaryQuery.error.message}</p>}
    <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
      <span>Live platform records · Updated {summaryQuery.dataUpdatedAt ? new Date(summaryQuery.dataUpdatedAt).toLocaleTimeString() : "—"}</span>
      <Button type="button" size="sm" variant="outline" disabled={summaryQuery.isFetching} onClick={() => void summaryQuery.refetch()}>
        <RefreshCw className={`h-4 w-4 ${summaryQuery.isFetching ? "animate-spin" : ""}`} />Refresh data
      </Button>
    </div>
    <section className="mt-4 rounded-3xl bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-bold">Platform Revenue</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Completed platform fees · lifetime and {period.label.toLowerCase()}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Lifetime total</p>
          <p className="text-2xl font-extrabold">
            {summary ? adminMoney(summary.revenue.lifetimeTotal, 2) : "—"}
          </p>
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {summary?.revenue.byKind.map(({ kind, lifetime, period: periodRevenue }) => (
          <article key={kind} className="rounded-2xl bg-[#f4f5fb] p-4">
            <p className="text-sm font-semibold capitalize">{kind}</p>
            <p className="mt-2 text-lg font-bold">{adminMoney(lifetime, 2)}</p>
            <p className="text-xs text-muted-foreground">Lifetime</p>
            <p className="mt-3 text-sm font-semibold">{adminMoney(periodRevenue, 2)}</p>
            <p className="text-xs text-muted-foreground">{period.label}</p>
          </article>
        ))}
        {!summary && !summaryQuery.error && (
          <p className="text-sm text-muted-foreground">Loading revenue data…</p>
        )}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Revenue is the recorded fee on completed transactions, not the transferred amount.
        Funding currently records no platform fee; demo send fees are network estimates and
        are not platform revenue.
      </p>
    </section>
    <div className="mt-4 grid gap-4 xl:grid-cols-4">
      <section className="rounded-3xl bg-white p-5 shadow-sm xl:col-span-2">
        <div className="flex flex-wrap items-center gap-3"><h2 className="flex items-center gap-2 font-bold">{metric === "volume" ? "Transaction Volume" : "Transaction Count"}</h2>
          <div className="ml-auto flex rounded-full bg-[#f4f5fb] p-1 text-sm">
            <button type="button" className={`rounded-full px-3 py-1 font-semibold ${metric === "volume" ? "bg-[#6d4dff] text-white" : "text-muted-foreground"}`} aria-pressed={metric === "volume"} onClick={() => setMetric("volume")}>Volume</button>
            <button type="button" className={`rounded-full px-3 py-1 font-semibold ${metric === "transactions" ? "bg-[#6d4dff] text-white" : "text-muted-foreground"}`} aria-pressed={metric === "transactions"} onClick={() => setMetric("transactions")}>Transactions</button>
          </div>
        </div>
        <p className="mt-4 text-3xl font-extrabold">{summary ? metric === "volume" ? adminMoney(summary.period.volume) : adminCount(summary.period.transactions) : "—"}</p>
        <p className="mt-1 text-sm text-muted-foreground">Current period compared with the previous matching period</p>
        {summary && <VolumeChart points={summary.period.points} metric={metric} />}
        {!summary && !summaryQuery.error && <p className="mt-6 text-sm text-muted-foreground">Loading transaction data…</p>}
      </section>
      <section className="rounded-3xl bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 font-bold"><Users className="h-4 w-4 text-[#6d4dff]" />Users Overview</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <Row label="Total Users" value={summary ? adminCount(summary.users.total) : "—"} />
          <Row label="Verified Users" value={summary ? adminCount(summary.users.verified) : "—"} mark="text-emerald-600" />
          <Row label="Pending Verification" value={summary ? adminCount(summary.users.pending) : "—"} mark="text-amber-500" />
          <Row label="Rejected Verification" value={summary ? adminCount(summary.users.rejected) : "—"} mark="text-rose-600" />
          <Row label="No Verification Submitted" value={summary ? adminCount(summary.users.notSubmitted) : "—"} />
          <Row label="New Users (Today)" value={summary ? adminCount(summary.users.joinedToday) : "—"} mark="text-[#6d4dff]" />
        </dl>
        <Button type="button" variant="outline" className="mt-5 h-11 w-full rounded-xl border-[#6d4dff] text-[#6d4dff]" onClick={() => onSection("users")}>View All Users</Button>
      </section>
      <section className="rounded-3xl bg-white p-5 shadow-sm">
        <h2 className="font-bold">Crypto Market (USD)</h2>
        <p className="mt-1 text-xs text-muted-foreground">{marketQuotes?.length ? "Live · Alchemy" : "Live prices unavailable"}</p>
        {marketPending && <p className="mt-3 text-sm text-muted-foreground">Loading market prices…</p>}
        {!marketPending && marketQuotes?.length ? <ul className="mt-3 space-y-3">{MARKET_SYMBOLS.map(symbol => {
          const quote = marketQuotes.find(item => item.symbol === symbol);
          if (!quote) return null;
          return <li key={symbol} className="flex items-center gap-2 text-sm"><AssetMark symbol={symbol} /><span className="font-semibold">{symbol}</span><span className="ml-auto font-semibold">{adminMoney(quote.priceUsd, 2)}</span></li>;
        })}</ul> : !marketPending && <p className="mt-3 text-sm text-muted-foreground">No live market quotes are available.</p>}
      </section>
      <section className="rounded-3xl bg-white p-5 shadow-sm xl:col-span-3">
        <div className="mb-3 flex items-center justify-between"><h2 className="font-bold">Recent Transactions · {period.label}</h2><button type="button" className="text-sm font-semibold text-[#6d4dff]" onClick={() => onSection("transactions")}>View All</button></div>
        {summary?.recentTransactions.length ? <div className="overflow-x-auto"><ActivityTable rows={summary.recentTransactions} /></div> : <p className="py-6 text-sm text-muted-foreground">{summaryQuery.isPending ? "Loading recent transactions…" : "No transactions in this reporting period."}</p>}
      </section>
      <section className="rounded-3xl bg-white p-5 shadow-sm">
        <h2 className="font-bold">Quick Actions</h2>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {QUICK_ACTIONS.map(item => { const Icon = item.icon; return <button key={item.section} type="button" className="flex flex-col items-center gap-2 rounded-2xl bg-[#f4f5fb] px-3 py-4 text-sm font-semibold" onClick={() => onSection(item.section)}><Icon className="h-5 w-5 text-[#6d4dff]" />{item.label}</button>; })}
        </div>
      </section>
    </div>
  </>;
}

export function AdminPanel({ section }: { section: Exclude<AdminSection, "dashboard"> }) {
  if (section === "profile") return <AdminProfile />;
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

function AdminProfile() {
  const loadAdminProfile = useServerFn(getAdminProfile);
  const profileQuery = useQuery({
    queryKey: ["admin-profile"],
    queryFn: () => loadAdminProfile(),
    staleTime: 60_000,
  });
  const profile = profileQuery.data;

  if (profileQuery.isPending) {
    return <p className="rounded-2xl bg-white p-5 text-sm text-muted-foreground">Loading your profile…</p>;
  }
  if (profileQuery.error) {
    return <p role="alert" className="rounded-2xl bg-white p-5 text-sm text-destructive">{profileQuery.error.message}</p>;
  }
  if (!profile) {
    return <p role="alert" className="rounded-2xl bg-white p-5 text-sm text-destructive">Your admin profile is unavailable.</p>;
  }

  const joined = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString(undefined, { dateStyle: "long" })
    : "—";
  const details = [
    { label: "Full name", value: profile.name || "Not provided", icon: UserRound },
    { label: "Email address", value: profile.email || "Not provided", icon: Mail },
    { label: "Phone number", value: profile.phone?.trim() || "Not provided", icon: Phone },
    { label: "Country", value: profile.country?.trim() || "Not provided", icon: MapPin },
    { label: "Member since", value: joined, icon: CalendarDays },
    { label: "Admin user ID", value: profile.id, icon: BadgeCheck },
  ];

  return (
    <section className="max-w-3xl space-y-5">
      <header className="flex items-center gap-4 rounded-3xl bg-gradient-to-br from-[#1b1240] to-[#6d4dff] p-6 text-white shadow-sm">
        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-white/15 text-2xl font-extrabold">
          {profile.name.trim().charAt(0).toUpperCase() || "A"}
        </span>
        <div className="min-w-0">
          <p className="text-sm text-white/70">Administrator profile</p>
          <h2 className="truncate text-2xl font-extrabold">{profile.name}</h2>
          <p className="truncate text-sm text-white/80">{profile.email || "No email address"}</p>
        </div>
      </header>
      <dl className="grid gap-3 sm:grid-cols-2">
        {details.map(({ label, value, icon: Icon }) => (
          <div key={label} className="min-w-0 rounded-2xl bg-white p-4 shadow-sm">
            <dt className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Icon className="h-4 w-4 text-[#6d4dff]" />
              {label}
            </dt>
            <dd className={`mt-2 break-all text-sm font-semibold ${label === "Admin user ID" ? "font-mono text-xs" : ""}`}>
              {value}
            </dd>
          </div>
        ))}
      </dl>
      <p className="text-xs text-muted-foreground">Profile details are read from your signed-in administrator account.</p>
    </section>
  );
}

function StatCard({ label, value, change, note, tone }: { label: string; value: string; change: number | null; note: string; tone: string }) {
  const toneClass = tone === "users" ? "bg-gradient-to-br from-[#6d4dff] to-[#8b5cff] text-white" : tone === "transactions" ? "bg-[#eef0fb]" : tone === "volume" ? "bg-[#e7f8ef]" : "bg-[#f3eefe]";
  const trend = change === null
    ? note
    : `${change > 0 ? "↑ +" : change < 0 ? "↓ " : ""}${change.toFixed(1)}% ${note}`;
  const trendClass = tone === "users"
    ? "bg-white/20 text-white"
    : change !== null && change < 0
      ? "bg-rose-100 text-rose-700"
      : "bg-emerald-100 text-emerald-700";
  return <article className={`rounded-3xl p-5 ${toneClass}`}><p className="text-sm opacity-80">{label}</p><p className="mt-2 text-2xl font-extrabold">{value}</p><p className={`mt-3 inline-flex rounded-full px-2 py-1 text-xs font-bold ${trendClass}`}>{trend}</p></article>;
}

function Row({ label, value, mark = "text-foreground" }: { label: string; value: string; mark?: string }) {
  return <div className="flex items-center justify-between gap-3"><dt className="text-muted-foreground">{label}</dt><dd className={`font-bold ${mark}`}>{value}</dd></div>;
}

function AssetMark({ symbol }: { symbol: string }) {
  return <CryptoAssetIcon symbol={symbol} />;
}

function ActivityTable({ rows }: { rows: readonly AdminDashboardRecentTransaction[] }) {
  return <table className="w-full min-w-[760px] text-left text-sm"><thead className="text-xs text-muted-foreground"><tr>{["Tx ID", "User", "Type", "Asset", "Amount", "Value (USD)", "Status", "Date"].map(heading => <th key={heading} className="px-2 py-2 font-medium">{heading}</th>)}</tr></thead><tbody>{rows.map(item => {
    const status = item.status.toLowerCase();
    const statusClass = status === "completed" ? "bg-emerald-100 text-emerald-700" : status === "failed" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700";
    return <tr key={item.id} className="border-t"><td className="px-2 py-3 font-medium">{item.id}</td><td className="px-2 py-3">{item.user}</td><td className="px-2 py-3 font-semibold">{item.type}</td><td className="px-2 py-3"><span className="inline-flex items-center gap-2"><AssetMark symbol={item.asset} />{item.asset}</span></td><td className="px-2 py-3">{item.amount}</td><td className="px-2 py-3">{adminMoney(item.value, 2)}</td><td className="px-2 py-3"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusClass}`}>{item.status}</span></td><td className="px-2 py-3 text-muted-foreground">{item.date}</td></tr>;
  })}</tbody></table>;
}

function VolumeChart({ points, metric }: { points: readonly { label: string; volume: number; transactions: number }[]; metric: "volume" | "transactions" }) {
  const values = points.map(point => metric === "volume" ? point.volume : point.transactions);
  const max = Math.max(...values, 1);
  const ticks = Array.from({ length: 5 }, (_, index) => (max * (4 - index)) / 4);
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
  return <div className="mt-4 overflow-x-auto"><svg viewBox={`0 0 ${width} ${height}`} className="h-56 min-w-[520px] w-full" role="img" aria-label={metric === "volume" ? "Completed transaction volume chart" : "Transaction count chart"}>
    <defs><linearGradient id="admin-volume" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6d4dff" stopOpacity="0.35" /><stop offset="100%" stopColor="#6d4dff" stopOpacity="0.02" /></linearGradient></defs>
    {ticks.map(tick => {
      const y = height - pad - (tick / max) * (height - pad * 2);
      const axis = metric === "volume"
        ? tick >= 1_000_000 ? `$${(tick / 1_000_000).toFixed(1)}M` : tick >= 1_000 ? `$${(tick / 1_000).toFixed(1)}K` : adminMoney(tick)
        : adminCount(Math.round(tick));
      return <g key={tick}><line x1={pad} x2={width - 8} y1={y} y2={y} stroke="#eceef5" /><text x="0" y={y + 4} className="fill-muted-foreground" fontSize="11">{axis}</text></g>;
    })}
    <path d={area} fill="url(#admin-volume)" /><polyline points={line} fill="none" stroke="#6d4dff" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
    {coords.map((point, index) => <text key={points[index].label} x={point[0]} y={height - 8} textAnchor="middle" fontSize="10" className="fill-muted-foreground">{points[index].label}</text>)}
  </svg></div>;
}
