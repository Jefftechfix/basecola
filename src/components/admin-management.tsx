import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getPlatformSettings, updatePlatformSettings, type SettingsAuditRow, type SettingsSection } from "@/lib/admin-settings.functions";
import { Activity, ArrowDownLeft, ArrowDownToLine, ArrowLeftRight, ArrowUpRight, Ban, BadgeCheck, BarChart3, Bell, Calendar, Check, ChevronDown, ChevronLeft, ChevronRight, Clock, Code, Coins, Copy, Download, Eye, FileText, Flame, Gift, Globe, Headphones, Landmark, Layers, Link2, Lock, Mail, Megaphone, MessageCircle, Monitor, Moon, Pencil, Percent, Phone, PieChart, Plus, QrCode, RefreshCw, Scale, Search, Settings, Share2, Shield, ShoppingCart, Sun, Trophy, Upload, UserPlus, Users, Wallet, Wrench, X, Zap } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { COINS, CoinIcon } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ADMIN_ASSETS, ADMIN_DIRECTORY, ADMIN_LEDGER, ADMIN_TX_STATS, ADMIN_USER_STATS, DEPOSIT_ADDRESSES, DEPOSIT_ASSETS, DEPOSIT_MONITOR, DEPOSIT_ROWS, DEPOSIT_TREND, OTC_LIMITS, OTC_LIQUIDITY, OTC_ORDERS, OTC_PERFORMANCE, OTC_RATES, OTC_SUMMARY, PLATFORM_SUMMARY, PLATFORM_WALLETS, PRICE_ASSETS, PRICE_HISTORY, PRICE_SUMMARY, PLATFORM_REPORTS, REFERRAL_CAMPAIGNS, REFERRAL_COMMISSIONS, REFERRAL_LINK, REFERRAL_MIX, REFERRAL_PROGRAM_CODE, REFERRAL_QR, REFERRAL_SERIES, REFERRAL_SUMMARY, REPORT_ASSETS, REPORT_GROWTH, REPORT_KPIS, REPORT_SUMMARY, REPORT_VOLUME, TOP_REFERRERS, TREASURY_ACCOUNTS, TREASURY_ACTIVITY, TREASURY_BUCKETS, TREASURY_HOLDINGS, TREASURY_MIX, TREASURY_MOVES, TREASURY_PAGE, TREASURY_SUMMARY, adminCount, adminMoney, type AdminAssetRow, type AdminDirectoryUser, type AdminLedgerRow, type DepositAddress, type OtcOrder, type PlatformReport, type PlatformWallet, type PriceAsset, type PriceHistoryRow, type ReferralCampaign, type TreasuryAccount, type TreasuryActivity, type TreasuryHolding, type TreasuryMove } from "@/lib/admin-demo";

const AVATAR: Record<string, string> = {
  MS: "bg-violet-100 text-violet-700",
  AK: "bg-pink-100 text-pink-700",
  JO: "bg-sky-100 text-sky-700",
  FA: "bg-amber-100 text-amber-700",
  IB: "bg-indigo-100 text-indigo-700",
  SA: "bg-rose-100 text-rose-700",
  EM: "bg-red-100 text-red-700",
  KA: "bg-emerald-100 text-emerald-700",
  AO: "bg-cyan-100 text-cyan-700",
  BA: "bg-orange-100 text-orange-700",
  HA: "bg-lime-100 text-lime-700",
  RU: "bg-fuchsia-100 text-fuchsia-700",
  MO: "bg-teal-100 text-teal-700",
};

export function UsersManagement() {
  const [users, setUsers] = useState(ADMIN_DIRECTORY);
  const [tab, setTab] = useState<"all" | "verified" | "pending" | "suspended">("all");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All Status");
  const [kyc, setKyc] = useState("All KYC");
  const [joined, setJoined] = useState("All Time");
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [notice, setNotice] = useState("");
  const [detail, setDetail] = useState<AdminDirectoryUser | null>(null);
  const [editing, setEditing] = useState<AdminDirectoryUser | null>(null);
  const [adding, setAdding] = useState(false);
  const rows = useMemo(() => users.filter(user => {
    const tabOk = tab === "all" || (tab === "verified" && user.kyc === "Verified") || (tab === "pending" && user.kyc === "Pending") || (tab === "suspended" && user.status === "Suspended");
    const text = `${user.name} ${user.email} ${user.phone} ${user.id}`.toLowerCase();
    return tabOk && text.includes(query.trim().toLowerCase()) && (status === "All Status" || user.status === status) && (kyc === "All KYC" || user.kyc === kyc) && (joined === "All Time" || user.joined.startsWith("Oct"));
  }), [users, tab, query, status, kyc, joined]);
  const visible = page === 1 ? rows : [];

  function toggleAll(checked: boolean) {
    setSelected(checked ? visible.map(user => user.id) : []);
  }

  function exportRows(list: AdminDirectoryUser[]) {
    const body = ["ID,Name,Email,Phone,Country,KYC,Balance,Transactions,Joined,Status", ...list.map(user => [user.id, user.name, user.email, user.phone, user.country, user.kyc, user.balance, user.transactions, user.joined, user.status].join(","))].join("\n");
    download("basecola-users-preview.csv", body);
    setNotice("Exported the sample rows on this page. This file is not a live user report.");
  }

  function addUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const next = users.length + 234;
    setUsers(current => [{ id: `BC100${next}`, initials: initials(name), name, email, phone: String(data.get("phone") ?? ""), country: "Nigeria", kyc: "Pending", balance: 0, transactions: 0, joined: "Nov 2, 2026", status: "Pending" }, ...current]);
    setAdding(false);
    setPage(1);
    setNotice("Added in this preview only. No customer account was created.");
  }

  function saveUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    const data = new FormData(event.currentTarget);
    const nextStatus = String(data.get("status")) as AdminDirectoryUser["status"];
    setUsers(current => current.map(user => user.id === editing.id ? { ...user, name: String(data.get("name")), phone: String(data.get("phone")), status: nextStatus } : user));
    setEditing(null);
    setNotice("Saved in this preview only. The customer profile is unchanged.");
  }

  return <section className="space-y-4">
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {ADMIN_USER_STATS.map(stat => <Metric key={stat.id} label={stat.label} value={adminCount(stat.value)} change={stat.change} tone={stat.id} icon={stat.id === "verified" ? BadgeCheck : stat.id === "pending" ? Clock : stat.id === "suspended" ? Ban : Users} />)}
    </div>
    <div className="flex flex-wrap items-center gap-2">
      {([["all", `All Users (${adminCount(ADMIN_USER_STATS[0].value)})`], ["verified", `Verified (${adminCount(ADMIN_USER_STATS[1].value)})`], ["pending", `Pending (${adminCount(ADMIN_USER_STATS[2].value)})`], ["suspended", `Suspended (${adminCount(ADMIN_USER_STATS[3].value)})`]] as const).map(([id, label]) => <button key={id} type="button" aria-pressed={tab === id} className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === id ? "bg-[#6d4dff] text-white" : "bg-white text-muted-foreground"}`} onClick={() => { setTab(id); setPage(1); }}>{label}</button>)}
      <Button type="button" variant="outline" className="ml-auto rounded-xl bg-white" onClick={() => exportRows(visible)}><Download />Export</Button>
      <Button type="button" className="rounded-xl bg-[#6d4dff] hover:bg-[#6d4dff]/90" onClick={() => setAdding(true)}><Plus />Add User</Button>
    </div>
    <div className="flex flex-wrap gap-2">
      <label className="relative min-w-64 flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input aria-label="Search users" placeholder="Search users (name, email, phone, user ID)..." value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} className="h-11 bg-white pl-9" /></label>
      <Filter label="Status" value={status} options={["All Status", "Active", "Pending", "Suspended"]} onChange={value => { setStatus(value); setPage(1); }} />
      <Filter label="KYC" value={kyc} options={["All KYC", "Verified", "Pending", "Rejected"]} onChange={value => { setKyc(value); setPage(1); }} />
      <Filter label="Joined" value={joined} options={["All Time", "October 2025"]} onChange={value => { setJoined(value); setPage(1); }} />
    </div>
    <div className="overflow-x-auto rounded-3xl bg-white shadow-sm">
      <table className="w-full min-w-[1080px] text-left text-sm">
        <thead className="text-xs text-muted-foreground"><tr>{["", "User", "Email / Phone", "Country", "KYC Status", "Wallet Balance (USD)", "Total Transactions", "Joined", "Status", "Actions"].map(heading => <th key={heading || "check"} className="px-3 py-3 font-medium">{heading === "" ? <input aria-label="Select visible users" type="checkbox" checked={visible.length > 0 && selected.length === visible.length} onChange={event => toggleAll(event.target.checked)} /> : heading}</th>)}</tr></thead>
        <tbody>{visible.map(user => <tr key={user.id} className="border-t">
          <td className="px-3 py-3"><input aria-label={`Select ${user.name}`} type="checkbox" checked={selected.includes(user.id)} onChange={event => setSelected(current => event.target.checked ? [...current, user.id] : current.filter(id => id !== user.id))} /></td>
          <td className="px-3 py-3"><span className="flex items-center gap-2"><span className={`grid h-9 w-9 place-items-center rounded-full text-xs font-bold ${AVATAR[user.initials] ?? "bg-accent text-primary"}`}>{user.initials}</span><span><span className="block font-semibold">{user.name}</span><span className="text-xs text-muted-foreground">ID: {user.id}</span></span></span></td>
          <td className="px-3 py-3"><span className="block">{user.email}</span><span className="text-xs text-muted-foreground">{user.phone}</span></td>
          <td className="px-3 py-3">🇳🇬 {user.country}</td>
          <td className="px-3 py-3"><Pill tone={user.kyc === "Verified" ? "green" : user.kyc === "Pending" ? "amber" : "red"}>{user.kyc}</Pill></td>
          <td className="px-3 py-3">{adminMoney(user.balance, 2)}</td>
          <td className="px-3 py-3">{adminCount(user.transactions)}</td>
          <td className="px-3 py-3">{user.joined}</td>
          <td className="px-3 py-3"><Pill tone={user.status === "Active" ? "green" : user.status === "Pending" ? "amber" : "red"}>{user.status}</Pill></td>
          <td className="px-3 py-3"><span className="flex gap-1"><IconButton label={`View ${user.name}`} onClick={() => setDetail(user)}><Eye className="h-4 w-4" /></IconButton><IconButton label={`Edit ${user.name}`} onClick={() => setEditing(user)}><Pencil className="h-4 w-4" /></IconButton><DropdownMenu><DropdownMenuTrigger asChild><button type="button" aria-label={`More actions for ${user.name}`} className="grid h-8 w-8 place-items-center rounded-lg text-lg leading-none text-muted-foreground hover:bg-accent">···</button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => { setUsers(current => current.map(item => item.id === user.id ? { ...item, status: item.status === "Suspended" ? "Active" : "Suspended" } : item)); setNotice("Status changed in this preview only."); }}>Toggle status in preview</DropdownMenuItem></DropdownMenuContent></DropdownMenu></span></td>
        </tr>)}{visible.length === 0 && <tr><td colSpan={10} className="px-3 py-10 text-center text-muted-foreground">{page === 1 ? "No sample users match these filters." : "Further pages are not included in this preview."}</td></tr>}</tbody>
      </table>
      <footer className="flex flex-wrap items-center gap-3 border-t px-3 py-3 text-sm">
        <label className="flex items-center gap-2"><input aria-label="Select all visible users" type="checkbox" checked={visible.length > 0 && selected.length === visible.length} onChange={event => toggleAll(event.target.checked)} />Select all</label>
        <Button type="button" variant="outline" className="h-9" onClick={() => selected.length ? exportRows(users.filter(user => selected.includes(user.id))) : setNotice("Select at least one user.")}>Bulk actions</Button>
        <span className="ml-auto text-muted-foreground">Showing {visible.length ? `1–${visible.length}` : "0"} of {adminCount(ADMIN_USER_STATS[0].value)}</span>
        <Pager page={page} onPage={setPage} />
      </footer>
    </div>
    {notice && <p role="status" className="text-sm text-muted-foreground">{notice}</p>}
    <p className="text-xs text-muted-foreground">Sample directory. Edits, exports, and new rows stay in this browser preview.</p>
    <Dialog open={!!detail} onOpenChange={open => { if (!open) setDetail(null); }}><DialogContent className="max-w-md rounded-3xl">{detail && <><DialogHeader><DialogTitle>{detail.name}</DialogTitle><DialogDescription>ID {detail.id} · {detail.email}</DialogDescription></DialogHeader><dl className="space-y-2 text-sm"><Info label="Phone" value={detail.phone} /><Info label="Country" value={detail.country} /><Info label="KYC" value={detail.kyc} /><Info label="Wallet" value={adminMoney(detail.balance, 2)} /><Info label="Transactions" value={adminCount(detail.transactions)} /><Info label="Status" value={detail.status} /></dl></>}</DialogContent></Dialog>
    <Dialog open={!!editing} onOpenChange={open => { if (!open) setEditing(null); }}><DialogContent className="max-w-md rounded-3xl">{editing && <form className="space-y-4" onSubmit={saveUser}><DialogHeader><DialogTitle>Edit {editing.name}</DialogTitle><DialogDescription>This change stays in the preview.</DialogDescription></DialogHeader><Field name="name" label="Name" defaultValue={editing.name} /><Field name="phone" label="Phone" defaultValue={editing.phone} /><label className="block text-sm">Status<select name="status" defaultValue={editing.status} className="mt-1 h-11 w-full rounded-md border bg-card px-3"><option>Active</option><option>Pending</option><option>Suspended</option></select></label><Button type="submit" className="h-11 w-full">Save preview</Button></form>}</DialogContent></Dialog>
    <Dialog open={adding} onOpenChange={setAdding}><DialogContent className="max-w-md rounded-3xl"><form className="space-y-4" onSubmit={addUser}><DialogHeader><DialogTitle>Add User</DialogTitle><DialogDescription>The new row stays in this preview.</DialogDescription></DialogHeader><Field name="name" label="Name" /><Field name="email" label="Email" type="email" /><Field name="phone" label="Phone" /><Button type="submit" className="h-11 w-full">Add to preview</Button></form></DialogContent></Dialog>
  </section>;
}

export function TransactionsManagement() {
  const [rows, setRows] = useState(ADMIN_LEDGER);
  const [tab, setTab] = useState<"all" | "Completed" | "Pending" | "Failed">("all");
  const [query, setQuery] = useState("");
  const [type, setType] = useState("All Types");
  const [asset, setAsset] = useState("All Assets");
  const [status, setStatus] = useState("All Status");
  const [when, setWhen] = useState("All Time");
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [notice, setNotice] = useState("");
  const [detail, setDetail] = useState<AdminLedgerRow | null>(null);
  const [creating, setCreating] = useState(false);
  const visibleSource = useMemo(() => rows.filter(item => {
    const text = `${item.id} ${item.name} ${item.email} ${item.asset}`.toLowerCase();
    return (tab === "all" || item.status === tab) && text.includes(query.trim().toLowerCase()) && (type === "All Types" || item.type === type) && (asset === "All Assets" || item.asset === asset) && (status === "All Status" || item.status === status) && (when === "All Time" || item.date.startsWith(when));
  }), [rows, tab, query, type, asset, status, when]);
  const visible = page === 1 ? visibleSource : [];

  function exportRows(list: AdminLedgerRow[]) {
    const body = ["ID,Name,Email,Type,Asset,Amount,Value,Fee,Status,Date", ...list.map(item => [item.id, item.name, item.email, item.type, item.asset, item.amount, item.value, item.fee, item.status, item.date].join(","))].join("\n");
    download("basecola-transactions-preview.csv", body);
    setNotice("Exported the sample rows on this page. This file is not a live ledger.");
  }

  function createRow(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const assetSymbol = String(data.get("asset"));
    const amount = String(data.get("amount"));
    setRows(current => [{ id: `TXN982${330 - current.length}`, initials: "MS", name: "Mustapha Suleiman", email: "mustapha@gmail.com", type: String(data.get("type")) as AdminLedgerRow["type"], asset: assetSymbol, amount: `${amount} ${assetSymbol}`, value: Number(data.get("value")), fee: Number(data.get("fee")), status: "Pending", date: "Nov 2, 2026, 2:11 PM" }, ...current]);
    setCreating(false);
    setPage(1);
    setNotice("Added in this preview only. No customer transfer was created.");
  }

  return <section className="space-y-4">
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {ADMIN_TX_STATS.map(stat => <article key={stat.id} className={`rounded-3xl p-4 ${stat.id === "total" ? "bg-gradient-to-br from-[#6d4dff] to-[#8b5cff] text-white" : stat.id === "volume" ? "bg-[#eef0fb]" : stat.id === "completed" ? "bg-[#e7f8ef]" : stat.id === "pending" ? "bg-[#fff4e8]" : "bg-[#fdecec]"}`}><p className="text-sm opacity-80">{stat.label}</p><p className="mt-2 text-xl font-extrabold">{stat.value}</p>{stat.share ? <p className="mt-2 text-sm font-semibold">{stat.share}</p> : <p className="mt-2 text-xs font-bold text-emerald-600">↑ +{stat.change.toFixed(1)}%</p>}</article>)}
    </div>
    <div className="flex flex-wrap items-center gap-2">
      {([["all", `All Transactions (${ADMIN_TX_STATS[0].value})`], ["Completed", `Completed (${ADMIN_TX_STATS[2].value})`], ["Pending", `Pending (${ADMIN_TX_STATS[3].value})`], ["Failed", `Failed (${ADMIN_TX_STATS[4].value})`]] as const).map(([id, label]) => <button key={id} type="button" aria-pressed={tab === id} className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === id ? "bg-[#6d4dff] text-white" : "bg-white text-muted-foreground"}`} onClick={() => { setTab(id); setPage(1); }}>{label}</button>)}
      <Button type="button" variant="outline" className="ml-auto rounded-xl bg-white" onClick={() => exportRows(visible)}><Download />Export</Button>
      <Button type="button" className="rounded-xl bg-[#6d4dff] hover:bg-[#6d4dff]/90" onClick={() => setCreating(true)}><Plus />New Transaction</Button>
    </div>
    <div className="flex flex-wrap gap-2">
      <label className="relative min-w-64 flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input aria-label="Search transactions" placeholder="Search by Tx ID, user, email, wallet address..." value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} className="h-11 bg-white pl-9" /></label>
      <Filter label="Type" value={type} options={["All Types", "Buy", "Sell", "Transfer", "Invest", "Deposit", "Withdraw"]} onChange={value => { setType(value); setPage(1); }} />
      <Filter label="Asset" value={asset} options={["All Assets", "BTC", "ETH", "USDT", "USDC", "SOL", "XRP"]} onChange={value => { setAsset(value); setPage(1); }} />
      <Filter label="Status" value={status} options={["All Status", "Completed", "Pending", "Failed"]} onChange={value => { setStatus(value); setPage(1); }} />
      <Filter label="Date" value={when} options={["All Time", "Nov 1, 2026", "Oct 31, 2026"]} onChange={value => { setWhen(value); setPage(1); }} />
    </div>
    <div className="overflow-x-auto rounded-3xl bg-white shadow-sm">
      <table className="w-full min-w-[1100px] text-left text-sm">
        <thead className="text-xs text-muted-foreground"><tr>{["", "Transaction ID", "User", "Type", "Asset", "Amount", "Value (USD)", "Fee (USD)", "Status", "Date & Time", "Actions"].map(heading => <th key={heading || "check"} className="px-3 py-3 font-medium">{heading === "" ? <input aria-label="Select visible transactions" type="checkbox" checked={visible.length > 0 && selected.length === visible.length} onChange={event => setSelected(event.target.checked ? visible.map(item => item.id) : [])} /> : heading}</th>)}</tr></thead>
        <tbody>{visible.map(item => <tr key={item.id} className="border-t">
          <td className="px-3 py-3"><input aria-label={`Select ${item.id}`} type="checkbox" checked={selected.includes(item.id)} onChange={event => setSelected(current => event.target.checked ? [...current, item.id] : current.filter(id => id !== item.id))} /></td>
          <td className="px-3 py-3 font-medium">{item.id}</td>
          <td className="px-3 py-3"><span className="flex items-center gap-2"><span className={`grid h-8 w-8 place-items-center rounded-full text-xs font-bold ${AVATAR[item.initials] ?? "bg-accent text-primary"}`}>{item.initials}</span><span><span className="block font-semibold">{item.name}</span><span className="text-xs text-muted-foreground">{item.email}</span></span></span></td>
          <td className="px-3 py-3"><Pill tone={item.type === "Sell" || item.type === "Withdraw" ? "red" : item.type === "Transfer" ? "blue" : item.type === "Invest" ? "violet" : "green"}>{item.type}</Pill></td>
          <td className="px-3 py-3"><span className="inline-flex items-center gap-2"><AssetMark symbol={item.asset} />{item.asset}</span></td>
          <td className="px-3 py-3">{item.amount}</td>
          <td className="px-3 py-3">{adminMoney(item.value, 2)}</td>
          <td className="px-3 py-3">{adminMoney(item.fee, 2)}</td>
          <td className="px-3 py-3"><Pill tone={item.status === "Completed" ? "green" : item.status === "Pending" ? "amber" : "red"}>{item.status}</Pill></td>
          <td className="px-3 py-3 text-muted-foreground">{item.date}</td>
          <td className="px-3 py-3"><IconButton label={`View ${item.id}`} onClick={() => setDetail(item)}><Eye className="h-4 w-4" /></IconButton></td>
        </tr>)}{visible.length === 0 && <tr><td colSpan={11} className="px-3 py-10 text-center text-muted-foreground">{page === 1 ? "No sample transactions match these filters." : "Further pages are not included in this preview."}</td></tr>}</tbody>
      </table>
      <footer className="flex flex-wrap items-center gap-3 border-t px-3 py-3 text-sm">
        <label className="flex items-center gap-2"><input aria-label="Select all visible transactions" type="checkbox" checked={visible.length > 0 && selected.length === visible.length} onChange={event => setSelected(event.target.checked ? visible.map(item => item.id) : [])} />Select all</label>
        <Button type="button" variant="outline" className="h-9" onClick={() => selected.length ? exportRows(rows.filter(item => selected.includes(item.id))) : setNotice("Select at least one transaction.")}>Bulk actions</Button>
        <span className="ml-auto text-muted-foreground">Showing {visible.length ? `1–${visible.length}` : "0"} of {ADMIN_TX_STATS[0].value}</span>
        <Pager page={page} onPage={setPage} />
      </footer>
    </div>
    {notice && <p role="status" className="text-sm text-muted-foreground">{notice}</p>}
    <p className="text-xs text-muted-foreground">Sample ledger. A new transaction stays in this preview and does not move funds.</p>
    <Dialog open={!!detail} onOpenChange={open => { if (!open) setDetail(null); }}><DialogContent className="max-w-md rounded-3xl">{detail && <><DialogHeader><DialogTitle>{detail.id}</DialogTitle><DialogDescription>{detail.type} {detail.amount} · {detail.name}</DialogDescription></DialogHeader><dl className="space-y-2 text-sm"><Info label="Value" value={adminMoney(detail.value, 2)} /><Info label="Fee" value={adminMoney(detail.fee, 2)} /><Info label="Status" value={detail.status} /><Info label="Date" value={detail.date} /></dl></>}</DialogContent></Dialog>
    <Dialog open={creating} onOpenChange={setCreating}><DialogContent className="max-w-md rounded-3xl"><form className="space-y-4" onSubmit={createRow}><DialogHeader><DialogTitle>New Transaction</DialogTitle><DialogDescription>This sample is not sent to a customer wallet.</DialogDescription></DialogHeader><label className="block text-sm">Type<select name="type" className="mt-1 h-11 w-full rounded-md border bg-card px-3"><option>Buy</option><option>Sell</option><option>Transfer</option><option>Deposit</option><option>Withdraw</option></select></label><Field name="asset" label="Asset" defaultValue="BTC" /><Field name="amount" label="Amount" defaultValue="0.01" /><Field name="value" label="Value (USD)" defaultValue="684.20" /><Field name="fee" label="Fee (USD)" defaultValue="2.00" /><Button type="submit" className="h-11 w-full">Add to preview</Button></form></DialogContent></Dialog>
  </section>;
}

export function AssetsManagement() {
  const [assets] = useState(ADMIN_ASSETS);
  const [wallets, setWallets] = useState(PLATFORM_WALLETS);
  const [tab, setTab] = useState<"overview" | "wallets" | "addresses" | "treasury" | "reconcile">("wallets");
  const [query, setQuery] = useState("");
  const [network, setNetwork] = useState("All Networks");
  const [status, setStatus] = useState("All Status");
  const [page, setPage] = useState(1);
  const [notice, setNotice] = useState("");
  const [selected, setSelected] = useState<string | null>("BTC");
  const [checked, setChecked] = useState<string[]>([]);
  const [editing, setEditing] = useState<PlatformWallet | null>(null);
  const [creating, setCreating] = useState(false);
  const [panelKey, setPanelKey] = useState(0);
  const [addSignal, setAddSignal] = useState(0);
  const [transferSignal, setTransferSignal] = useState(0);
  const [action, setAction] = useState<null | "receive" | "send" | "treasury">(null);
  const [assetDetail, setAssetDetail] = useState<AdminAssetRow | null>(null);
  const networks = ["All Networks", ...new Set(wallets.map(wallet => wallet.network))];
  const rows = useMemo(() => wallets.filter(wallet => {
    const text = `${wallet.symbol} ${wallet.name} ${wallet.network} ${wallet.code}`.toLowerCase();
    return text.includes(query.trim().toLowerCase()) && (network === "All Networks" || wallet.network === network) && (status === "All Status" || wallet.status === status);
  }), [wallets, query, network, status]);
  const visible = page === 1 ? rows : [];
  const current = wallets.find(wallet => wallet.symbol === selected) ?? null;

  function refresh() {
    setWallets(PLATFORM_WALLETS);
    setQuery("");
    setNetwork("All Networks");
    setStatus("All Status");
    setPage(1);
    setSelected("BTC");
    setChecked([]);
    setPanelKey(value => value + 1);
    setNotice("Preview refreshed. Sample balances are unchanged.");
  }

  function saveWallet(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    const next = String(new FormData(event.currentTarget).get("status")) as PlatformWallet["status"];
    setWallets(currentWallets => currentWallets.map(wallet => wallet.symbol === editing.symbol ? { ...wallet, status: next } : wallet));
    setEditing(null);
    setNotice("Status saved in this preview only. Customer balances are unchanged.");
  }

  function createWallet(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const symbol = String(data.get("symbol")).trim().toUpperCase();
    if (!/^[A-Z0-9]{2,8}$/.test(symbol)) { setNotice("Use 2–8 letters or numbers for the symbol."); return; }
    if (wallets.some(wallet => wallet.symbol === symbol)) { setNotice("That symbol is already in the preview."); return; }
    const amount = String(data.get("amount")).trim();
    const wallet: PlatformWallet = { symbol, name: String(data.get("name")).trim(), network: String(data.get("network")).trim(), amount, unit: symbol, usd: Number(data.get("usd")), available: `${amount} ${symbol}`, locked: `0 ${symbol}`, status: "Active", code: `BASECOLA-DEMO-${symbol}-NOT-A-WALLET` };
    setWallets(currentWallets => [...currentWallets, wallet]);
    setSelected(symbol);
    setCreating(false);
    setTab("wallets");
    setPage(1);
    setNotice("Wallet added in this preview only. No deposit address was created.");
  }

  function copyCode(code: string) {
    void navigator.clipboard?.writeText(code).then(() => setNotice("Copied the preview identifier. It cannot receive a deposit."), () => setNotice(code));
  }

  return <section className="space-y-4">
    {tab === "treasury" ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <BalanceCard label="Total Treasury Balance" value={adminMoney(TREASURY_SUMMARY.total)} change={TREASURY_SUMMARY.totalChange} tone="total" icon={Landmark} />
      <BalanceCard label="Hot Wallet" value={adminMoney(TREASURY_SUMMARY.hot)} change={TREASURY_SUMMARY.hotChange} tone="treasury" icon={Layers} />
      <BalanceCard label="Cold Wallet" value={adminMoney(TREASURY_SUMMARY.cold)} change={TREASURY_SUMMARY.coldChange} tone="locked" icon={Shield} />
      <BalanceCard label="In Transit" value={adminMoney(TREASURY_SUMMARY.transit)} tone="transit" icon={RefreshCw} />
      <BalanceCard label="Treasury Allocation" value={`${TREASURY_SUMMARY.coldShare}% (Cold)`} tone="share" icon={PieChart} />
    </div> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <BalanceCard label="Total Wallet Balance" value={adminMoney(PLATFORM_SUMMARY.total)} change={PLATFORM_SUMMARY.totalChange} tone="total" icon={Wallet} />
      <BalanceCard label="Treasury Balance" value={adminMoney(PLATFORM_SUMMARY.treasury)} change={PLATFORM_SUMMARY.treasuryChange} tone="treasury" icon={Landmark} />
      <BalanceCard label="In-Order (Locked)" value={adminMoney(PLATFORM_SUMMARY.locked)} tone="locked" icon={ArrowLeftRight} />
      <BalanceCard label="Available Balance" value={adminMoney(PLATFORM_SUMMARY.available)} tone="available" icon={Layers} />
    </div>}
    <div className="flex flex-wrap items-center gap-2">
      {([["overview", "Assets Overview"], ["wallets", "Wallets"], ["addresses", "Deposit Addresses"], ["treasury", "Treasury"], ["reconcile", "Reconciliation"]] as const).map(([id, label]) => <button key={id} type="button" aria-pressed={tab === id} className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === id ? "bg-[#6d4dff] text-white" : "bg-white text-muted-foreground"}`} onClick={() => setTab(id)}>{label}</button>)}
      <Button type="button" variant="outline" className="ml-auto rounded-xl bg-white" onClick={refresh}><RefreshCw />Refresh</Button>
      <Button type="button" className="rounded-xl bg-[#6d4dff] hover:bg-[#6d4dff]/90" onClick={() => { if (tab === "addresses") setAddSignal(value => value + 1); else if (tab === "treasury") setTransferSignal(value => value + 1); else setCreating(true); }}><Plus />{tab === "addresses" ? "Add Address" : tab === "treasury" ? "Transfer Funds" : "Create Wallet"}</Button>
    </div>
    {tab === "wallets" && <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0 space-y-4">
        <div className="rounded-3xl bg-white p-4 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <h2 className="flex items-center gap-2 text-base font-bold"><Layers className="h-4 w-4 text-[#6d4dff]" />Wallets ({adminCount(rows.length)})</h2>
            <label className="relative ml-auto min-w-64 flex-1 sm:max-w-sm"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input aria-label="Search wallets" placeholder="Search wallet (currency, network, address)..." value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} className="h-11 bg-[#f7f8fc] pl-9" /></label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">{rows.map(wallet => <button key={wallet.symbol} type="button" aria-pressed={selected === wallet.symbol} className={`rounded-2xl border bg-white p-4 text-left ${selected === wallet.symbol ? "border-[#6d4dff] ring-2 ring-[#6d4dff]/20" : "border-border"}`} onClick={() => setSelected(wallet.symbol)}>
            <span className="flex items-start justify-between gap-2"><span className="flex items-center gap-2"><AssetMark symbol={wallet.symbol} /><span><span className="block font-bold">{wallet.symbol}</span><span className="text-xs text-muted-foreground">{wallet.name}</span></span></span><Pill tone={wallet.status === "Active" ? "green" : "red"}>{wallet.status}</Pill></span>
            <span className="mt-4 flex items-end justify-between"><span><span className="block text-sm font-semibold">{wallet.amount} {wallet.unit}</span><span className="text-xs text-muted-foreground">≈ {adminMoney(wallet.usd, 2)}</span></span><ChevronRight className="h-4 w-4 text-muted-foreground" /></span>
          </button>)}{rows.length === 0 && <p className="col-span-full py-8 text-center text-sm text-muted-foreground">No sample wallets match these filters.</p>}</div>
        </div>
        <div className="overflow-x-auto rounded-3xl bg-white shadow-sm">
          <div className="flex flex-wrap items-center gap-3 px-4 py-4">
            <h2 className="flex items-center gap-2 text-base font-bold"><Layers className="h-4 w-4 text-[#6d4dff]" />Wallets Management</h2>
            <span className="ml-auto flex flex-wrap gap-2"><Filter label="Network" value={network} options={networks} onChange={value => { setNetwork(value); setPage(1); }} /><Filter label="Status" value={status} options={["All Status", "Active", "Frozen"]} onChange={value => { setStatus(value); setPage(1); }} /></span>
          </div>
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="text-xs text-muted-foreground"><tr>
              <th className="px-3 py-3"><input aria-label="Select all wallets" type="checkbox" checked={visible.length > 0 && visible.every(wallet => checked.includes(wallet.symbol))} onChange={event => setChecked(event.target.checked ? visible.map(wallet => wallet.symbol) : [])} /></th>
              {["#", "Asset", "Network", "Preview identifier", "Balance", "USD Value", "Status", "Actions"].map(heading => <th key={heading} className="px-3 py-3 font-medium">{heading}</th>)}
            </tr></thead>
            <tbody>{visible.map((wallet, index) => <tr key={wallet.symbol} className={`border-t ${selected === wallet.symbol ? "bg-[#f6f3ff]" : ""}`}>
              <td className="px-3 py-3"><input aria-label={`Select ${wallet.symbol}`} type="checkbox" checked={checked.includes(wallet.symbol)} onChange={event => setChecked(currentChecked => event.target.checked ? [...currentChecked, wallet.symbol] : currentChecked.filter(symbol => symbol !== wallet.symbol))} /></td>
              <td className="px-3 py-3">{index + 1}</td>
              <td className="px-3 py-3"><span className="flex items-center gap-2"><AssetMark symbol={wallet.symbol} /><span><span className="block font-semibold">{wallet.symbol}</span><span className="text-xs text-muted-foreground">{wallet.name}</span></span></span></td>
              <td className="px-3 py-3"><span className="inline-flex items-center gap-2"><AssetMark symbol={wallet.symbol} />{wallet.network}</span></td>
              <td className="px-3 py-3 font-mono text-xs">{shortCode(wallet.code)}</td>
              <td className="px-3 py-3">{wallet.amount}</td>
              <td className="px-3 py-3">{adminMoney(wallet.usd, 2)}</td>
              <td className="px-3 py-3"><Pill tone={wallet.status === "Active" ? "green" : "red"}>{wallet.status}</Pill></td>
              <td className="px-3 py-3"><span className="flex gap-1"><IconButton label={`View ${wallet.symbol} wallet`} onClick={() => setSelected(wallet.symbol)}><Eye className="h-4 w-4" /></IconButton><IconButton label={`Edit ${wallet.symbol} wallet`} onClick={() => setEditing(wallet)}><Pencil className="h-4 w-4" /></IconButton><DropdownMenu><DropdownMenuTrigger asChild><button type="button" aria-label={`More actions for ${wallet.symbol}`} className="grid h-8 w-8 place-items-center rounded-lg text-lg leading-none text-muted-foreground hover:bg-accent">···</button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => copyCode(wallet.code)}>Copy preview identifier</DropdownMenuItem></DropdownMenuContent></DropdownMenu></span></td>
            </tr>)}{visible.length === 0 && <tr><td colSpan={9} className="px-3 py-10 text-center text-muted-foreground">{page === 1 ? "No sample wallets match these filters." : "Further pages are not included in this preview."}</td></tr>}</tbody>
          </table>
          <footer className="flex flex-wrap items-center gap-3 border-t px-3 py-3 text-sm"><span className="text-muted-foreground">Showing {visible.length ? `1–${visible.length}` : "0"} sample wallets{checked.length ? ` · ${checked.length} selected` : ""}</span><Pager page={page} onPage={setPage} /></footer>
        </div>
      </div>
      {current && <aside className="rounded-3xl bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between"><h2 className="font-bold">Wallet Details</h2><button type="button" aria-label="Close wallet details" className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent" onClick={() => setSelected(null)}><X className="h-4 w-4" /></button></div>
        <div className="mt-4 flex items-start justify-between gap-2"><span className="flex items-center gap-2"><AssetMark symbol={current.symbol} /><span><span className="block font-bold">{current.symbol} Wallet</span><span className="text-xs text-muted-foreground">{current.name} ({current.symbol})</span></span></span><Pill tone={current.status === "Active" ? "green" : "red"}>{current.status}</Pill></div>
        <div className="mt-4 rounded-2xl bg-[#f3eefe] p-4"><p className="text-xs text-muted-foreground">Total Balance</p><p className="text-lg font-extrabold">{current.amount} {current.unit}</p><p className="text-xs text-muted-foreground">≈ {adminMoney(current.usd, 2)}</p></div>
        <dl className="mt-4 space-y-3 text-sm">
          <Detail icon={Wallet} label="Available" value={current.available} />
          <Detail icon={ArrowLeftRight} label="In Order (Locked)" value={current.locked} />
          <Detail icon={Layers} label="USD Value" value={adminMoney(current.usd, 2)} />
          <Detail icon={Landmark} label="Network" value={current.network} />
          <Detail icon={Wallet} label="Preview identifier" value={current.code} />
        </dl>
        <p className="mt-3 text-xs text-muted-foreground">This identifier is not a wallet address and cannot receive a deposit.</p>
        <div className="mt-4 space-y-2">
          <Button type="button" className="h-11 w-full rounded-xl bg-[#6d4dff] hover:bg-[#6d4dff]/90" onClick={() => setAction("receive")}>Top Up / Receive</Button>
          <Button type="button" variant="outline" className="h-11 w-full rounded-xl" onClick={() => setAction("send")}>Withdraw / Send</Button>
          <Button type="button" variant="outline" className="h-11 w-full rounded-xl" onClick={() => setAction("treasury")}>Move to Treasury</Button>
        </div>
      </aside>}
    </div>}
    {tab === "overview" && <div className="overflow-x-auto rounded-3xl bg-white shadow-sm"><table className="w-full min-w-[760px] text-left text-sm"><thead className="text-xs text-muted-foreground"><tr>{["Asset", "Network", "Price (USD)", "24h", "Sample balance", "Status", ""].map(heading => <th key={heading} className="px-3 py-3 font-medium">{heading}</th>)}</tr></thead><tbody>{assets.map(asset => <tr key={asset.symbol} className="border-t"><td className="px-3 py-3"><span className="flex items-center gap-2"><AssetMark symbol={asset.symbol} /><span><span className="block font-semibold">{asset.name}</span><span className="text-xs text-muted-foreground">{asset.symbol}</span></span></span></td><td className="px-3 py-3">{asset.network}</td><td className="px-3 py-3">{adminMoney(asset.price, 2)}</td><td className="px-3 py-3"><span className={asset.change > 0 ? "font-semibold text-emerald-600" : "text-muted-foreground"}>{asset.change > 0 ? "+" : ""}{asset.change.toFixed(2)}%</span></td><td className="px-3 py-3">{adminMoney(asset.balance)}</td><td className="px-3 py-3"><Pill tone={asset.status === "Active" ? "green" : "amber"}>{asset.status}</Pill></td><td className="px-3 py-3"><IconButton label={`View ${asset.symbol}`} onClick={() => setAssetDetail(asset)}><Eye className="h-4 w-4" /></IconButton></td></tr>)}</tbody></table></div>}
    {tab === "addresses" && <DepositAddressesPanel key={`addresses-${panelKey}`} addSignal={addSignal} onNotice={setNotice} />}
    {tab === "treasury" && <TreasuryPanel key={`treasury-${panelKey}`} transferSignal={transferSignal} onNotice={setNotice} />}
    {tab === "reconcile" && <div className="overflow-x-auto rounded-3xl bg-white shadow-sm"><table className="w-full min-w-[640px] text-left text-sm"><thead className="text-xs text-muted-foreground"><tr>{["Asset", "Wallet value", "Ledger value", "Difference", "Status"].map(heading => <th key={heading} className="px-3 py-3 font-medium">{heading}</th>)}</tr></thead><tbody>{wallets.map(wallet => <tr key={wallet.symbol} className="border-t"><td className="px-3 py-3 font-semibold">{wallet.symbol}</td><td className="px-3 py-3">{adminMoney(wallet.usd, 2)}</td><td className="px-3 py-3">{adminMoney(wallet.usd, 2)}</td><td className="px-3 py-3">{adminMoney(0, 2)}</td><td className="px-3 py-3"><Pill tone="green">Matched</Pill></td></tr>)}</tbody></table><p className="px-4 py-3 text-sm text-muted-foreground">Sample reconciliation. It does not settle or move funds.</p></div>}
    {notice && <p role="status" className="text-sm text-muted-foreground">{notice}</p>}
    <Dialog open={!!assetDetail} onOpenChange={open => { if (!open) setAssetDetail(null); }}><DialogContent className="max-w-md rounded-3xl">{assetDetail && <><DialogHeader><DialogTitle>{assetDetail.name}</DialogTitle><DialogDescription>{assetDetail.symbol} · {assetDetail.network}</DialogDescription></DialogHeader><dl className="space-y-2 text-sm"><Info label="Price" value={adminMoney(assetDetail.price, 2)} /><Info label="Sample balance" value={adminMoney(assetDetail.balance)} /><Info label="Preview identifier" value={`BASECOLA-DEMO-${assetDetail.symbol}-NOT-A-WALLET`} /></dl></>}</DialogContent></Dialog>
    <Dialog open={!!editing} onOpenChange={open => { if (!open) setEditing(null); }}><DialogContent className="max-w-md rounded-3xl">{editing && <form className="space-y-4" onSubmit={saveWallet}><DialogHeader><DialogTitle>Edit {editing.symbol} wallet</DialogTitle><DialogDescription>The status stays in this preview.</DialogDescription></DialogHeader><label className="block text-sm">Status<select name="status" defaultValue={editing.status} className="mt-1 h-11 w-full rounded-md border bg-card px-3"><option>Active</option><option>Frozen</option></select></label><Button type="submit" className="h-11 w-full">Save preview</Button></form>}</DialogContent></Dialog>
    <Dialog open={creating} onOpenChange={setCreating}><DialogContent className="max-w-md rounded-3xl"><form className="space-y-4" onSubmit={createWallet}><DialogHeader><DialogTitle>Create Wallet</DialogTitle><DialogDescription>The wallet stays in this preview and does not open a deposit address.</DialogDescription></DialogHeader><Field name="symbol" label="Symbol" /><Field name="name" label="Name" /><Field name="network" label="Network" /><Field name="amount" label="Amount" defaultValue="0" /><Field name="usd" label="USD value" defaultValue="0" /><Button type="submit" className="h-11 w-full">Add to preview</Button></form></DialogContent></Dialog>
    <Dialog open={!!action} onOpenChange={open => { if (!open) setAction(null); }}><DialogContent className="max-w-md rounded-3xl">{current && action && <><DialogHeader><DialogTitle>{action === "receive" ? "Top Up / Receive" : action === "send" ? "Withdraw / Send" : "Move to Treasury"}</DialogTitle><DialogDescription>{current.symbol} Wallet · {current.amount} {current.unit}</DialogDescription></DialogHeader><p className="break-all font-mono text-xs">{current.code}</p><p className="text-sm text-muted-foreground">{action === "receive" ? "This identifier cannot receive a deposit. No funds were added." : action === "send" ? "No crypto was sent. The sample balance is unchanged." : "No funds moved to treasury. The sample balance is unchanged."}</p><Button type="button" className="h-11 w-full" onClick={() => { setAction(null); setNotice("Saved in this preview only. Customer wallets are unchanged."); }}>Done</Button></>}</DialogContent></Dialog>
  </section>;
}

function DepositAddressesPanel({ addSignal, onNotice }: { addSignal: number; onNotice: (message: string) => void }) {
  const [addresses, setAddresses] = useState(DEPOSIT_ADDRESSES);
  const [query, setQuery] = useState("");
  const [asset, setAsset] = useState("All Assets");
  const [network, setNetwork] = useState("All Networks");
  const [status, setStatus] = useState("All Status");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(DEPOSIT_ADDRESSES[0].id);
  const [checked, setChecked] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<DepositAddress | null>(null);
  const [seen, setSeen] = useState(addSignal);
  if (addSignal !== seen) { setSeen(addSignal); setAdding(true); }
  const rows = useMemo(() => addresses.filter(item => {
    const text = `${item.symbol} ${item.name} ${item.network} ${item.code}`.toLowerCase();
    return text.includes(query.trim().toLowerCase()) && (asset === "All Assets" || item.symbol === asset) && (network === "All Networks" || item.network === network) && (status === "All Status" || item.status === status);
  }), [addresses, query, asset, network, status]);
  const visible = page === 1 ? rows : [];
  const current = addresses.find(item => item.id === selectedId) ?? null;
  const assets = ["All Assets", ...new Set(addresses.map(item => item.symbol))];
  const networks = ["All Networks", ...new Set(addresses.map(item => item.network))];

  function exportRows(list: DepositAddress[]) {
    download("basecola-deposit-preview.csv", ["Asset,Name,Network,Preview identifier,Status,Created", ...list.map(item => [item.symbol, item.name, item.network, item.code, item.status, item.created].join(","))].join("\n"));
    onNotice("Exported the preview identifiers on this page. These cannot receive a deposit.");
  }

  function addAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const symbol = String(data.get("symbol")).trim().toUpperCase();
    const networkName = String(data.get("network")).trim();
    if (!/^[A-Z0-9]{2,8}$/.test(symbol)) { onNotice("Use 2–8 letters or numbers for the symbol."); return; }
    const slug = networkName.toUpperCase().replace(/[^A-Z0-9]/g, "") || symbol;
    const code = `BASECOLA-DEMO-${symbol}-${slug}-NOT-A-WALLET`;
    if (addresses.some(item => item.code === code)) { onNotice("That preview identifier is already listed."); return; }
    const next: DepositAddress = { id: code, symbol, name: String(data.get("name")).trim(), network: networkName, code, status: "Active", created: "Nov 2, 2026, 02:40 PM", minDeposit: String(data.get("min")).trim(), confirmations: Number(data.get("confirmations")) || 1, lastDeposit: "No sample deposit" };
    setAddresses(currentRows => [next, ...currentRows]);
    setSelectedId(code);
    setAdding(false);
    setPage(1);
    onNotice("Address added in this preview only. The identifier cannot receive a deposit.");
  }

  function saveAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    const data = new FormData(event.currentTarget);
    setAddresses(currentRows => currentRows.map(item => item.id === editing.id ? { ...item, minDeposit: String(data.get("min")).trim(), confirmations: Number(data.get("confirmations")) || item.confirmations } : item));
    setEditing(null);
    onNotice("Saved in this preview only. The identifier is unchanged and cannot receive a deposit.");
  }

  function runBulk(action: string) {
    const picked = addresses.filter(item => checked.includes(item.id));
    if (!picked.length) { onNotice("Select a preview address first."); return; }
    if (action === "export") { exportRows(picked); return; }
    setAddresses(currentRows => currentRows.map(item => checked.includes(item.id) ? { ...item, status: "Disabled" } : item));
    onNotice("Selected addresses disabled in this preview only.");
  }

  return <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
    <div className="min-w-0 overflow-x-auto rounded-3xl bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-3 px-4 pt-4">
        <div><h2 className="flex items-center gap-2 text-base font-bold"><Wallet className="h-4 w-4 text-[#6d4dff]" />Deposit Addresses Management</h2><p className="text-xs text-muted-foreground">View and manage preview identifiers for supported assets</p></div>
        <label className="relative ml-auto min-w-56 flex-1 sm:max-w-xs"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input aria-label="Search deposit addresses" placeholder="Search by asset, network, or address..." value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} className="h-11 bg-[#f7f8fc] pl-9" /></label>
      </div>
      <div className="flex flex-wrap gap-2 px-4 py-3">
        <Filter label="Asset" value={asset} options={assets} onChange={value => { setAsset(value); setPage(1); }} />
        <Filter label="Network" value={network} options={networks} onChange={value => { setNetwork(value); setPage(1); }} />
        <Filter label="Status" value={status} options={["All Status", "Active", "Disabled"]} onChange={value => { setStatus(value); setPage(1); }} />
        <Button type="button" variant="outline" className="ml-auto rounded-xl bg-white" onClick={() => exportRows(visible)}><Download />Export</Button>
      </div>
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="text-xs text-muted-foreground"><tr>
          <th className="px-3 py-3"><input aria-label="Select all addresses" type="checkbox" checked={visible.length > 0 && visible.every(item => checked.includes(item.id))} onChange={event => setChecked(event.target.checked ? visible.map(item => item.id) : [])} /></th>
          {["Asset", "Network", "Preview identifier", "Status", "Created", "Actions"].map(heading => <th key={heading} className="px-3 py-3 font-medium">{heading}</th>)}
        </tr></thead>
        <tbody>{visible.map(item => <tr key={item.id} className={`border-t ${selectedId === item.id ? "bg-[#f6f3ff]" : ""}`}>
          <td className="px-3 py-3"><input aria-label={`Select ${item.symbol} ${item.network}`} type="checkbox" checked={checked.includes(item.id)} onChange={event => setChecked(currentChecked => event.target.checked ? [...currentChecked, item.id] : currentChecked.filter(id => id !== item.id))} /></td>
          <td className="px-3 py-3"><span className="flex items-center gap-2"><AssetMark symbol={item.symbol} /><span><span className="block font-semibold">{item.symbol}</span><span className="text-xs text-muted-foreground">{item.name}</span></span></span></td>
          <td className="px-3 py-3"><span className="inline-flex items-center gap-2"><AssetMark symbol={networkSymbol(item.network)} />{item.network}</span></td>
          <td className="px-3 py-3 font-mono text-xs">{shortCode(item.code)}</td>
          <td className="px-3 py-3"><Pill tone={item.status === "Active" ? "green" : "red"}>{item.status}</Pill></td>
          <td className="px-3 py-3 text-xs">{item.created}</td>
          <td className="px-3 py-3"><span className="flex gap-1"><IconButton label={`View ${item.symbol} ${item.network}`} onClick={() => setSelectedId(item.id)}><Eye className="h-4 w-4" /></IconButton><IconButton label={`Edit ${item.symbol} ${item.network}`} onClick={() => setEditing(item)}><Pencil className="h-4 w-4" /></IconButton><DropdownMenu><DropdownMenuTrigger asChild><button type="button" aria-label={`More actions for ${item.symbol} ${item.network}`} className="grid h-8 w-8 place-items-center rounded-lg text-lg leading-none text-muted-foreground hover:bg-accent">···</button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => { void navigator.clipboard?.writeText(item.code).then(() => onNotice("Copied the preview identifier. It cannot receive a deposit."), () => onNotice(item.code)); }}>Copy preview identifier</DropdownMenuItem></DropdownMenuContent></DropdownMenu></span></td>
        </tr>)}{visible.length === 0 && <tr><td colSpan={7} className="px-3 py-10 text-center text-muted-foreground">{page === 1 ? "No preview addresses match these filters." : "Further pages are not included in this preview."}</td></tr>}</tbody>
      </table>
      <footer className="flex flex-wrap items-center gap-3 border-t px-3 py-3 text-sm">
        <label className="flex items-center gap-2"><input aria-label="Select all listed addresses" type="checkbox" checked={visible.length > 0 && visible.every(item => checked.includes(item.id))} onChange={event => setChecked(event.target.checked ? visible.map(item => item.id) : [])} />Select All</label>
        <select aria-label="Bulk actions" className="h-10 rounded-xl border bg-white px-3" defaultValue="" onChange={event => { const action = event.target.value; event.currentTarget.value = ""; runBulk(action); }}><option value="" disabled>Bulk Actions</option><option value="disable">Disable selected</option><option value="export">Export selected</option></select>
        <span className="ml-auto text-muted-foreground">Showing {visible.length ? `1–${visible.length}` : "0"} of {rows.length}</span>
        <Pager page={page} onPage={setPage} />
      </footer>
    </div>
    {current && <aside className="rounded-3xl bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between"><h2 className="flex items-center gap-2 font-bold"><Wallet className="h-4 w-4 text-[#6d4dff]" />Deposit Address Details</h2><button type="button" aria-label="Close address details" className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent" onClick={() => setSelectedId(null)}><X className="h-4 w-4" /></button></div>
      <div className="mt-4 flex items-start justify-between gap-2"><span className="flex items-center gap-2"><AssetMark symbol={current.symbol} /><span><span className="block font-bold">{current.symbol} Deposit Address</span><span className="text-xs text-muted-foreground">{current.name} ({current.symbol})</span></span></span><Pill tone={current.status === "Active" ? "green" : "red"}>{current.status}</Pill></div>
      <div className="relative mx-auto mt-4 w-fit rounded-2xl border bg-white p-3"><QRCodeSVG value={current.code} size={148} level="H" title={`${current.symbol} preview identifier, not a deposit address`} bgColor="#ffffff" fgColor="#1b1240" /><span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white p-0.5"><AssetMark symbol={current.symbol} /></span></div>
      <p className="mt-2 text-center text-xs text-muted-foreground">Demo QR code</p>
      <div className="mt-3 flex items-start justify-between gap-2"><div><p className="text-xs text-muted-foreground">Preview identifier</p><p className="break-all font-mono text-xs font-semibold">{current.code}</p></div><button type="button" aria-label={`Copy ${current.symbol} preview identifier`} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border" onClick={() => { void navigator.clipboard?.writeText(current.code).then(() => onNotice("Copied the preview identifier. It cannot receive a deposit."), () => onNotice(current.code)); }}><Copy className="h-4 w-4" /></button></div>
      <p className="mt-2 text-xs text-muted-foreground">This identifier is not a wallet address and cannot receive a deposit.</p>
      <dl className="mt-4 space-y-3 text-sm">
        <Detail icon={Landmark} label="Network" value={current.network} />
        <Detail icon={Wallet} label="Min Deposit" value={current.minDeposit} />
        <Detail icon={Shield} label="Confirmations Required" value={String(current.confirmations)} />
        <Detail icon={Check} label="Status" value={current.status} />
        <Detail icon={Clock} label="Created" value={current.created} />
        <Detail icon={Clock} label="Last Deposit" value={current.lastDeposit} />
      </dl>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={() => setEditing(current)}><Pencil />Edit Address</Button>
        <Button type="button" variant="outline" className="h-11 rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-600" onClick={() => { setAddresses(currentRows => currentRows.map(item => item.id === current.id ? { ...item, status: item.status === "Active" ? "Disabled" : "Active" } : item)); onNotice("Status saved in this preview only. No deposits were changed."); }}>{current.status === "Active" ? "Disable Address" : "Enable Address"}</Button>
      </div>
    </aside>}
    <Dialog open={adding} onOpenChange={setAdding}><DialogContent className="max-w-md rounded-3xl"><form className="space-y-4" onSubmit={addAddress}><DialogHeader><DialogTitle>Add Address</DialogTitle><DialogDescription>The new row uses a preview identifier and does not open a deposit address.</DialogDescription></DialogHeader><Field name="symbol" label="Symbol" /><Field name="name" label="Name" /><Field name="network" label="Network" /><Field name="min" label="Minimum deposit" defaultValue="0" /><Field name="confirmations" label="Confirmations" defaultValue="1" /><Button type="submit" className="h-11 w-full">Add to preview</Button></form></DialogContent></Dialog>
    <Dialog open={!!editing} onOpenChange={open => { if (!open) setEditing(null); }}><DialogContent className="max-w-md rounded-3xl">{editing && <form key={editing.id} className="space-y-4" onSubmit={saveAddress}><DialogHeader><DialogTitle>Edit {editing.symbol} address</DialogTitle><DialogDescription>The preview identifier stays the same.</DialogDescription></DialogHeader><p className="break-all font-mono text-xs">{editing.code}</p><Field name="min" label="Minimum deposit" defaultValue={editing.minDeposit} /><Field name="confirmations" label="Confirmations" defaultValue={String(editing.confirmations)} /><Button type="submit" className="h-11 w-full">Save preview</Button></form>}</DialogContent></Dialog>
  </div>;
}

function TreasuryPanel({ transferSignal, onNotice }: { transferSignal: number; onNotice: (message: string) => void }) {
  const [holdings, setHoldings] = useState(TREASURY_HOLDINGS);
  const [activity, setActivity] = useState(TREASURY_ACTIVITY);
  const [activityTab, setActivityTab] = useState<"All Activities" | "Transfers" | "Rebalances" | "Top Up" | "Withdrawals">("All Activities");
  const [mode, setMode] = useState<string | null>(null);
  const [preset, setPreset] = useState("BTC");
  const [editing, setEditing] = useState<TreasuryHolding | null>(null);
  const [seen, setSeen] = useState(transferSignal);
  if (transferSignal !== seen) { setSeen(transferSignal); setMode("Transfer Funds"); }
  const activityRows = activity.filter(item => activityTab === "All Activities" || (activityTab === "Transfers" && item.type === "Transfer") || (activityTab === "Rebalances" && item.type === "Rebalance") || (activityTab === "Top Up" && item.type === "Top Up") || (activityTab === "Withdrawals" && item.type === "Withdrawal"));
  const route = treasuryRoute(mode);

  function recordMove(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!mode) return;
    const data = new FormData(event.currentTarget);
    const next: TreasuryActivity = { id: `preview-${activity.length + 1}`, type: route.type, symbol: String(data.get("asset")), amount: String(data.get("amount")).trim(), from: String(data.get("from")), to: String(data.get("to")), status: "Completed", date: "Nov 2, 2026, 02:40 PM" };
    setActivity(currentRows => [next, ...currentRows]);
    setMode(null);
    onNotice("Recorded in this preview only. No funds moved and customer balances are unchanged.");
  }

  function saveAllocation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    const value = String(new FormData(event.currentTarget).get("allocation")).trim().replace("%", "");
    setHoldings(currentRows => currentRows.map(item => item.symbol === editing.symbol ? { ...item, allocation: `${value}%` } : item));
    setEditing(null);
    onNotice("Allocation saved in this preview only. Treasury balances are unchanged.");
  }

  return <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
    <div className="min-w-0 space-y-4">
      <div className="overflow-x-auto rounded-3xl bg-white shadow-sm">
        <div className="px-4 py-4"><h2 className="flex items-center gap-2 text-base font-bold"><Landmark className="h-4 w-4 text-[#6d4dff]" />Treasury Management</h2><p className="text-xs text-muted-foreground">Control platform liquidity, wallet reserves, and fund movements</p></div>
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="text-xs text-muted-foreground"><tr>{["", "Asset", "Total Balance", "Hot Wallet", "Cold Wallet", "Allocation", "Status", "Actions"].map(heading => <th key={heading || "select"} className="px-3 py-3 font-medium">{heading}</th>)}</tr></thead>
          <tbody>{holdings.map(item => <tr key={item.symbol} className="border-t">
            <td className="px-3 py-3"><input aria-label={`Select ${item.symbol} treasury`} type="checkbox" /></td>
            <td className="px-3 py-3"><span className="flex items-center gap-2"><AssetMark symbol={item.symbol} /><span><span className="block font-semibold">{item.symbol}</span><span className="text-xs text-muted-foreground">{item.name}</span></span></span></td>
            <td className="px-3 py-3">{item.total}</td>
            <td className="px-3 py-3">{item.hot}</td>
            <td className="px-3 py-3">{item.cold}</td>
            <td className="px-3 py-3"><Pill tone="violet">{item.allocation}</Pill></td>
            <td className="px-3 py-3"><Pill tone={item.status === "Active" ? "green" : "amber"}>{item.status}</Pill></td>
            <td className="px-3 py-3"><span className="flex gap-1"><IconButton label={`Transfer ${item.symbol}`} onClick={() => { setPreset(item.symbol); setMode("Transfer Funds"); }}><ArrowLeftRight className="h-4 w-4" /></IconButton><IconButton label={`Edit ${item.symbol} allocation`} onClick={() => setEditing(item)}><Pencil className="h-4 w-4" /></IconButton><DropdownMenu><DropdownMenuTrigger asChild><button type="button" aria-label={`More actions for ${item.symbol} treasury`} className="grid h-8 w-8 place-items-center rounded-lg text-lg leading-none text-muted-foreground hover:bg-accent">···</button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => { setHoldings(currentRows => currentRows.map(row => row.symbol === item.symbol ? { ...row, status: row.status === "Active" ? "Paused" : "Active" } : row)); onNotice("Status saved in this preview only. Treasury balances are unchanged."); }}>Toggle status in preview</DropdownMenuItem></DropdownMenuContent></DropdownMenu></span></td>
          </tr>)}</tbody>
        </table>
      </div>
      <div className="overflow-x-auto rounded-3xl bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-2 px-4 py-4">
          <h2 className="mr-2 flex items-center gap-2 text-base font-bold"><Layers className="h-4 w-4 text-[#6d4dff]" />Treasury Activity</h2>
          {(["All Activities", "Transfers", "Rebalances", "Top Up", "Withdrawals"] as const).map(label => <button key={label} type="button" aria-pressed={activityTab === label} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${activityTab === label ? "bg-[#6d4dff] text-white" : "bg-[#f4f5fb] text-muted-foreground"}`} onClick={() => setActivityTab(label)}>{label}</button>)}
        </div>
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="text-xs text-muted-foreground"><tr>{["", "#", "Type", "Asset", "Amount", "From", "To", "Status", "Date & Time"].map(heading => <th key={heading || "select"} className="px-3 py-3 font-medium">{heading}</th>)}</tr></thead>
          <tbody>{activityRows.map((item, index) => <tr key={item.id} className="border-t">
            <td className="px-3 py-3"><input aria-label={`Select activity ${item.id}`} type="checkbox" /></td>
            <td className="px-3 py-3">{index + 1}</td>
            <td className="px-3 py-3"><span className="inline-flex items-center gap-2">{activityIcon(item.type)}{item.type}</span></td>
            <td className="px-3 py-3"><span className="inline-flex items-center gap-2"><AssetMark symbol={item.symbol} />{item.symbol}</span></td>
            <td className="px-3 py-3">{item.amount}</td>
            <td className="px-3 py-3">{item.from}</td>
            <td className="px-3 py-3">{item.to}</td>
            <td className="px-3 py-3"><Pill tone="green">{item.status}</Pill></td>
            <td className="px-3 py-3 text-xs">{item.date}</td>
          </tr>)}{activityRows.length === 0 && <tr><td colSpan={9} className="px-3 py-8 text-center text-muted-foreground">No sample activity in this view.</td></tr>}</tbody>
        </table>
        <p className="px-4 py-3 text-xs text-muted-foreground">Sample activity. Recording a movement does not move funds.</p>
      </div>
    </div>
    <aside className="space-y-4">
      <div className="rounded-3xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 flex items-center gap-2 font-bold"><ArrowLeftRight className="h-4 w-4 text-[#6d4dff]" />Treasury Actions</h2>
        <div className="grid grid-cols-3 gap-2">
          {TREASURY_ACTIONS.map(action => <button key={action.label} type="button" className={`rounded-2xl px-2 py-3 text-center text-xs font-semibold ${action.className}`} onClick={() => setMode(action.label)}><action.icon className="mx-auto mb-2 h-5 w-5" />{action.label}</button>)}
        </div>
      </div>
      <div className="rounded-3xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 flex items-center gap-2 font-bold"><PieChart className="h-4 w-4 text-[#6d4dff]" />Treasury Allocation</h2>
        <div className="flex items-center gap-3">
          <AllocationDonut />
          <ul className="space-y-2 text-xs">{[{ label: "Cold Wallet", share: TREASURY_SUMMARY.coldShare, value: TREASURY_SUMMARY.coldAllocation, color: "bg-[#6d4dff]" }, { label: "Hot Wallet", share: TREASURY_SUMMARY.hotShare, value: TREASURY_SUMMARY.hotAllocation, color: "bg-[#d8ccff]" }, { label: "In Transit", share: TREASURY_SUMMARY.transitShare, value: TREASURY_SUMMARY.transit, color: "bg-[#f6d7b8]" }].map(item => <li key={item.label} className="flex items-start gap-2"><span className={`mt-1 h-2.5 w-2.5 rounded-sm ${item.color}`} /><span><span className="block font-semibold">{item.label} {item.share}%</span><span className="text-muted-foreground">{adminMoney(item.value)}</span></span></li>)}</ul>
        </div>
      </div>
      <div className="rounded-3xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 flex items-center gap-2 font-bold"><Shield className="h-4 w-4 text-[#6d4dff]" />Liquidity & Risk</h2>
        <ul className="space-y-3 text-sm">
          <li className="flex items-center justify-between gap-2"><span className="text-muted-foreground">Platform Liquidity (Hot)</span><span className="font-semibold">{adminMoney(TREASURY_SUMMARY.hot)}</span></li>
          <li className="flex justify-end text-xs font-semibold text-emerald-600"><Check className="mr-1 h-3.5 w-3.5" />Healthy</li>
          <li className="flex items-center justify-between gap-2"><span className="text-muted-foreground">Reserve Ratio</span><span className="font-semibold">{TREASURY_SUMMARY.coldShare}.0%</span></li>
          <li className="flex justify-end text-xs font-semibold text-emerald-600"><Check className="mr-1 h-3.5 w-3.5" />Within Range</li>
          <li className="flex items-center justify-between gap-2"><span className="text-muted-foreground">Daily Net Flow</span><span className="font-semibold text-emerald-600">+{adminMoney(TREASURY_SUMMARY.dailyFlow)}</span></li>
          <li className="flex justify-end text-xs font-semibold text-emerald-600"><ArrowUpRight className="mr-1 h-3.5 w-3.5" />Inflow</li>
        </ul>
      </div>
    </aside>
    <Dialog open={!!mode} onOpenChange={open => { if (!open) setMode(null); }}><DialogContent className="max-w-md rounded-3xl">{mode && <form key={`${mode}-${preset}`} className="space-y-4" onSubmit={recordMove}><DialogHeader><DialogTitle>{mode}</DialogTitle><DialogDescription>This record stays in the preview. No funds move.</DialogDescription></DialogHeader><label className="block text-sm">Asset<select name="asset" defaultValue={preset} className="mt-1 h-11 w-full rounded-md border bg-card px-3">{holdings.map(item => <option key={item.symbol}>{item.symbol}</option>)}</select></label><Field name="amount" label="Amount" defaultValue="0" /><label className="block text-sm">From<select name="from" defaultValue={route.from} className="mt-1 h-11 w-full rounded-md border bg-card px-3">{["Hot Wallet", "Cold Wallet", "Treasury", "External"].map(place => <option key={place}>{place}</option>)}</select></label><label className="block text-sm">To<select name="to" defaultValue={route.to} className="mt-1 h-11 w-full rounded-md border bg-card px-3">{["Hot Wallet", "Cold Wallet", "Treasury", "External"].map(place => <option key={place}>{place}</option>)}</select></label><Button type="submit" className="h-11 w-full">Save preview</Button></form>}</DialogContent></Dialog>
    <Dialog open={!!editing} onOpenChange={open => { if (!open) setEditing(null); }}><DialogContent className="max-w-md rounded-3xl">{editing && <form key={editing.symbol} className="space-y-4" onSubmit={saveAllocation}><DialogHeader><DialogTitle>Edit {editing.symbol} allocation</DialogTitle><DialogDescription>The percentage stays in this preview.</DialogDescription></DialogHeader><Field name="allocation" label="Cold allocation (%)" defaultValue={editing.allocation.replace("%", "")} /><Button type="submit" className="h-11 w-full">Save preview</Button></form>}</DialogContent></Dialog>
  </div>;
}

const TREASURY_ACTIONS = [
  { label: "Transfer Funds", icon: ArrowLeftRight, className: "bg-[#f3eefe] text-[#6d4dff]" },
  { label: "Rebalance", icon: Scale, className: "bg-[#e7f8ef] text-emerald-600" },
  { label: "Move to Cold Storage", icon: Lock, className: "bg-[#fff4e8] text-amber-700" },
  { label: "Move to Hot Wallet", icon: Flame, className: "bg-[#fdecec] text-rose-500" },
  { label: "Top Up Treasury", icon: Plus, className: "bg-[#eef0fb] text-indigo-500" },
  { label: "Withdraw from Treasury", icon: ArrowUpRight, className: "bg-[#f6f0ff] text-violet-600" },
] as const;

function treasuryRoute(mode: string | null) {
  if (mode === "Rebalance") return { from: "Treasury", to: "Cold Wallet", type: "Rebalance" as const };
  if (mode === "Move to Hot Wallet") return { from: "Cold Wallet", to: "Hot Wallet", type: "Transfer" as const };
  if (mode === "Top Up Treasury") return { from: "External", to: "Treasury", type: "Top Up" as const };
  if (mode === "Withdraw from Treasury") return { from: "Treasury", to: "External", type: "Withdrawal" as const };
  return { from: "Hot Wallet", to: "Cold Wallet", type: "Transfer" as const };
}

function activityIcon(type: TreasuryActivity["type"]) {
  if (type === "Rebalance") return <Scale className="h-4 w-4 text-[#6d4dff]" />;
  if (type === "Top Up") return <ArrowDownLeft className="h-4 w-4 text-emerald-600" />;
  if (type === "Withdrawal") return <ArrowUpRight className="h-4 w-4 text-rose-500" />;
  return <ArrowLeftRight className="h-4 w-4 text-[#6d4dff]" />;
}

function AllocationDonut() {
  const radius = 46;
  const circ = 2 * Math.PI * radius;
  const parts = [{ share: TREASURY_SUMMARY.coldShare, color: "#6d4dff" }, { share: TREASURY_SUMMARY.hotShare, color: "#d8ccff" }, { share: TREASURY_SUMMARY.transitShare, color: "#f6d7b8" }];
  return <div className="relative h-32 w-32 shrink-0"><svg viewBox="0 0 120 120" className="h-full w-full">{parts.map((part, index) => { const start = parts.slice(0, index).reduce((sum, item) => sum + item.share, 0); const length = (part.share / 100) * circ; return <circle key={part.color} cx="60" cy="60" r={radius} fill="none" stroke={part.color} strokeWidth="14" strokeDasharray={`${length} ${circ - length}`} strokeDashoffset={-((start / 100) * circ)} transform="rotate(-90 60 60)" />; })}</svg><div className="absolute inset-0 flex flex-col items-center justify-center text-center"><span className="text-[11px] font-extrabold">{adminMoney(TREASURY_SUMMARY.total)}</span><span className="text-[10px] text-muted-foreground">Total</span></div></div>;
}

function networkSymbol(network: string) {
  if (network === "Bitcoin") return "BTC";
  if (network === "Ethereum" || network === "ERC20") return "ETH";
  if (network === "TRC20") return "USDT";
  if (network === "Solana") return "SOL";
  if (network === "XRP Ledger") return "XRP";
  return "USDC";
}

function BalanceCard({ label, value, change, tone, icon: Icon }: { label: string; value: string; change?: number; tone: "total" | "treasury" | "locked" | "available" | "transit" | "share"; icon: typeof Wallet }) {
  const toneClass = { total: "bg-gradient-to-br from-[#7c4dff] to-[#9a6dff] text-white", treasury: "bg-[#eef0fb]", locked: "bg-[#fff4e8]", available: "bg-[#f3eefe]", transit: "bg-white", share: "bg-[#f7f3ff]" }[tone];
  return <article className={`rounded-3xl p-5 ${toneClass}`}><span className="flex items-center gap-2 text-sm font-medium opacity-80"><Icon className="h-4 w-4" />{label}</span><p className="mt-3 text-2xl font-extrabold">{value}</p>{change != null && <p className={`mt-3 inline-flex rounded-full px-2 py-1 text-xs font-bold ${tone === "total" ? "bg-white/20" : "bg-emerald-100 text-emerald-700"}`}>↑ +{change.toFixed(1)}%</p>}</article>;
}

function Detail({ icon: Icon, label, value }: { icon: typeof Wallet; label: string; value: string }) {
  return <div className="flex items-start justify-between gap-3"><dt className="flex items-center gap-2 text-muted-foreground"><Icon className="h-4 w-4 shrink-0" />{label}</dt><dd className="max-w-[58%] break-all text-right font-semibold">{value}</dd></div>;
}

function shortCode(code: string) {
  return `${code.slice(0, 11)}…${code.slice(-13)}`;
}

function Metric({ label, value, change, tone, icon: Icon }: { label: string; value: string; change: number; tone: string; icon: typeof Users }) {
  const toneClass = tone === "total" ? "bg-gradient-to-br from-[#6d4dff] to-[#8b5cff] text-white" : tone === "verified" ? "bg-[#eef0fb]" : tone === "pending" ? "bg-[#fff4e8]" : "bg-[#fdecec]";
  const up = change > 0;
  return <article className={`rounded-3xl p-5 ${toneClass}`}><span className="flex items-center gap-2 text-sm opacity-80"><Icon className="h-4 w-4" />{label}</span><p className="mt-2 text-2xl font-extrabold">{value}</p><p className={`mt-3 inline-flex rounded-full px-2 py-1 text-xs font-bold ${tone === "total" ? "bg-white/20" : up ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>{up ? "↑" : "↓"} {up ? "+" : ""}{change.toFixed(1)}%</p></article>;
}

function Filter({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return <label className="flex h-11 items-center gap-2 rounded-xl border bg-white px-3 text-sm"><span className="text-muted-foreground">{label}</span><select aria-label={label} value={value} onChange={event => onChange(event.target.value)} className="bg-transparent outline-none">{options.map(option => <option key={option}>{option}</option>)}</select></label>;
}

function Pill({ children, tone }: { children: string; tone: "green" | "amber" | "red" | "blue" | "violet" }) {
  const toneClass = { green: "bg-emerald-100 text-emerald-700", amber: "bg-amber-100 text-amber-700", red: "bg-red-100 text-red-600", blue: "bg-sky-100 text-sky-700", violet: "bg-violet-100 text-violet-700" }[tone];
  return <span className={`rounded-full px-2 py-1 text-xs font-semibold ${toneClass}`}>{children}</span>;
}

function Pager({ page, onPage }: { page: number; onPage: (page: number) => void }) {
  return <span className="flex items-center gap-1"><button type="button" aria-label="Previous page" className="grid h-8 w-8 place-items-center rounded-lg border bg-white" onClick={() => onPage(Math.max(1, page - 1))}><ChevronLeft className="h-4 w-4" /></button>{[1, 2, 3].map(number => <button key={number} type="button" aria-current={page === number ? "page" : undefined} className={`grid h-8 w-8 place-items-center rounded-lg text-sm font-semibold ${page === number ? "bg-[#6d4dff] text-white" : "bg-white"}`} onClick={() => onPage(number)}>{number}</button>)}<button type="button" aria-label="Next page" className="grid h-8 w-8 place-items-center rounded-lg border bg-white" onClick={() => onPage(page + 1)}><ChevronRight className="h-4 w-4" /></button></span>;
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" aria-label={label} className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent" onClick={onClick}>{children}</button>;
}

function Field({ name, label, defaultValue = "", type = "text" }: { name: string; label: string; defaultValue?: string; type?: string }) {
  return <div className="space-y-2"><Label htmlFor={`manage-${name}`}>{label}</Label><Input id={`manage-${name}`} name={name} type={type} required defaultValue={defaultValue} className="h-11 bg-card" /></div>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-3"><dt className="text-muted-foreground">{label}</dt><dd className="font-semibold">{value}</dd></div>;
}

function AssetMark({ symbol }: { symbol: string }) {
  const coin = COINS.find(item => item.sym === symbol);
  if (!coin) return <span className="grid h-6 w-6 place-items-center rounded-full bg-sky-500 text-[10px] font-bold text-white">$</span>;
  return <CoinIcon coin={coin} size="h-6 w-6" />;
}

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map(part => part[0]?.toUpperCase() ?? "").join("") || "NA";
}

function download(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function TradeManagement() {
  const [orders, setOrders] = useState(OTC_ORDERS);
  const [rates, setRates] = useState(OTC_RATES);
  const [limits, setLimits] = useState(OTC_LIMITS);
  const [tab, setTab] = useState<"orders" | "pricing" | "liquidity" | "settings" | "limits">("orders");
  const [query, setQuery] = useState("");
  const [type, setType] = useState("All Types");
  const [asset, setAsset] = useState("All Assets");
  const [status, setStatus] = useState("All Status");
  const [page, setPage] = useState(1);
  const [checked, setChecked] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const [detail, setDetail] = useState<OtcOrder | null>(null);
  const [editing, setEditing] = useState<OtcOrder | null>(null);
  const [creating, setCreating] = useState(false);
  const [editingRates, setEditingRates] = useState(false);
  const [buyOn, setBuyOn] = useState(true);
  const [sellOn, setSellOn] = useState(true);
  const [autoApprove, setAutoApprove] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(true);
  const rows = useMemo(() => orders.filter(order => {
    const text = `${order.id} ${order.user} ${order.asset}`.toLowerCase();
    return text.includes(query.trim().toLowerCase()) && (type === "All Types" || order.type === type) && (asset === "All Assets" || order.asset === asset) && (status === "All Status" || order.status === status);
  }), [orders, query, type, asset, status]);
  const visible = page === 1 ? rows : [];
  const unfiltered = !query.trim() && type === "All Types" && asset === "All Assets" && status === "All Status";

  function exportOrders(list: OtcOrder[]) {
    download("basecola-otc-preview.csv", ["Order,User,Type,Asset,Crypto,USD,Rate,Status,Created", ...list.map(order => [order.id, order.user, order.type, order.asset, order.crypto, order.usd, order.rate, order.status, order.created].join(","))].join("\n"));
    setNotice("Exported the sample orders on this page. This file is not a trade report.");
  }

  function runBulk(action: string) {
    const picked = orders.filter(order => checked.includes(order.id));
    if (!picked.length) { setNotice("Select a sample order first."); return; }
    if (action === "export") { exportOrders(picked); return; }
    setOrders(current => current.map(order => checked.includes(order.id) ? { ...order, status: "Cancelled" } : order));
    setNotice("Selected orders cancelled in this preview only. No customer trade was changed.");
  }

  function saveStatus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    const next = String(new FormData(event.currentTarget).get("status")) as OtcOrder["status"];
    setOrders(current => current.map(order => order.id === editing.id ? { ...order, status: next } : order));
    setEditing(null);
    setNotice("Status saved in this preview only. No customer trade was changed.");
  }

  function createOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const orderType = String(data.get("type")) as OtcOrder["type"];
    if (orderType === "Buy" && !buyOn) { setNotice("Buy is off in this preview."); return; }
    if (orderType === "Sell" && !sellOn) { setNotice("Sell is off in this preview."); return; }
    const crypto = String(data.get("crypto")).trim();
    const rate = Number(data.get("rate"));
    const units = Number(crypto.replace(/,/g, ""));
    if (!Number.isFinite(units) || units <= 0 || !Number.isFinite(rate) || rate <= 0) { setNotice("Enter a crypto amount and a rate above zero."); return; }
    const user = String(data.get("user")).trim();
    const next: OtcOrder = { id: `OTC${982341 + orders.length - OTC_ORDERS.length}`, initials: initials(user), user, type: orderType, asset: String(data.get("asset")), crypto, usd: Math.round(units * rate * 100) / 100, rate, status: autoApprove && units * rate <= 100 ? "Completed" : "Processing", created: "Nov 2, 02:40 PM" };
    setOrders(current => [next, ...current]);
    setCreating(false);
    setTab("orders");
    setPage(1);
    setNotice("Order added in this preview only. No trade was placed and customer balances are unchanged.");
  }

  function saveRates(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setRates(current => current.map(rate => {
      const buy = Number(data.get(`${rate.symbol}-buy`));
      const sell = Number(data.get(`${rate.symbol}-sell`));
      const mid = (buy + sell) / 2;
      return { ...rate, buy, sell, spread: mid ? `${(Math.abs(buy - sell) / mid * 100).toFixed(2)}%` : rate.spread };
    }));
    setEditingRates(false);
    setNotice("Rates saved in this preview only. Customer buy and sell prices are unchanged.");
  }

  function saveLimits(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setLimits(current => current.map(item => ({ ...item, min: String(data.get(`${item.symbol}-min`)), max: String(data.get(`${item.symbol}-max`)) })));
    setNotice("Limits saved in this preview only. Customer orders are unchanged.");
  }

  return <section className="space-y-4">
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <BalanceCard label="Total Orders" value={adminCount(OTC_SUMMARY.orders)} change={OTC_SUMMARY.ordersChange} tone="total" icon={ArrowLeftRight} />
      <BalanceCard label="Buy Orders" value={adminCount(OTC_SUMMARY.buys)} change={OTC_SUMMARY.buysChange} tone="treasury" icon={ShoppingCart} />
      <BalanceCard label="Sell Orders" value={adminCount(OTC_SUMMARY.sells)} change={OTC_SUMMARY.sellsChange} tone="locked" icon={ShoppingCart} />
      <BalanceCard label="Total Volume (USD)" value={adminMoney(OTC_SUMMARY.volume)} change={OTC_SUMMARY.volumeChange} tone="treasury" icon={Coins} />
      <BalanceCard label="Platform Profit (USD)" value={adminMoney(OTC_SUMMARY.profit)} change={OTC_SUMMARY.profitChange} tone="share" icon={Layers} />
    </div>
    <div className="flex flex-wrap items-center gap-2">
      {([["orders", "Orders Management"], ["pricing", "Pricing & Rates"], ["liquidity", "Liquidity"], ["settings", "Order Settings"], ["limits", "OTC Limits"]] as const).map(([id, label]) => <button key={id} type="button" aria-pressed={tab === id} className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === id ? "bg-[#6d4dff] text-white" : "bg-white text-muted-foreground"}`} onClick={() => setTab(id)}>{label}</button>)}
      <Button type="button" variant="outline" className="ml-auto rounded-xl bg-white" onClick={() => exportOrders(visible)}><Download />Export</Button>
      <Button type="button" className="rounded-xl bg-[#6d4dff] hover:bg-[#6d4dff]/90" onClick={() => setCreating(true)}><Plus />Create OTC Order</Button>
    </div>
    {(tab === "orders" || tab === "pricing") && <div className={tab === "orders" ? "grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_300px]" : ""}>
      {tab === "orders" && <div className="min-w-0 overflow-x-auto rounded-3xl bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-3 px-4 pt-4">
          <h2 className="flex items-center gap-2 text-base font-bold"><ArrowLeftRight className="h-4 w-4 text-[#6d4dff]" />Buy & Sell Orders ({adminCount(OTC_SUMMARY.orders)})</h2>
          <label className="relative ml-auto min-w-56 flex-1 sm:max-w-xs"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input aria-label="Search OTC orders" placeholder="Search by Order ID, user, or TX ref..." value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} className="h-11 bg-[#f7f8fc] pl-9" /></label>
        </div>
        <div className="flex flex-wrap gap-2 px-4 py-3">
          <Filter label="Type" value={type} options={["All Types", "Buy", "Sell"]} onChange={value => { setType(value); setPage(1); }} />
          <Filter label="Asset" value={asset} options={["All Assets", ...new Set(orders.map(order => order.asset))]} onChange={value => { setAsset(value); setPage(1); }} />
          <Filter label="Status" value={status} options={["All Status", "Completed", "Processing", "Cancelled"]} onChange={value => { setStatus(value); setPage(1); }} />
        </div>
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="text-xs text-muted-foreground"><tr>
            <th className="px-3 py-3"><input aria-label="Select all orders" type="checkbox" checked={visible.length > 0 && visible.every(order => checked.includes(order.id))} onChange={event => setChecked(event.target.checked ? visible.map(order => order.id) : [])} /></th>
            {["Order ID", "User", "Type", "Asset", "Amount (Crypto)", "Amount (USD)", "Rate (USD)", "Status", "Created", "Actions"].map(heading => <th key={heading} className="px-3 py-3 font-medium">{heading}</th>)}
          </tr></thead>
          <tbody>{visible.map(order => <tr key={order.id} className="border-t">
            <td className="px-3 py-3"><input aria-label={`Select ${order.id}`} type="checkbox" checked={checked.includes(order.id)} onChange={event => setChecked(current => event.target.checked ? [...current, order.id] : current.filter(id => id !== order.id))} /></td>
            <td className="px-3 py-3 font-medium">{order.id}</td>
            <td className="px-3 py-3"><span className="flex items-center gap-2"><span className={`grid h-8 w-8 place-items-center rounded-full text-xs font-bold ${AVATAR[order.initials] ?? "bg-slate-100"}`}>{order.initials}</span>{order.user}</span></td>
            <td className="px-3 py-3"><Pill tone={order.type === "Buy" ? "green" : "red"}>{order.type}</Pill></td>
            <td className="px-3 py-3"><span className="inline-flex items-center gap-2"><AssetMark symbol={order.asset} />{order.asset}</span></td>
            <td className="px-3 py-3">{order.crypto}</td>
            <td className="px-3 py-3">{adminMoney(order.usd, 2)}</td>
            <td className="px-3 py-3">{adminMoney(order.rate, 2)}</td>
            <td className="px-3 py-3"><Pill tone={order.status === "Completed" ? "green" : order.status === "Processing" ? "amber" : "red"}>{order.status}</Pill></td>
            <td className="px-3 py-3 text-xs">{order.created}</td>
            <td className="px-3 py-3"><span className="flex gap-1"><IconButton label={`View ${order.id}`} onClick={() => setDetail(order)}><Eye className="h-4 w-4" /></IconButton><IconButton label={`Edit ${order.id}`} onClick={() => setEditing(order)}><Pencil className="h-4 w-4" /></IconButton><DropdownMenu><DropdownMenuTrigger asChild><button type="button" aria-label={`More actions for ${order.id}`} className="grid h-8 w-8 place-items-center rounded-lg text-lg leading-none text-muted-foreground hover:bg-accent">···</button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => { setOrders(current => current.map(item => item.id === order.id ? { ...item, status: "Cancelled" } : item)); setNotice("Order cancelled in this preview only. No customer trade was changed."); }}>Cancel in preview</DropdownMenuItem></DropdownMenuContent></DropdownMenu></span></td>
          </tr>)}{visible.length === 0 && <tr><td colSpan={11} className="px-3 py-10 text-center text-muted-foreground">{page === 1 ? "No sample orders match these filters." : "Further pages are not included in this preview."}</td></tr>}</tbody>
        </table>
        <footer className="flex flex-wrap items-center gap-3 border-t px-3 py-3 text-sm">
          <label className="flex items-center gap-2"><input aria-label="Select all listed orders" type="checkbox" checked={visible.length > 0 && visible.every(order => checked.includes(order.id))} onChange={event => setChecked(event.target.checked ? visible.map(order => order.id) : [])} />Select All</label>
          <select aria-label="Bulk actions" className="h-10 rounded-xl border bg-white px-3" defaultValue="" onChange={event => { const action = event.target.value; event.currentTarget.value = ""; runBulk(action); }}><option value="" disabled>Bulk Actions</option><option value="cancel">Cancel selected</option><option value="export">Export selected</option></select>
          <span className="ml-auto text-muted-foreground">Showing {page === 1 && unfiltered ? `1–${visible.length} of ${adminCount(OTC_SUMMARY.orders)}` : visible.length ? `1–${visible.length} sample orders` : "0 sample orders"}</span>
          <Pager page={page} onPage={setPage} />
        </footer>
      </div>}
      <div className={tab === "orders" ? "space-y-4" : ""}>
        {tab === "orders" && <div className="rounded-3xl bg-white p-4 shadow-sm">
          <button type="button" className="flex w-full items-center justify-between font-bold" onClick={() => setSettingsOpen(open => !open)}><span className="flex items-center gap-2"><Settings className="h-4 w-4 text-[#6d4dff]" />Buy/Sell Settings</span><ChevronDown className={`h-4 w-4 transition ${settingsOpen ? "" : "-rotate-90"}`} /></button>
          {settingsOpen && <div className="mt-2">
            <ToggleRow label="Enable Buy" checked={buyOn} onChange={value => { setBuyOn(value); setNotice("Buy setting saved in this preview only."); }} />
            <ToggleRow label="Enable Sell" checked={sellOn} onChange={value => { setSellOn(value); setNotice("Sell setting saved in this preview only."); }} />
            <ToggleRow label="Auto-Approve (Small Orders)" checked={autoApprove} onChange={value => { setAutoApprove(value); setNotice("Auto-approve saved in this preview only. No order was approved."); }} />
            <button type="button" className="flex w-full items-center justify-between py-2 text-sm font-medium" onClick={() => setTab("limits")}><span className="flex items-center gap-2"><Layers className="h-4 w-4 text-muted-foreground" />OTC Order Limits</span><ChevronDown className="h-4 w-4 -rotate-90" /></button>
          </div>}
        </div>}
        <div className="rounded-3xl bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between"><h2 className="flex items-center gap-2 font-bold"><PieChart className="h-4 w-4 text-[#6d4dff]" />Live Pricing & Rates</h2><Button type="button" variant="outline" className="h-8 rounded-xl px-3 text-xs" onClick={() => setEditingRates(true)}>Edit Rates</Button></div>
          <table className="w-full text-left text-sm"><thead className="text-xs text-muted-foreground"><tr>{["Asset", "Buy Rate (USD)", "Sell Rate (USD)", "Spread"].map(heading => <th key={heading} className="py-2 font-medium">{heading}</th>)}</tr></thead><tbody>{rates.map(rate => <tr key={rate.symbol} className="border-t"><td className="py-2"><span className="inline-flex items-center gap-2"><AssetMark symbol={rate.symbol} />{rate.symbol}</span></td><td className="py-2">{rateText(rate.symbol, rate.buy)}</td><td className="py-2">{rateText(rate.symbol, rate.sell)}</td><td className="py-2 font-semibold text-emerald-600">{rate.spread}</td></tr>)}</tbody></table>
        </div>
      </div>
    </div>}
    {(tab === "orders" || tab === "liquidity") && <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
      <section className="rounded-3xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 flex items-center gap-2 font-bold"><Layers className="h-4 w-4 text-[#6d4dff]" />Liquidity Overview</h2>
        <div className="flex flex-wrap items-center gap-4">
          <div className="min-w-44 rounded-3xl bg-gradient-to-br from-[#7c4dff] to-[#9a6dff] p-5 text-white"><p className="text-sm opacity-80">Total Liquidity (USD)</p><p className="mt-2 text-2xl font-extrabold">{adminMoney(OTC_SUMMARY.liquidity)}</p></div>
          <ul className="space-y-1 text-sm">{OTC_LIQUIDITY.map(item => <li key={item.symbol} className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} /><span className="w-12 font-semibold">{item.symbol}</span><span>{adminMoney(item.value)}</span><span className="text-muted-foreground">({item.share}%)</span></li>)}</ul>
          <LiquidityDonut />
        </div>
      </section>
      <section className="rounded-3xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 flex items-center gap-2 font-bold"><PieChart className="h-4 w-4 text-[#6d4dff]" />Platform Performance</h2>
        <div className="grid gap-3 sm:grid-cols-3">{OTC_PERFORMANCE.map(item => <article key={item.label} className="rounded-2xl bg-[#f7f8fc] p-3"><p className="text-xs text-muted-foreground">{item.label}</p><p className="mt-2 text-lg font-extrabold">{adminMoney(item.value)}</p><p className="mt-2 inline-flex rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700">↑ +{item.change.toFixed(1)}%</p></article>)}</div>
      </section>
    </div>}
    {tab === "settings" && <div className="max-w-md rounded-3xl bg-white p-5 shadow-sm"><h2 className="mb-2 font-bold">Order Settings</h2><ToggleRow label="Enable Buy" checked={buyOn} onChange={value => { setBuyOn(value); setNotice("Buy setting saved in this preview only."); }} /><ToggleRow label="Enable Sell" checked={sellOn} onChange={value => { setSellOn(value); setNotice("Sell setting saved in this preview only."); }} /><ToggleRow label="Auto-Approve (Small Orders)" checked={autoApprove} onChange={value => { setAutoApprove(value); setNotice("Auto-approve saved in this preview only. No order was approved."); }} /><p className="mt-3 text-xs text-muted-foreground">These switches stay in this browser preview and do not change a customer order.</p></div>}
    {tab === "limits" && <form className="overflow-x-auto rounded-3xl bg-white p-4 shadow-sm" onSubmit={saveLimits}><h2 className="mb-3 font-bold">OTC Order Limits</h2><table className="w-full min-w-[520px] text-left text-sm"><thead className="text-xs text-muted-foreground"><tr>{["Asset", "Minimum", "Maximum"].map(heading => <th key={heading} className="px-3 py-2 font-medium">{heading}</th>)}</tr></thead><tbody>{limits.map(item => <tr key={item.symbol} className="border-t"><td className="px-3 py-3 font-semibold">{item.symbol}</td><td className="px-3 py-3"><Input name={`${item.symbol}-min`} aria-label={`${item.symbol} minimum`} defaultValue={item.min} className="h-10" /></td><td className="px-3 py-3"><Input name={`${item.symbol}-max`} aria-label={`${item.symbol} maximum`} defaultValue={item.max} className="h-10" /></td></tr>)}</tbody></table><Button type="submit" className="mt-4 rounded-xl bg-[#6d4dff] hover:bg-[#6d4dff]/90">Save preview limits</Button><p className="mt-3 text-xs text-muted-foreground">Limits stay in this preview. Customer orders are unchanged.</p></form>}
    {notice && <p role="status" className="text-sm text-muted-foreground">{notice}</p>}
    <Dialog open={!!detail} onOpenChange={open => { if (!open) setDetail(null); }}><DialogContent className="max-w-md rounded-3xl">{detail && <><DialogHeader><DialogTitle>{detail.id}</DialogTitle><DialogDescription>{detail.type} {detail.crypto} {detail.asset} · {detail.user}</DialogDescription></DialogHeader><dl className="space-y-2 text-sm"><Info label="Amount (USD)" value={adminMoney(detail.usd, 2)} /><Info label="Rate" value={adminMoney(detail.rate, 2)} /><Info label="Status" value={detail.status} /><Info label="Created" value={detail.created} /></dl><p className="text-sm text-muted-foreground">This sample order was not placed, and the customer balance is unchanged.</p></>}</DialogContent></Dialog>
    <Dialog open={!!editing} onOpenChange={open => { if (!open) setEditing(null); }}><DialogContent className="max-w-md rounded-3xl">{editing && <form key={editing.id} className="space-y-4" onSubmit={saveStatus}><DialogHeader><DialogTitle>Edit {editing.id}</DialogTitle><DialogDescription>The status stays in this preview.</DialogDescription></DialogHeader><label className="block text-sm">Status<select name="status" defaultValue={editing.status} className="mt-1 h-11 w-full rounded-md border bg-card px-3"><option>Completed</option><option>Processing</option><option>Cancelled</option></select></label><Button type="submit" className="h-11 w-full">Save preview</Button></form>}</DialogContent></Dialog>
    <Dialog open={creating} onOpenChange={setCreating}><DialogContent className="max-w-md rounded-3xl"><form className="space-y-4" onSubmit={createOrder}><DialogHeader><DialogTitle>Create OTC Order</DialogTitle><DialogDescription>The order stays in this preview and does not place a trade.</DialogDescription></DialogHeader><Field name="user" label="User" defaultValue="Mustapha S." /><label className="block text-sm">Type<select name="type" className="mt-1 h-11 w-full rounded-md border bg-card px-3"><option>Buy</option><option>Sell</option></select></label><label className="block text-sm">Asset<select name="asset" className="mt-1 h-11 w-full rounded-md border bg-card px-3">{["BTC", "ETH", "USDT", "USDC", "XRP", "SOL"].map(symbol => <option key={symbol}>{symbol}</option>)}</select></label><Field name="crypto" label="Amount (crypto)" defaultValue="0.01" /><Field name="rate" label="Rate (USD)" defaultValue="43000" /><Button type="submit" className="h-11 w-full">Add to preview</Button></form></DialogContent></Dialog>
    <Dialog open={editingRates} onOpenChange={setEditingRates}><DialogContent className="max-w-lg rounded-3xl"><form key={rates.map(rate => rate.spread).join()} className="space-y-3" onSubmit={saveRates}><DialogHeader><DialogTitle>Edit Rates</DialogTitle><DialogDescription>Rates stay in this preview. Customer prices are unchanged.</DialogDescription></DialogHeader>{rates.map(rate => <div key={rate.symbol} className="grid grid-cols-2 gap-2"><Field name={`${rate.symbol}-buy`} label={`${rate.symbol} buy`} defaultValue={String(rate.buy)} /><Field name={`${rate.symbol}-sell`} label={`${rate.symbol} sell`} defaultValue={String(rate.sell)} /></div>)}<Button type="submit" className="h-11 w-full">Save preview</Button></form></DialogContent></Dialog>
  </section>;
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="flex items-center justify-between gap-3 py-2 text-sm font-medium"><span>{label}</span><Switch checked={checked} onCheckedChange={onChange} aria-label={label} className="data-[state=checked]:bg-emerald-500" /></label>;
}

function rateText(symbol: string, value: number) {
  const digits = symbol === "USDT" || symbol === "USDC" || symbol === "XRP" ? 4 : 2;
  return value.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function LiquidityDonut() {
  const radius = 42;
  const circ = 2 * Math.PI * radius;
  return <div className="relative h-32 w-32 shrink-0"><svg viewBox="0 0 120 120" className="h-full w-full">{OTC_LIQUIDITY.map((part, index) => { const start = OTC_LIQUIDITY.slice(0, index).reduce((sum, item) => sum + item.share, 0); const length = (part.share / 100) * circ; return <circle key={part.symbol} cx="60" cy="60" r={radius} fill="none" stroke={part.color} strokeWidth="14" strokeDasharray={`${length} ${circ - length}`} strokeDashoffset={-((start / 100) * circ)} transform="rotate(-90 60 60)" />; })}</svg><div className="absolute inset-0 flex flex-col items-center justify-center text-center"><span className="text-[11px] font-extrabold">{adminMoney(OTC_SUMMARY.liquidity)}</span><span className="text-[10px] text-muted-foreground">Liquidity</span></div></div>;
}

const PRICE_STAMP = "Nov 2, 2026, 02:45 PM";

export function PricingManagement() {
  const [assets, setAssets] = useState(PRICE_ASSETS);
  const [history, setHistory] = useState(PRICE_HISTORY);
  const [tab, setTab] = useState<"rates" | "rules" | "margin" | "engine" | "history">("rates");
  const [query, setQuery] = useState("");
  const [historyAsset, setHistoryAsset] = useState("All Assets");
  const [period, setPeriod] = useState("Last 7 Days");
  const [checked, setChecked] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState<PriceAsset | null>(null);
  const [adding, setAdding] = useState(false);
  const [marginOpen, setMarginOpen] = useState(false);
  const [mode, setMode] = useState<"market" | "fixed">("market");
  const [source, setSource] = useState("CoinGecko (Recommended)");
  const [defaultMargin, setDefaultMargin] = useState("0.50");
  const [refreshEvery, setRefreshEvery] = useState("1 Minute");
  const [updated, setUpdated] = useState(PRICE_SUMMARY.updated);
  const [formKey, setFormKey] = useState(0);
  const [buyAbove, setBuyAbove] = useState(true);
  const [sellBelow, setSellBelow] = useState(true);
  const [minMargin, setMinMargin] = useState("0.20");
  const [maxMargin, setMaxMargin] = useState("2.00");
  const rows = useMemo(() => assets.filter(asset => `${asset.symbol} ${asset.name}`.toLowerCase().includes(query.trim().toLowerCase())), [assets, query]);
  const historyRows = history.filter(row => (historyAsset === "All Assets" || row.symbol === historyAsset) && (period === "Last 7 Days" || row.date.includes("Nov 1") || row.date.includes("Nov 2")));

  function remember(symbol: string, buy: number, sell: number, margin: string) {
    setHistory(current => [{ id: `ph-${current.length + 1}-${symbol}`, symbol, buy, sell, margin, by: "Admin", date: PRICE_STAMP }, ...current]);
    setUpdated(PRICE_STAMP);
  }

  function refresh() {
    setAssets(PRICE_ASSETS);
    setHistory(PRICE_HISTORY);
    setQuery("");
    setMode("market");
    setSource("CoinGecko (Recommended)");
    setDefaultMargin("0.50");
    setRefreshEvery("1 Minute");
    setUpdated(PRICE_SUMMARY.updated);
    setFormKey(value => value + 1);
    setChecked([]);
    setNotice("Preview refreshed. Customer prices are unchanged.");
  }

  function saveRate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const symbol = (editing?.symbol ?? String(data.get("symbol"))).trim().toUpperCase();
    const name = editing?.name ?? String(data.get("name")).trim();
    const market = Number(data.get("market"));
    const buy = Number(data.get("buy"));
    const sell = Number(data.get("sell"));
    if (!/^[A-Z0-9]{2,8}$/.test(symbol) || !name || ![market, buy, sell].every(value => Number.isFinite(value) && value > 0)) { setNotice("Enter a symbol, name, and rates above zero."); return; }
    if (buyAbove && buy < market) { setNotice("The buy rate stays at or above the sample market price."); return; }
    if (sellBelow && sell > market) { setNotice("The sell rate stays at or below the sample market price."); return; }
    const marginValue = Math.abs(buy - sell) / market * 100;
    if (marginValue < Number(minMargin) || marginValue > Number(maxMargin)) { setNotice(`Margin stays between ${minMargin}% and ${maxMargin}% in this preview.`); return; }
    const margin = `${marginValue.toFixed(2)}%`;
    setAssets(current => current.some(asset => asset.symbol === symbol) ? current.map(asset => asset.symbol === symbol ? { ...asset, name, market, buy, sell, margin } : asset) : [...current, { symbol, name, market, buy, sell, margin, status: "Active" }]);
    remember(symbol, buy, sell, margin);
    setEditing(null);
    setAdding(false);
    setNotice("Rate saved in this preview only. Customer buy and sell prices are unchanged.");
  }

  function applyMargin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const marginPct = Number(new FormData(event.currentTarget).get("margin"));
    if (!Number.isFinite(marginPct) || marginPct < Number(minMargin) || marginPct > Number(maxMargin)) { setNotice(`Use a margin between ${minMargin}% and ${maxMargin}%.`); return; }
    const next = assets.map(asset => {
      const half = asset.market * (marginPct / 100) / 2;
      const buy = asset.market + half;
      const sell = asset.market - half;
      return { ...asset, buy, sell, margin: `${(Math.abs(buy - sell) / asset.market * 100).toFixed(2)}%` };
    });
    setAssets(next);
    next.forEach(asset => remember(asset.symbol, asset.buy, asset.sell, asset.margin));
    setDefaultMargin(marginPct.toFixed(2));
    setMarginOpen(false);
    setNotice("Margin applied in this preview only. Customer prices are unchanged.");
  }

  function resetMarket() {
    const next = assets.map(asset => ({ ...asset, buy: asset.market, sell: asset.market, margin: "0.00%" }));
    setAssets(next);
    next.forEach(asset => remember(asset.symbol, asset.buy, asset.sell, asset.margin));
    setNotice("Rates reset to the sample market price in this preview. Customer prices are unchanged.");
  }

  function syncRates() {
    assets.filter(asset => asset.status === "Active").forEach(asset => remember(asset.symbol, asset.buy, asset.sell, asset.margin));
    setNotice("Sample rates marked as synced. No price feed was contacted, and customer prices are unchanged.");
  }

  function saveConfig(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setMode(String(data.get("mode")) === "fixed" ? "fixed" : "market");
    const nextSource = data.get("source");
    if (nextSource) setSource(String(nextSource));
    setDefaultMargin(String(data.get("defaultMargin")));
    setRefreshEvery(String(data.get("interval")));
    setNotice("Configuration saved in this preview only. No price feed was contacted.");
  }

  const config = <form key={formKey} className="rounded-3xl bg-white p-4 shadow-sm" onSubmit={saveConfig}>
    <h2 className="mb-3 flex items-center gap-2 font-bold"><Settings className="h-4 w-4 text-[#6d4dff]" />Pricing Configuration</h2>
    <p className="text-sm font-medium">Pricing Mode</p>
    <label className="mt-2 flex items-start gap-2 text-sm"><input type="radio" name="mode" value="market" checked={mode === "market"} onChange={() => setMode("market")} /> <span><span className="font-semibold">Market-Based</span><span className="block text-xs text-muted-foreground">Use the sample market price</span></span></label>
    <label className="mt-2 flex items-start gap-2 text-sm"><input type="radio" name="mode" value="fixed" checked={mode === "fixed"} onChange={() => setMode("fixed")} /> <span><span className="font-semibold">Fixed Rate</span><span className="block text-xs text-muted-foreground">Set a manual rate</span></span></label>
    <label className="mt-4 block text-sm">Rate Source (for Market-Based)<select name="source" value={source} onChange={event => setSource(event.target.value)} disabled={mode === "fixed"} className="mt-1 h-11 w-full rounded-md border bg-card px-3 disabled:opacity-60"><option>CoinGecko (Recommended)</option><option>Sample feed</option><option>Manual</option></select></label>
    <p className="mt-1 text-xs text-muted-foreground">The source name is a label in this preview. No price feed is contacted.</p>
    <div className="mt-3 grid grid-cols-[1fr_auto] items-end gap-2"><Field name="defaultMargin" label="Default Margin" defaultValue={defaultMargin} /><span className="pb-3 text-sm">%</span></div>
    <label className="mt-3 block text-sm">Rate Refresh Interval<select name="interval" value={refreshEvery} onChange={event => setRefreshEvery(event.target.value)} className="mt-1 h-11 w-full rounded-md border bg-card px-3"><option>1 Minute</option><option>5 Minutes</option><option>15 Minutes</option><option>1 Hour</option></select></label>
    <Button type="submit" className="mt-4 h-11 w-full rounded-xl bg-[#6d4dff] hover:bg-[#6d4dff]/90">Save Configuration</Button>
  </form>;

  const historyCard = <div className="overflow-x-auto rounded-3xl bg-white shadow-sm">
    <div className="flex flex-wrap items-center gap-2 px-4 py-4">
      <h2 className="mr-auto flex items-center gap-2 font-bold"><Clock className="h-4 w-4 text-[#6d4dff]" />Rate History</h2>
      <Filter label="Asset" value={historyAsset} options={["All Assets", ...assets.map(asset => asset.symbol)]} onChange={setHistoryAsset} />
      <Filter label="Period" value={period} options={["Last 7 Days", "Last 24 Hours"]} onChange={setPeriod} />
      <Button type="button" variant="outline" className="rounded-xl bg-white" onClick={() => { download("basecola-rate-history-preview.csv", ["Asset,Buy,Sell,Margin,Changed by,Date", ...historyRows.map(row => [row.symbol, row.buy, row.sell, row.margin, row.by, row.date].join(","))].join("\n")); setNotice("Exported the sample rate history. This file is not a market report."); }}><Download />Export</Button>
    </div>
    <table className="w-full min-w-[720px] text-left text-sm"><thead className="text-xs text-muted-foreground"><tr>{["#", "Asset", "Buy Rate (USD)", "Sell Rate (USD)", "Margin", "Changed By", "Date & Time"].map(heading => <th key={heading} className="px-3 py-2 font-medium">{heading}</th>)}</tr></thead>
      <tbody>{historyRows.map((row, index) => <tr key={row.id} className="border-t"><td className="px-3 py-3">{index + 1}</td><td className="px-3 py-3"><span className="inline-flex items-center gap-2"><AssetMark symbol={row.symbol} />{row.symbol}</span></td><td className="px-3 py-3">{priceText(row.symbol, row.buy)}</td><td className="px-3 py-3">{priceText(row.symbol, row.sell)}</td><td className="px-3 py-3"><Pill tone="violet">{row.margin}</Pill></td><td className="px-3 py-3">{row.by}</td><td className="px-3 py-3 text-xs">{row.date}</td></tr>)}{historyRows.length === 0 && <tr><td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">No sample history in this view.</td></tr>}</tbody>
    </table>
  </div>;

  return <section className="space-y-4">
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <PriceStat label="Total Assets" value={adminCount(PRICE_SUMMARY.assets)} icon={Coins} tone="total" foot={<span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700"><Check className="h-3 w-3" />Active</span>} />
      <PriceStat label="Avg. Buy Rate (USD)" value={priceText("USDT", PRICE_SUMMARY.avgBuy)} icon={ArrowLeftRight} tone="treasury" foot={<span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700">↑ +{PRICE_SUMMARY.avgBuyChange.toFixed(2)}%</span>} />
      <PriceStat label="Avg. Sell Rate (USD)" value={priceText("USDT", PRICE_SUMMARY.avgSell)} icon={ArrowLeftRight} tone="locked" foot={<span className="rounded-full bg-red-100 px-2 py-1 text-xs font-bold text-red-600">↓ {PRICE_SUMMARY.avgSellChange.toFixed(2)}%</span>} />
      <PriceStat label="Avg. Margin" value={`${PRICE_SUMMARY.avgMargin.toFixed(2)}%`} icon={Percent} tone="share" foot={<span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700">↑ +{PRICE_SUMMARY.avgMarginChange.toFixed(2)}%</span>} />
      <PriceStat label="Last Update" value={updated} icon={Activity} tone="live" foot={<span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Live</span>} />
    </div>
    <div className="flex flex-wrap items-center gap-2">
      {([["rates", "Asset Rates"], ["rules", "Rate Rules"], ["margin", "Margin Settings"], ["engine", "Pricing Engine"], ["history", "Rate History"]] as const).map(([id, label]) => <button key={id} type="button" aria-pressed={tab === id} className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === id ? "bg-[#6d4dff] text-white" : "bg-white text-muted-foreground"}`} onClick={() => setTab(id)}>{label}</button>)}
      <Button type="button" variant="outline" className="ml-auto rounded-xl bg-white" onClick={refresh}><RefreshCw />Refresh</Button>
      <Button type="button" className="rounded-xl bg-[#6d4dff] hover:bg-[#6d4dff]/90" onClick={() => setAdding(true)}><Plus />Add / Edit Rate</Button>
    </div>
    {tab === "rates" && <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0 overflow-x-auto rounded-3xl bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-3 px-4 py-4">
          <h2 className="flex items-center gap-2 text-base font-bold"><Coins className="h-4 w-4 text-[#6d4dff]" />Asset Pricing & Rates</h2>
          <label className="relative ml-auto min-w-56 flex-1 sm:max-w-xs"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input aria-label="Search rates" placeholder="Search asset (e.g., BTC, USDT)..." value={query} onChange={event => setQuery(event.target.value)} className="h-11 bg-[#f7f8fc] pl-9" /></label>
        </div>
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="text-xs text-muted-foreground"><tr>
            <th className="px-3 py-3"><input aria-label="Select all rates" type="checkbox" checked={rows.length > 0 && rows.every(asset => checked.includes(asset.symbol))} onChange={event => setChecked(event.target.checked ? rows.map(asset => asset.symbol) : [])} /></th>
            {["Asset", "Market Price (USD)", "Buy Rate (USD)", "Sell Rate (USD)", "Margin", "Status", "Actions"].map(heading => <th key={heading} className="px-3 py-3 font-medium">{heading}</th>)}
          </tr></thead>
          <tbody>{rows.map(asset => <tr key={asset.symbol} className="border-t">
            <td className="px-3 py-3"><input aria-label={`Select ${asset.symbol}`} type="checkbox" checked={checked.includes(asset.symbol)} onChange={event => setChecked(current => event.target.checked ? [...current, asset.symbol] : current.filter(symbol => symbol !== asset.symbol))} /></td>
            <td className="px-3 py-3"><span className="flex items-center gap-2"><AssetMark symbol={asset.symbol} /><span><span className="block font-semibold">{asset.symbol}</span><span className="text-xs text-muted-foreground">{asset.name}</span></span></span></td>
            <td className="px-3 py-3">{priceText(asset.symbol, asset.market)}</td>
            <td className="px-3 py-3">{priceText(asset.symbol, asset.buy)}</td>
            <td className="px-3 py-3">{priceText(asset.symbol, asset.sell)}</td>
            <td className="px-3 py-3"><Pill tone="violet">{asset.margin}</Pill></td>
            <td className="px-3 py-3"><Pill tone={asset.status === "Active" ? "green" : "amber"}>{asset.status}</Pill></td>
            <td className="px-3 py-3"><span className="flex gap-1"><IconButton label={`Edit ${asset.symbol} rate`} onClick={() => setEditing(asset)}><Pencil className="h-4 w-4" /></IconButton><DropdownMenu><DropdownMenuTrigger asChild><button type="button" aria-label={`More actions for ${asset.symbol}`} className="grid h-8 w-8 place-items-center rounded-lg text-lg leading-none text-muted-foreground hover:bg-accent">···</button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => { setAssets(current => current.map(item => item.symbol === asset.symbol ? { ...item, status: item.status === "Active" ? "Paused" : "Active" } : item)); setNotice("Status saved in this preview only. Customer prices are unchanged."); }}>Toggle status in preview</DropdownMenuItem></DropdownMenuContent></DropdownMenu></span></td>
          </tr>)}{rows.length === 0 && <tr><td colSpan={8} className="px-3 py-10 text-center text-muted-foreground">No sample assets match this search.</td></tr>}</tbody>
        </table>
      </div>
      {config}
    </div>}
    {tab === "rates" && <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">{historyCard}<QuickRates onSync={syncRates} onMargin={() => setMarginOpen(true)} onReset={resetMarket} onSchedule={() => setNotice(`Schedule saved for every ${refreshEvery}. This preview does not run the update on its own.`)} /></div>}
    {tab === "rules" && <form className="max-w-lg space-y-4 rounded-3xl bg-white p-5 shadow-sm" onSubmit={event => { event.preventDefault(); const data = new FormData(event.currentTarget); setMinMargin(String(data.get("min"))); setMaxMargin(String(data.get("max"))); setNotice("Rules saved in this preview only. Customer prices are unchanged."); }}>
      <h2 className="font-bold">Rate Rules</h2>
      <ToggleRow label="Buy rate stays at or above the sample market price" checked={buyAbove} onChange={setBuyAbove} />
      <ToggleRow label="Sell rate stays at or below the sample market price" checked={sellBelow} onChange={setSellBelow} />
      <Field name="min" label="Minimum margin (%)" defaultValue={minMargin} />
      <Field name="max" label="Maximum margin (%)" defaultValue={maxMargin} />
      <Button type="submit" className="rounded-xl bg-[#6d4dff] hover:bg-[#6d4dff]/90">Save preview rules</Button>
    </form>}
    {tab === "margin" && <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
      <form className="rounded-3xl bg-white p-5 shadow-sm" onSubmit={applyMargin}><h2 className="mb-3 font-bold">Margin Settings</h2><Field name="margin" label="Global margin (%)" defaultValue={defaultMargin} /><Button type="submit" className="mt-4 w-full rounded-xl bg-[#6d4dff] hover:bg-[#6d4dff]/90">Apply to preview</Button><p className="mt-3 text-xs text-muted-foreground">Applying a margin updates the sample rates on this screen. Customer prices are unchanged.</p></form>
      <div className="overflow-x-auto rounded-3xl bg-white shadow-sm"><table className="w-full text-left text-sm"><thead className="text-xs text-muted-foreground"><tr>{["Asset", "Market", "Margin"].map(heading => <th key={heading} className="px-3 py-3 font-medium">{heading}</th>)}</tr></thead><tbody>{assets.map(asset => <tr key={asset.symbol} className="border-t"><td className="px-3 py-3 font-semibold">{asset.symbol}</td><td className="px-3 py-3">{priceText(asset.symbol, asset.market)}</td><td className="px-3 py-3"><Pill tone="violet">{asset.margin}</Pill></td></tr>)}</tbody></table></div>
    </div>}
    {tab === "engine" && <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_300px]"><div className="max-w-xl">{config}</div><QuickRates onSync={syncRates} onMargin={() => setMarginOpen(true)} onReset={resetMarket} onSchedule={() => setNotice(`Schedule saved for every ${refreshEvery}. This preview does not run the update on its own.`)} /></div>}
    {tab === "history" && historyCard}
    {notice && <p role="status" className="text-sm text-muted-foreground">{notice}</p>}
    <Dialog open={adding || !!editing} onOpenChange={open => { if (!open) { setAdding(false); setEditing(null); } }}><DialogContent className="max-w-md rounded-3xl"><form key={editing?.symbol ?? "new"} className="space-y-4" onSubmit={saveRate}><DialogHeader><DialogTitle>{editing ? `Edit ${editing.symbol}` : "Add / Edit Rate"}</DialogTitle><DialogDescription>The rate stays in this preview and does not change a customer price.</DialogDescription></DialogHeader>{editing ? <p className="text-sm font-semibold">{editing.symbol} · {editing.name}</p> : <><Field name="symbol" label="Symbol" /><Field name="name" label="Name" /></>}<Field name="market" label="Market price (USD)" defaultValue={editing ? String(editing.market) : "1"} /><Field name="buy" label="Buy rate (USD)" defaultValue={editing ? String(editing.buy) : "1"} /><Field name="sell" label="Sell rate (USD)" defaultValue={editing ? String(editing.sell) : "1"} /><Button type="submit" className="h-11 w-full">Save preview</Button></form></DialogContent></Dialog>
    <Dialog open={marginOpen} onOpenChange={setMarginOpen}><DialogContent className="max-w-md rounded-3xl"><form className="space-y-4" onSubmit={applyMargin}><DialogHeader><DialogTitle>Set Global Margin</DialogTitle><DialogDescription>The margin is applied to the sample rates on this screen.</DialogDescription></DialogHeader><Field name="margin" label="Margin (%)" defaultValue={defaultMargin} /><Button type="submit" className="h-11 w-full">Apply preview margin</Button></form></DialogContent></Dialog>
  </section>;
}

function QuickRates({ onSync, onMargin, onReset, onSchedule }: { onSync: () => void; onMargin: () => void; onReset: () => void; onSchedule: () => void }) {
  const actions = [
    { label: "Update All Rates", detail: "Sync from market source", icon: RefreshCw, onClick: onSync },
    { label: "Set Global Margin", detail: "Apply margin to all assets", icon: Percent, onClick: onMargin },
    { label: "Reset to Market", detail: "Revert to the sample market price", icon: Layers, onClick: onReset },
    { label: "Schedule Update", detail: "Auto-update at interval", icon: Calendar, onClick: onSchedule },
  ];
  return <div className="rounded-3xl bg-white p-4 shadow-sm"><h2 className="mb-3 flex items-center gap-2 font-bold"><Zap className="h-4 w-4 text-[#6d4dff]" />Quick Actions</h2><div className="grid grid-cols-2 gap-2">{actions.map(action => <button key={action.label} type="button" className="rounded-2xl bg-[#f7f8fc] px-3 py-4 text-left" onClick={action.onClick}><action.icon className="mb-2 h-5 w-5 text-[#6d4dff]" /><span className="block text-sm font-semibold">{action.label}</span><span className="mt-1 block text-xs text-muted-foreground">{action.detail}</span></button>)}</div></div>;
}

function PriceStat({ label, value, icon: Icon, tone, foot }: { label: string; value: string; icon: typeof Wallet; tone: "total" | "treasury" | "locked" | "share" | "live"; foot: ReactNode }) {
  const toneClass = { total: "bg-gradient-to-br from-[#7c4dff] to-[#9a6dff] text-white", treasury: "bg-[#eef0fb]", locked: "bg-[#fff4e8]", share: "bg-[#f3eefe]", live: "bg-[#e7f8ef]" }[tone];
  return <article className={`rounded-3xl p-5 ${toneClass}`}><span className="flex items-center gap-2 text-sm font-medium opacity-80"><Icon className="h-4 w-4" />{label}</span><p className={`mt-3 font-extrabold ${tone === "live" ? "text-base" : "text-2xl"}`}>{value}</p><div className="mt-3">{foot}</div></article>;
}

function priceText(symbol: string, value: number) {
  const digits = symbol === "USDT" || symbol === "USDC" || symbol === "XRP" ? 4 : 2;
  return value.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: digits, maximumFractionDigits: digits });
}

const TREASURY_STAMP = "Nov 2, 2026, 02:50 PM";

export function TreasuryManagement() {
  const [accounts, setAccounts] = useState(TREASURY_ACCOUNTS);
  const [moves, setMoves] = useState(TREASURY_MOVES);
  const [tab, setTab] = useState<"overview" | "reserves" | "liquidity" | "transfers" | "rebalancing" | "settlement" | "accounts" | "logs">("overview");
  const [query, setQuery] = useState("");
  const [activity, setActivity] = useState("All Activities");
  const [notice, setNotice] = useState("");
  const [detail, setDetail] = useState<TreasuryAccount | null>(null);
  const [editing, setEditing] = useState<TreasuryAccount | null>(null);
  const [adding, setAdding] = useState(false);
  const [moveMode, setMoveMode] = useState<null | { label: string; type: TreasuryMove["type"]; from: string; to: string }>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [targetRatio, setTargetRatio] = useState("78.8");
  const accountRows = accounts.filter(account => `${account.name} ${account.type} ${account.network}`.toLowerCase().includes(query.trim().toLowerCase()));
  const moveRows = moves.filter(move => activity === "All Activities" || (activity === "Transfers" && move.type === "Transfer") || (activity === "Rebalances" && move.type === "Rebalance") || (activity === "Top Up" && move.type === "Top Up") || (activity === "Withdrawals" && move.type === "Withdrawal"));

  function recordMove(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!moveMode) return;
    const data = new FormData(event.currentTarget);
    const next: TreasuryMove = { id: `tm-${moves.length + 1}`, type: moveMode.type, from: String(data.get("from")), to: String(data.get("to")), asset: String(data.get("asset")), amount: String(data.get("amount")).trim(), usd: Number(data.get("usd")) || 0, status: "Completed", date: TREASURY_STAMP };
    setMoves(current => [next, ...current]);
    setMoveMode(null);
    setNotice("Recorded in this preview only. No funds moved and customer balances are unchanged.");
  }

  function addAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const usd = Number(data.get("usd"));
    if (!Number.isFinite(usd) || usd < 0) { setNotice("Enter a sample balance of zero or more."); return; }
    const next: TreasuryAccount = { id: `ta-${accounts.length + 1}`, name: String(data.get("name")).trim(), type: String(data.get("type")) as TreasuryAccount["type"], network: String(data.get("network")).trim(), assetBalance: usd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), usd, status: "Active", updated: TREASURY_STAMP };
    setAccounts(current => [...current, next]);
    setAdding(false);
    setTab("accounts");
    setNotice("Account added in this preview only. No wallet address was created.");
  }

  function saveAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    const status = String(new FormData(event.currentTarget).get("status")) as TreasuryAccount["status"];
    setAccounts(current => current.map(account => account.id === editing.id ? { ...account, status } : account));
    setEditing(null);
    setNotice("Status saved in this preview only. Treasury balances are unchanged.");
  }

  const accountsTable = <div className="overflow-x-auto rounded-3xl bg-white shadow-sm">
    <div className="flex flex-wrap items-center gap-3 px-4 py-4">
      <h2 className="flex items-center gap-2 font-bold"><Layers className="h-4 w-4 text-[#6d4dff]" />Treasury Accounts</h2>
      <label className="relative ml-auto min-w-56 flex-1 sm:max-w-xs"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input aria-label="Search treasury accounts" placeholder="Search treasury accounts..." value={query} onChange={event => setQuery(event.target.value)} className="h-11 bg-[#f7f8fc] pl-9" /></label>
      <Button type="button" className="rounded-xl bg-[#6d4dff] hover:bg-[#6d4dff]/90" onClick={() => setAdding(true)}><Plus />Add Account</Button>
    </div>
    <table className="w-full min-w-[860px] text-left text-sm">
      <thead className="text-xs text-muted-foreground"><tr>{["#", "Account Name", "Type", "Network", "Balance (Asset)", "Balance (USD)", "Status", "Last Updated", "Actions"].map(heading => <th key={heading} className="px-3 py-2 font-medium">{heading}</th>)}</tr></thead>
      <tbody>{accountRows.map((account, index) => <tr key={account.id} className="border-t">
        <td className="px-3 py-3">{index + 1}</td>
        <td className="px-3 py-3"><span className="inline-flex items-center gap-2">{accountIcon(account.type)}<span className="font-semibold">{account.name}</span></span></td>
        <td className="px-3 py-3"><Pill tone={account.type === "Hot Wallet" ? "red" : account.type === "Cold Wallet" ? "blue" : account.type === "Liquidity" ? "green" : "violet"}>{account.type}</Pill></td>
        <td className="px-3 py-3">{account.network}</td>
        <td className="px-3 py-3">{account.assetBalance}</td>
        <td className="px-3 py-3">{adminMoney(account.usd, 2)}</td>
        <td className="px-3 py-3"><Pill tone={account.status === "Active" ? "green" : "amber"}>{account.status}</Pill></td>
        <td className="px-3 py-3 text-xs">{account.updated}</td>
        <td className="px-3 py-3"><span className="flex gap-1"><IconButton label={`View ${account.name}`} onClick={() => setDetail(account)}><Eye className="h-4 w-4" /></IconButton><IconButton label={`Edit ${account.name}`} onClick={() => setEditing(account)}><Pencil className="h-4 w-4" /></IconButton><DropdownMenu><DropdownMenuTrigger asChild><button type="button" aria-label={`More actions for ${account.name}`} className="grid h-8 w-8 place-items-center rounded-lg text-lg leading-none text-muted-foreground hover:bg-accent">···</button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => { setAccounts(current => current.map(item => item.id === account.id ? { ...item, status: item.status === "Active" ? "Paused" : "Active" } : item)); setNotice("Status saved in this preview only. Treasury balances are unchanged."); }}>Toggle status in preview</DropdownMenuItem></DropdownMenuContent></DropdownMenu></span></td>
      </tr>)}{accountRows.length === 0 && <tr><td colSpan={9} className="px-3 py-8 text-center text-muted-foreground">No sample accounts match this search.</td></tr>}</tbody>
    </table>
  </div>;

  const activityTable = <div className="overflow-x-auto rounded-3xl bg-white shadow-sm">
    <div className="flex flex-wrap items-center gap-2 px-4 py-4">
      <h2 className="mr-auto flex items-center gap-2 font-bold"><Clock className="h-4 w-4 text-[#6d4dff]" />{tab === "logs" ? "Audit Logs" : "Recent Treasury Activities"}</h2>
      <Filter label="Activities" value={activity} options={["All Activities", "Transfers", "Rebalances", "Top Up", "Withdrawals"]} onChange={setActivity} />
      <Button type="button" variant="outline" className="rounded-xl bg-white" onClick={() => { download("basecola-treasury-preview.csv", ["Type,From,To,Asset,Amount,USD,Status,Date", ...moveRows.map(move => [move.type, move.from, move.to, move.asset, move.amount, move.usd, move.status, move.date].join(","))].join("\n")); setNotice("Exported the sample treasury activity. This file is not a settlement report."); }}><Download />Export</Button>
    </div>
    <table className="w-full min-w-[860px] text-left text-sm">
      <thead className="text-xs text-muted-foreground"><tr>{["#", "Type", "From", "To", "Asset", "Amount", "USD Value", "Status", "Date & Time"].map(heading => <th key={heading} className="px-3 py-2 font-medium">{heading}</th>)}</tr></thead>
      <tbody>{moveRows.map((move, index) => <tr key={move.id} className="border-t">
        <td className="px-3 py-3">{index + 1}</td>
        <td className="px-3 py-3"><span className="inline-flex items-center gap-2">{activityIcon(move.type)}<Pill tone={move.type === "Transfer" ? "violet" : move.type === "Rebalance" ? "blue" : move.type === "Top Up" ? "green" : "red"}>{move.type}</Pill></span></td>
        <td className="px-3 py-3">{move.from}</td>
        <td className="px-3 py-3"><span className="inline-flex items-center gap-1 text-muted-foreground">→ <span className="font-medium text-foreground">{move.to}</span></span></td>
        <td className="px-3 py-3"><span className="inline-flex items-center gap-2"><AssetMark symbol={move.asset} />{move.asset}</span></td>
        <td className="px-3 py-3">{move.amount}</td>
        <td className="px-3 py-3">{adminMoney(move.usd, 2)}</td>
        <td className="px-3 py-3"><Pill tone="green">{move.status}</Pill></td>
        <td className="px-3 py-3 text-xs">{move.date}</td>
      </tr>)}{moveRows.length === 0 && <tr><td colSpan={9} className="px-3 py-8 text-center text-muted-foreground">No sample activity in this view.</td></tr>}</tbody>
    </table>
    <p className="px-4 py-3 text-xs text-muted-foreground">Sample activity. Recording a movement does not move funds.</p>
  </div>;

  return <section className="space-y-4">
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <PriceStat label="Total Treasury Balance" value={adminMoney(TREASURY_PAGE.total)} icon={Landmark} tone="total" foot={<span className="rounded-full bg-white/20 px-2 py-1 text-xs font-bold">↑ +{TREASURY_PAGE.totalChange.toFixed(1)}%</span>} />
      <PriceStat label="Total Reserves" value={adminMoney(TREASURY_PAGE.reserves)} icon={Layers} tone="treasury" foot={<span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700">↑ +{TREASURY_PAGE.reservesChange.toFixed(1)}%</span>} />
      <PriceStat label="Liquidity (Hot)" value={adminMoney(TREASURY_PAGE.hot)} icon={Flame} tone="locked" foot={<span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700">↑ +{TREASURY_PAGE.hotChange.toFixed(1)}%</span>} />
      <PriceStat label="In Transit" value={adminMoney(TREASURY_PAGE.transit)} icon={RefreshCw} tone="live" foot={<span className="rounded-full bg-red-100 px-2 py-1 text-xs font-bold text-red-600">↓ {TREASURY_PAGE.transitChange.toFixed(1)}%</span>} />
      <PriceStat label="Reserve Ratio" value={`${TREASURY_PAGE.ratio.toFixed(1)}%`} icon={Shield} tone="share" foot={<span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700"><Check className="h-3 w-3" />Healthy</span>} />
    </div>
    <div className="flex flex-wrap gap-2">
      {([["overview", "Overview"], ["reserves", "Reserves"], ["liquidity", "Liquidity"], ["transfers", "Transfers"], ["rebalancing", "Rebalancing"], ["settlement", "Settlement"], ["accounts", "Treasury Accounts"], ["logs", "Audit Logs"]] as const).map(([id, label]) => <button key={id} type="button" aria-pressed={tab === id} className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === id ? "bg-[#6d4dff] text-white" : "bg-white text-muted-foreground"}`} onClick={() => { setTab(id); setActivity(id === "transfers" ? "Transfers" : id === "rebalancing" ? "Rebalances" : "All Activities"); }}>{label}</button>)}
    </div>
    {(tab === "overview" || tab === "liquidity" || tab === "reserves") && <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
      <section className="rounded-3xl bg-white p-4 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 font-bold"><Landmark className="h-4 w-4 text-[#6d4dff]" />{tab === "reserves" ? "Reserves" : tab === "liquidity" ? "Liquidity" : "Treasury Overview"}</h2>
        <div className="flex flex-wrap items-center gap-5">
          <TreasuryDonut />
          <ul className="space-y-1 text-sm">{TREASURY_MIX.map(item => <li key={item.symbol} className="grid grid-cols-[16px_42px_1fr_auto_auto] items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} /><span className="font-semibold">{item.symbol}</span><span>{item.amount}</span><span>{adminMoney(item.usd, 2)}</span><span className="text-muted-foreground">{item.share}%</span></li>)}</ul>
          <div className="space-y-2">{TREASURY_BUCKETS.map(bucket => <article key={bucket.label} className={`rounded-2xl px-4 py-3 ${bucket.label === "Hot Wallet" ? "bg-[#fff4e8]" : bucket.label === "In Transit" ? "bg-[#eef6ff]" : "bg-[#eef0fb]"}`}><p className="flex items-center gap-2 text-sm font-semibold">{bucket.label === "Hot Wallet" ? <Flame className="h-4 w-4 text-orange-500" /> : bucket.label === "In Transit" ? <ArrowLeftRight className="h-4 w-4 text-sky-500" /> : <Landmark className="h-4 w-4 text-[#6d4dff]" />}{bucket.label}</p><p className="text-lg font-extrabold">{adminMoney(bucket.value)}</p><p className="text-xs text-muted-foreground">({bucket.share}%)</p></article>)}</div>
        </div>
        {tab === "reserves" && <p className="mt-4 text-sm text-muted-foreground">Reserve ratio {TREASURY_PAGE.ratio.toFixed(1)}% against a {targetRatio}% preview target. This ratio does not move funds.</p>}
      </section>
      {tab === "overview" && <div className="rounded-3xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 flex items-center gap-2 font-bold"><Zap className="h-4 w-4 text-[#6d4dff]" />Quick Actions</h2>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className="col-span-2 rounded-2xl bg-[#6d4dff] px-3 py-4 text-left text-white" onClick={() => setMoveMode({ label: "Transfer Funds", type: "Transfer", from: "Hot Wallet", to: "Cold Storage" })}><ArrowLeftRight className="mb-2 h-5 w-5" /><span className="block text-sm font-semibold">Transfer Funds</span></button>
          {[{ label: "Top Up Treasury", type: "Top Up" as const, from: "External", to: "Treasury", icon: ArrowDownLeft }, { label: "Rebalance", type: "Rebalance" as const, from: "Liquidity Pool", to: "Hot Wallet", icon: Scale }, { label: "Move to Cold Storage", type: "Transfer" as const, from: "Hot Wallet", to: "Cold Storage", icon: Lock }].map(action => <button key={action.label} type="button" className="rounded-2xl bg-[#f7f8fc] px-3 py-4 text-left" onClick={() => setMoveMode(action)}><action.icon className="mb-2 h-5 w-5 text-[#6d4dff]" /><span className="block text-sm font-semibold">{action.label}</span></button>)}
          <button type="button" className="rounded-2xl bg-[#f7f8fc] px-3 py-4 text-left" onClick={() => setTab("reserves")}><Shield className="mb-2 h-5 w-5 text-[#6d4dff]" /><span className="block text-sm font-semibold">Manage Reserves</span></button>
          <button type="button" className="rounded-2xl bg-[#f7f8fc] px-3 py-4 text-left" onClick={() => setSettingsOpen(true)}><Settings className="mb-2 h-5 w-5 text-[#6d4dff]" /><span className="block text-sm font-semibold">Treasury Settings</span></button>
        </div>
      </div>}
    </div>}
    {(tab === "overview" || tab === "accounts") && accountsTable}
    {(tab === "overview" || tab === "transfers" || tab === "rebalancing" || tab === "logs") && activityTable}
    {tab === "settlement" && <div className="overflow-x-auto rounded-3xl bg-white shadow-sm"><h2 className="px-4 py-4 font-bold">Settlement</h2><table className="w-full text-left text-sm"><thead className="text-xs text-muted-foreground"><tr>{["Batch", "Window", "Sample total", "Status"].map(heading => <th key={heading} className="px-3 py-2 font-medium">{heading}</th>)}</tr></thead><tbody><tr className="border-t"><td className="px-3 py-3 font-semibold">SET-1102</td><td className="px-3 py-3">Oct 25–Nov 1, 2026</td><td className="px-3 py-3">{adminMoney(TREASURY_PAGE.total)}</td><td className="px-3 py-3"><Pill tone="green">Matched</Pill></td></tr></tbody></table><p className="px-4 py-3 text-sm text-muted-foreground">Sample settlement. It does not settle or move funds.</p></div>}
    {notice && <p role="status" className="text-sm text-muted-foreground">{notice}</p>}
    <Dialog open={!!detail} onOpenChange={open => { if (!open) setDetail(null); }}><DialogContent className="max-w-md rounded-3xl">{detail && <><DialogHeader><DialogTitle>{detail.name}</DialogTitle><DialogDescription>{detail.type} · {detail.network}</DialogDescription></DialogHeader><dl className="space-y-2 text-sm"><Info label="Balance" value={adminMoney(detail.usd, 2)} /><Info label="Asset balance" value={detail.assetBalance} /><Info label="Status" value={detail.status} /><Info label="Updated" value={detail.updated} /></dl><p className="text-sm text-muted-foreground">This is a sample treasury balance. It is not a wallet address and cannot receive a deposit.</p></>}</DialogContent></Dialog>
    <Dialog open={!!editing} onOpenChange={open => { if (!open) setEditing(null); }}><DialogContent className="max-w-md rounded-3xl">{editing && <form key={editing.id} className="space-y-4" onSubmit={saveAccount}><DialogHeader><DialogTitle>Edit {editing.name}</DialogTitle><DialogDescription>The status stays in this preview.</DialogDescription></DialogHeader><label className="block text-sm">Status<select name="status" defaultValue={editing.status} className="mt-1 h-11 w-full rounded-md border bg-card px-3"><option>Active</option><option>Paused</option></select></label><Button type="submit" className="h-11 w-full">Save preview</Button></form>}</DialogContent></Dialog>
    <Dialog open={adding} onOpenChange={setAdding}><DialogContent className="max-w-md rounded-3xl"><form className="space-y-4" onSubmit={addAccount}><DialogHeader><DialogTitle>Add Account</DialogTitle><DialogDescription>The account stays in this preview and does not open a wallet address.</DialogDescription></DialogHeader><Field name="name" label="Account name" /><label className="block text-sm">Type<select name="type" className="mt-1 h-11 w-full rounded-md border bg-card px-3"><option>Hot Wallet</option><option>Cold Wallet</option><option>Liquidity</option><option>Reserve</option></select></label><Field name="network" label="Network" defaultValue="Multi-Asset" /><Field name="usd" label="Sample balance (USD)" defaultValue="0" /><Button type="submit" className="h-11 w-full">Add to preview</Button></form></DialogContent></Dialog>
    <Dialog open={!!moveMode} onOpenChange={open => { if (!open) setMoveMode(null); }}><DialogContent className="max-w-md rounded-3xl">{moveMode && <form key={moveMode.label} className="space-y-4" onSubmit={recordMove}><DialogHeader><DialogTitle>{moveMode.label}</DialogTitle><DialogDescription>This record stays in the preview. No funds move.</DialogDescription></DialogHeader><label className="block text-sm">Asset<select name="asset" className="mt-1 h-11 w-full rounded-md border bg-card px-3">{TREASURY_MIX.map(item => <option key={item.symbol}>{item.symbol}</option>)}</select></label><Field name="amount" label="Amount" defaultValue="0" /><Field name="usd" label="USD value" defaultValue="0" /><label className="block text-sm">From<select name="from" defaultValue={moveMode.from} className="mt-1 h-11 w-full rounded-md border bg-card px-3">{["Hot Wallet", "Cold Storage", "Liquidity Pool", "Treasury", "External"].map(place => <option key={place}>{place}</option>)}</select></label><label className="block text-sm">To<select name="to" defaultValue={moveMode.to} className="mt-1 h-11 w-full rounded-md border bg-card px-3">{["Hot Wallet", "Cold Storage", "Liquidity Pool", "Treasury", "External"].map(place => <option key={place}>{place}</option>)}</select></label><Button type="submit" className="h-11 w-full">Save preview</Button></form>}</DialogContent></Dialog>
    <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}><DialogContent className="max-w-md rounded-3xl"><form className="space-y-4" onSubmit={event => { event.preventDefault(); setTargetRatio(String(new FormData(event.currentTarget).get("ratio"))); setSettingsOpen(false); setNotice("Treasury settings saved in this preview only. No funds moved."); }}><DialogHeader><DialogTitle>Treasury Settings</DialogTitle><DialogDescription>The target stays in this preview.</DialogDescription></DialogHeader><Field name="ratio" label="Target reserve ratio (%)" defaultValue={targetRatio} /><Button type="submit" className="h-11 w-full">Save preview</Button></form></DialogContent></Dialog>
  </section>;
}

function TreasuryDonut() {
  const radius = 46;
  const circ = 2 * Math.PI * radius;
  const total = TREASURY_MIX.reduce((sum, item) => sum + item.share, 0);
  return <div className="relative h-36 w-36 shrink-0"><svg viewBox="0 0 120 120" className="h-full w-full">{TREASURY_MIX.map((part, index) => { const start = TREASURY_MIX.slice(0, index).reduce((sum, item) => sum + item.share, 0); const length = (part.share / total) * circ; return <circle key={part.symbol} cx="60" cy="60" r={radius} fill="none" stroke={part.color} strokeWidth="14" strokeDasharray={`${length} ${circ - length}`} strokeDashoffset={-((start / total) * circ)} transform="rotate(-90 60 60)" />; })}</svg><div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"><span className="text-[11px] font-extrabold leading-tight">{adminMoney(TREASURY_PAGE.total)}</span><span className="text-[10px] text-muted-foreground">Total Treasury</span></div></div>;
}

function accountIcon(type: TreasuryAccount["type"]) {
  if (type === "Hot Wallet") return <Flame className="h-4 w-4 text-orange-500" />;
  if (type === "Cold Wallet") return <Shield className="h-4 w-4 text-sky-500" />;
  if (type === "Liquidity") return <Layers className="h-4 w-4 text-emerald-500" />;
  return <Landmark className="h-4 w-4 text-[#6d4dff]" />;
}

const REPORT_STAMP = "Nov 2, 2026, 02:55 PM";
const REPORT_PERIOD = "Oct 25 – Nov 1, 2026";

export function ReportsManagement() {
  const [reports, setReports] = useState(PLATFORM_REPORTS);
  const [tab, setTab] = useState<"overview" | "transactions" | "users" | "assets" | "treasury" | "earn" | "revenue" | "custom">("overview");
  const [notice, setNotice] = useState("");
  const [generating, setGenerating] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [apiOpen, setApiOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [format, setFormat] = useState("CSV");

  function saveReport(report: PlatformReport) {
    download(`${report.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.csv`, reportCsv(report));
    setNotice("Downloaded a sample report. It is not a live export of customer activity.");
  }

  function createReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const report: PlatformReport = { id: `rpt-${reports.length + 1}`, name: String(data.get("name")).trim(), type: String(data.get("type")) as PlatformReport["type"], period: REPORT_PERIOD, generated: REPORT_STAMP };
    setReports(current => [report, ...current]);
    saveReport(report);
    setGenerating(false);
    setNotice("Sample report added in this preview. No customer data was exported.");
  }

  const reportTable = <div id="recent-reports" className="overflow-x-auto rounded-3xl bg-white shadow-sm">
    <div className="flex items-center justify-between px-4 py-4"><h2 className="flex items-center gap-2 font-bold"><FileText className="h-4 w-4 text-[#6d4dff]" />Recent Reports</h2><button type="button" className="text-sm font-semibold text-[#6d4dff]" onClick={() => document.getElementById("recent-reports")?.scrollIntoView({ behavior: "smooth" })}>View All</button></div>
    <table className="w-full min-w-[720px] text-left text-sm">
      <thead className="text-xs text-muted-foreground"><tr>{["Report Name", "Type", "Period", "Generated", "Actions"].map(heading => <th key={heading} className="px-3 py-2 font-medium">{heading}</th>)}</tr></thead>
      <tbody>{reports.map(report => <tr key={report.id} className="border-t">
        <td className="px-3 py-3 font-semibold">{report.name}</td>
        <td className="px-3 py-3"><Pill tone={report.type === "Users" ? "blue" : report.type === "Assets" ? "green" : report.type === "Treasury" ? "amber" : "violet"}>{report.type}</Pill></td>
        <td className="px-3 py-3">{report.period}</td>
        <td className="px-3 py-3 text-xs">{report.generated}</td>
        <td className="px-3 py-3"><span className="flex gap-1"><IconButton label={`Download ${report.name}`} onClick={() => saveReport(report)}><Download className="h-4 w-4" /></IconButton><DropdownMenu><DropdownMenuTrigger asChild><button type="button" aria-label={`More actions for ${report.name}`} className="grid h-8 w-8 place-items-center rounded-lg text-lg leading-none text-muted-foreground hover:bg-accent">···</button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => saveReport(report)}>Download sample CSV</DropdownMenuItem></DropdownMenuContent></DropdownMenu></span></td>
      </tr>)}</tbody>
    </table>
  </div>;

  const actions = <div className="rounded-3xl bg-white p-4 shadow-sm">
    <h2 className="mb-3 flex items-center gap-2 font-bold"><Zap className="h-4 w-4 text-[#6d4dff]" />Quick Actions</h2>
    <div className="grid grid-cols-2 gap-2">
      <button type="button" className="col-span-2 rounded-2xl bg-[#6d4dff] px-3 py-4 text-left text-white sm:col-span-1" onClick={() => setGenerating(true)}><FileText className="mb-2 h-5 w-5" /><span className="block text-sm font-semibold">Generate Report</span></button>
      <button type="button" className="rounded-2xl bg-[#f7f8fc] px-3 py-4 text-left" onClick={() => setTab("custom")}><Layers className="mb-2 h-5 w-5 text-[#6d4dff]" /><span className="block text-sm font-semibold">Custom Report</span></button>
      <button type="button" className="rounded-2xl bg-[#f7f8fc] px-3 py-4 text-left" onClick={() => setScheduling(true)}><Calendar className="mb-2 h-5 w-5 text-[#6d4dff]" /><span className="block text-sm font-semibold">Schedule Report</span></button>
      <button type="button" className="rounded-2xl bg-[#f7f8fc] px-3 py-4 text-left" onClick={() => { download("basecola-report-summary.csv", ["Metric,Value", `Volume,${REPORT_SUMMARY.volume}`, `Transactions,${REPORT_SUMMARY.transactions}`, `Users,${REPORT_SUMMARY.users}`, `Revenue,${REPORT_SUMMARY.revenue}`, `Profit,${REPORT_SUMMARY.profit}`].join("\n")); setNotice("Exported the sample summary. Customer balances are unchanged."); }}><Download className="mb-2 h-5 w-5 text-[#6d4dff]" /><span className="block text-sm font-semibold">Export Data</span></button>
      <button type="button" className="rounded-2xl bg-[#f7f8fc] px-3 py-4 text-left" onClick={() => setApiOpen(true)}><Code className="mb-2 h-5 w-5 text-[#6d4dff]" /><span className="block text-sm font-semibold">API Analytics</span></button>
      <button type="button" className="rounded-2xl bg-[#f7f8fc] px-3 py-4 text-left" onClick={() => setSettingsOpen(true)}><Settings className="mb-2 h-5 w-5 text-[#6d4dff]" /><span className="block text-sm font-semibold">Report Settings</span></button>
    </div>
  </div>;

  return <section className="space-y-4">
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <PriceStat label="Total Volume (USD)" value={adminMoney(REPORT_SUMMARY.volume)} icon={Wallet} tone="total" foot={<span className="rounded-full bg-white/20 px-2 py-1 text-xs font-bold">↑ +{REPORT_SUMMARY.volumeChange.toFixed(1)}%</span>} />
      <PriceStat label="Total Transactions" value={adminCount(REPORT_SUMMARY.transactions)} icon={ArrowLeftRight} tone="treasury" foot={<span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700">↑ +{REPORT_SUMMARY.transactionsChange.toFixed(1)}%</span>} />
      <PriceStat label="Total Users" value={adminCount(REPORT_SUMMARY.users)} icon={Users} tone="locked" foot={<span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700">↑ +{REPORT_SUMMARY.usersChange.toFixed(1)}%</span>} />
      <PriceStat label="Total Revenue" value={adminMoney(REPORT_SUMMARY.revenue)} icon={Layers} tone="share" foot={<span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700">↑ +{REPORT_SUMMARY.revenueChange.toFixed(1)}%</span>} />
      <PriceStat label="Total Profit" value={adminMoney(REPORT_SUMMARY.profit)} icon={BarChart3} tone="share" foot={<span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700">↑ +{REPORT_SUMMARY.profitChange.toFixed(1)}%</span>} />
    </div>
    <div className="flex flex-wrap gap-2">
      {([["overview", "Overview"], ["transactions", "Transactions Report"], ["users", "User Report"], ["assets", "Assets Report"], ["treasury", "Treasury Report"], ["earn", "Invest/Earn Report"], ["revenue", "Revenue & Profit"], ["custom", "Custom Report"]] as const).map(([id, label]) => <button key={id} type="button" aria-pressed={tab === id} className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === id ? "bg-[#6d4dff] text-white" : "bg-white text-muted-foreground"}`} onClick={() => setTab(id)}>{label}</button>)}
    </div>
    {(tab === "overview" || tab === "transactions") && <div className={tab === "overview" ? "grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_320px]" : ""}>
      <section className="rounded-3xl bg-white p-4 shadow-sm">
        <div className="mb-2 flex flex-wrap items-center gap-3"><h2 className="flex items-center gap-2 font-bold"><BarChart3 className="h-4 w-4 text-[#6d4dff]" />Transaction Volume</h2><span className="ml-auto flex flex-wrap gap-3 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#7c4dff]" />Buy Volume</span><span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#d8ccff]" />Sell Volume</span><span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#3b82f6]" />Total Volume</span></span></div>
        <VolumeBars />
      </section>
      {tab === "overview" && <section className="rounded-3xl bg-white p-4 shadow-sm"><h2 className="mb-3 flex items-center gap-2 font-bold"><PieChart className="h-4 w-4 text-[#6d4dff]" />Volume by Asset</h2><div className="flex flex-wrap items-center gap-3"><ReportDonut /><ul className="space-y-1 text-sm">{REPORT_ASSETS.map(item => <li key={item.symbol} className="grid grid-cols-[14px_52px_auto_auto] items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} /><span className="font-semibold">{item.symbol}</span><span className="text-muted-foreground">{item.share}%</span><span>{adminMoney(item.value)}</span></li>)}</ul></div></section>}
    </div>}
    {(tab === "overview" || tab === "users") && <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <section className="rounded-3xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-bold">Key Performance Metrics</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{REPORT_KPIS.map(item => <article key={item.label} className="rounded-2xl bg-[#f7f8fc] p-4"><p className="text-xs text-muted-foreground">{item.label}</p><p className="mt-2 text-2xl font-extrabold">{item.value}</p><p className="mt-2 text-xs font-bold text-emerald-600">↑ +{item.change.toFixed(1)}%</p></article>)}</div>
      </section>
      <section className="rounded-3xl bg-white p-4 shadow-sm"><div className="mb-2 flex items-center justify-between"><h2 className="font-bold">Users Growth</h2><span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700">↑ +14.9%</span></div><GrowthLine /></section>
    </div>}
    {tab === "assets" && <section className="rounded-3xl bg-white p-4 shadow-sm"><h2 className="mb-3 font-bold">Assets Report</h2><div className="flex flex-wrap items-center gap-6"><ReportDonut /><table className="min-w-80 flex-1 text-left text-sm"><thead className="text-xs text-muted-foreground"><tr>{["Asset", "Share", "Volume"].map(heading => <th key={heading} className="py-2 font-medium">{heading}</th>)}</tr></thead><tbody>{REPORT_ASSETS.map(item => <tr key={item.symbol} className="border-t"><td className="py-2 font-semibold">{item.symbol}</td><td className="py-2">{item.share}%</td><td className="py-2">{adminMoney(item.value)}</td></tr>)}</tbody></table></div></section>}
    {tab === "treasury" && <section className="grid gap-4 md:grid-cols-3">{[["Total treasury", TREASURY_PAGE.total], ["Reserves", TREASURY_PAGE.reserves], ["Hot liquidity", TREASURY_PAGE.hot]].map(([label, value]) => <article key={String(label)} className="rounded-3xl bg-white p-5 shadow-sm"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-extrabold">{adminMoney(Number(value))}</p></article>)}<p className="text-sm text-muted-foreground md:col-span-3">Sample treasury totals for {REPORT_PERIOD}. This report does not move funds.</p></section>}
    {tab === "earn" && <section className="grid gap-3 sm:grid-cols-2">{[["BTC Earn", "4.2% sample APY"], ["USDT Earn", "6.0% sample APY"], ["SOL Earn", "5.1% sample APY"], ["ETH Earn", "3.4% sample APY"]].map(([name, rate]) => <article key={name} className="rounded-3xl bg-white p-5 shadow-sm"><p className="font-bold">{name}</p><p className="text-sm text-muted-foreground">{rate}</p></article>)}<p className="text-sm text-muted-foreground sm:col-span-2">Sample earn products. Rewards are not added to a wallet.</p></section>}
    {tab === "revenue" && <section className="grid gap-4 md:grid-cols-3"><article className="rounded-3xl bg-white p-5 shadow-sm"><p className="text-sm text-muted-foreground">Revenue</p><p className="mt-2 text-2xl font-extrabold">{adminMoney(REPORT_SUMMARY.revenue)}</p></article><article className="rounded-3xl bg-white p-5 shadow-sm"><p className="text-sm text-muted-foreground">Profit</p><p className="mt-2 text-2xl font-extrabold">{adminMoney(REPORT_SUMMARY.profit)}</p></article><article className="rounded-3xl bg-white p-5 shadow-sm"><p className="text-sm text-muted-foreground">Sample remainder</p><p className="mt-2 text-2xl font-extrabold">{adminMoney(REPORT_SUMMARY.revenue - REPORT_SUMMARY.profit)}</p></article><p className="text-sm text-muted-foreground md:col-span-3">Sample revenue and profit for {REPORT_PERIOD}. No payout was made.</p></section>}
    {tab === "custom" && <form className="max-w-lg space-y-4 rounded-3xl bg-white p-5 shadow-sm" onSubmit={createReport}><h2 className="font-bold">Custom Report</h2><Field name="name" label="Report name" defaultValue="Custom sample report" /><label className="block text-sm">Type<select name="type" className="mt-1 h-11 w-full rounded-md border bg-card px-3"><option>Custom</option><option>Transactions</option><option>Users</option><option>Assets</option><option>Treasury</option><option>Finance</option><option>Earn</option></select></label><Button type="submit" className="rounded-xl bg-[#6d4dff] hover:bg-[#6d4dff]/90">Create sample report</Button><p className="text-xs text-muted-foreground">The file uses the sample totals on this page. Customer activity is not exported.</p></form>}
    {tab === "overview" && <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">{reportTable}{actions}</div>}
    {notice && <p role="status" className="text-sm text-muted-foreground">{notice}</p>}
    <Dialog open={generating} onOpenChange={setGenerating}><DialogContent className="max-w-md rounded-3xl"><form className="space-y-4" onSubmit={createReport}><DialogHeader><DialogTitle>Generate Report</DialogTitle><DialogDescription>The file stays a sample for {REPORT_PERIOD}.</DialogDescription></DialogHeader><Field name="name" label="Report name" defaultValue="Platform summary" /><label className="block text-sm">Type<select name="type" className="mt-1 h-11 w-full rounded-md border bg-card px-3"><option>Transactions</option><option>Users</option><option>Assets</option><option>Treasury</option><option>Finance</option><option>Earn</option><option>Custom</option></select></label><Button type="submit" className="h-11 w-full">Create sample report</Button></form></DialogContent></Dialog>
    <Dialog open={scheduling} onOpenChange={setScheduling}><DialogContent className="max-w-md rounded-3xl"><form className="space-y-4" onSubmit={event => { event.preventDefault(); setScheduling(false); setNotice(`Schedule saved as ${String(new FormData(event.currentTarget).get("when"))}. This preview does not send the report.`); }}><DialogHeader><DialogTitle>Schedule Report</DialogTitle><DialogDescription>The schedule stays in this preview.</DialogDescription></DialogHeader><label className="block text-sm">Repeat<select name="when" className="mt-1 h-11 w-full rounded-md border bg-card px-3"><option>Weekly</option><option>Daily</option><option>Monthly</option></select></label><Button type="submit" className="h-11 w-full">Save preview</Button></form></DialogContent></Dialog>
    <Dialog open={apiOpen} onOpenChange={setApiOpen}><DialogContent className="max-w-md rounded-3xl"><DialogHeader><DialogTitle>API Analytics</DialogTitle><DialogDescription>Sample counts for this preview.</DialogDescription></DialogHeader><dl className="space-y-2 text-sm"><Info label="Sample reads" value="12,480" /><Info label="Sample writes" value="0" /></dl><p className="text-sm text-muted-foreground">No API key is stored and no external service is contacted.</p></DialogContent></Dialog>
    <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}><DialogContent className="max-w-md rounded-3xl"><form className="space-y-4" onSubmit={event => { event.preventDefault(); setFormat(String(new FormData(event.currentTarget).get("format"))); setSettingsOpen(false); setNotice("Report settings saved in this preview only."); }}><DialogHeader><DialogTitle>Report Settings</DialogTitle><DialogDescription>Downloads use the format saved here.</DialogDescription></DialogHeader><label className="block text-sm">Format<select name="format" defaultValue={format} className="mt-1 h-11 w-full rounded-md border bg-card px-3"><option>CSV</option></select></label><Button type="submit" className="h-11 w-full">Save preview</Button></form></DialogContent></Dialog>
  </section>;
}

function reportCsv(report: PlatformReport) {
  const rows = ["Metric,Value", `Report,${report.name}`, `Period,${report.period}`];
  if (report.type === "Users") rows.push(`Users,${REPORT_SUMMARY.users}`);
  else if (report.type === "Assets") REPORT_ASSETS.forEach(item => rows.push(`${item.symbol},${item.value}`));
  else if (report.type === "Treasury") rows.push(`Treasury,${TREASURY_PAGE.total}`, `Reserves,${TREASURY_PAGE.reserves}`);
  else if (report.type === "Finance") rows.push(`Revenue,${REPORT_SUMMARY.revenue}`, `Profit,${REPORT_SUMMARY.profit}`);
  else if (report.type === "Earn") rows.push("BTC Earn,4.2%", "USDT Earn,6.0%");
  else rows.push(`Volume,${REPORT_SUMMARY.volume}`, `Transactions,${REPORT_SUMMARY.transactions}`);
  return rows.join("\n");
}

function VolumeBars() {
  const width = 640;
  const height = 250;
  const padL = 52;
  const padB = 28;
  const padT = 12;
  const max = 2_500_000;
  const innerW = width - padL - 12;
  const innerH = height - padT - padB;
  const step = innerW / REPORT_VOLUME.length;
  const y = (value: number) => padT + innerH - (value / max) * innerH;
  const ticks = [0, 500_000, 1_000_000, 1_500_000, 2_000_000, 2_500_000];
  const labels = ["$0", "$500K", "$1.0M", "$1.5M", "$2.0M", "$2.5M"];
  const line = REPORT_VOLUME.map((point, index) => `${padL + step * index + step / 2},${y(point.total)}`).join(" ");
  return <svg viewBox={`0 0 ${width} ${height}`} className="h-64 w-full min-w-[520px]" role="img" aria-label="Sample transaction volume from Oct 25 to Nov 1">{ticks.map((tick, index) => <g key={tick}><line x1={padL} x2={width - 8} y1={y(tick)} y2={y(tick)} stroke="#eef0f6" /><text x={padL - 6} y={y(tick) + 3} textAnchor="end" fontSize="10" fill="#94a3b8">{labels[index]}</text></g>)}{REPORT_VOLUME.map((point, index) => { const x = padL + step * index + step * 0.22; const barW = step * 0.5; const buyH = (point.buy / max) * innerH; const sellH = (point.sell / max) * innerH; const base = padT + innerH; return <g key={point.label}><rect x={x} y={base - buyH - sellH} width={barW} height={sellH} rx="3" fill="#d8ccff" /><rect x={x} y={base - buyH} width={barW} height={buyH} fill="#7c4dff" /><text x={x + barW / 2} y={height - 8} textAnchor="middle" fontSize="10" fill="#94a3b8">{point.label}</text></g>; })}<polyline points={line} fill="none" stroke="#3b82f6" strokeWidth="2.5" />{REPORT_VOLUME.map((point, index) => <circle key={point.label} cx={padL + step * index + step / 2} cy={y(point.total)} r="3.5" fill="#3b82f6" />)}</svg>;
}

function GrowthLine() {
  const width = 320;
  const height = 160;
  const pad = 28;
  const min = 500_000;
  const max = 700_000;
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;
  const y = (value: number) => pad + innerH - ((value - min) / (max - min)) * innerH;
  const coords = REPORT_GROWTH.map((point, index) => [pad + (index * innerW) / (REPORT_GROWTH.length - 1), y(point.users)] as const);
  const line = coords.map(point => point.join(",")).join(" ");
  const area = `M ${coords[0][0]},${height - pad} L ${line} L ${coords[coords.length - 1][0]},${height - pad} Z`;
  return <svg viewBox={`0 0 ${width} ${height}`} className="h-40 w-full" role="img" aria-label="Sample user growth from Oct 25 to Nov 1"><text x="4" y="16" fontSize="9" fill="#94a3b8">700K</text><text x="4" y={height - 18} fontSize="9" fill="#94a3b8">500K</text><path d={area} fill="#7c4dff" opacity="0.15" /><polyline points={line} fill="none" stroke="#7c4dff" strokeWidth="2" />{REPORT_GROWTH.filter((_, index) => index % 2 === 0 || index === REPORT_GROWTH.length - 1).map(point => { const index = REPORT_GROWTH.indexOf(point); return <text key={point.label} x={coords[index][0]} y={height - 6} textAnchor="middle" fontSize="9" fill="#94a3b8">{point.label}</text>; })}</svg>;
}

const REFERRAL_STAMP = "Nov 2, 2026, 03:00 PM";

export function ReferralManagement() {
  const [tab, setTab] = useState<"overview" | "referrers" | "users" | "commissions" | "rewards" | "campaigns" | "settings">("overview");
  const [enabled, setEnabled] = useState(true);
  const [commissionType, setCommissionType] = useState("Percentage (%)");
  const [rate, setRate] = useState("0.50");
  const [reward, setReward] = useState("5.00");
  const [payout, setPayout] = useState("Auto (Wallet Credit)");
  const [campaigns, setCampaigns] = useState(REFERRAL_CAMPAIGNS);
  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState<ReferralCampaign | null>(null);
  const [qrOpen, setQrOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const needle = query.trim().toLowerCase();
  const referrers = TOP_REFERRERS.filter(row => `${row.name} ${row.initials}`.toLowerCase().includes(needle));
  const commissions = REFERRAL_COMMISSIONS.filter(row => `${row.referrer} ${row.user} ${row.type}`.toLowerCase().includes(needle));

  function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(enabled ? "Settings saved in this preview. No wallet was credited and no reward was paid." : "Referral program paused in this preview. No wallet was credited and no reward was paid.");
  }

  function exportCsv() {
    const rows = ["Metric,Value", `Total Referrals,${REFERRAL_SUMMARY.total}`, `Active Referrers,${REFERRAL_SUMMARY.activeReferrers}`, `Referred Users,${REFERRAL_SUMMARY.referredUsers}`, `Total Commissions,${REFERRAL_SUMMARY.commissions}`, `Rewards Paid,${REFERRAL_SUMMARY.rewardsPaid}`, "Referrer,Referrals,Commission", ...TOP_REFERRERS.map(row => `${row.name},${row.referrals},${row.commission}`)];
    download("basecola-referral-summary.csv", rows.join("\n"));
    setNotice("Downloaded a sample referral report. It is not a live export, and no reward was paid.");
  }

  async function copyText(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setNotice(`${label} copied. Sharing it does not create an account or pay a reward.`);
    } catch {
      setNotice(`Copy unavailable. The sample ${label.toLowerCase()} is ${value}.`);
    }
  }

  async function shareLink() {
    const text = "Join the Basecola demo with code MS1234. The referral reward is a sample and is not paid out.";
    if (navigator.share) {
      try {
        await navigator.share({ title: "Basecola referral", text });
        setNotice("Share sheet opened. No invite was sent and no reward was paid.");
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    await copyText(text, "Sample referral text");
  }

  function createCampaign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const next: ReferralCampaign = { id: `camp-${campaigns.length + 1}`, name: String(data.get("name")).trim(), detail: String(data.get("detail")).trim(), status: String(data.get("status")) as ReferralCampaign["status"] };
    setCampaigns(current => [next, ...current]);
    setCreating(false);
    setTab("campaigns");
    setNotice("Campaign saved in this preview. No code was issued and no reward was paid.");
  }

  function downloadQr() {
    const svg = document.querySelector("#referral-qr-wrap svg")?.outerHTML ?? "";
    if (!svg) { setNotice("QR download is unavailable in this preview."); return; }
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "basecola-referral-preview.svg";
    link.click();
    URL.revokeObjectURL(url);
    setNotice("Downloaded the preview QR. It is not a wallet address and cannot receive a deposit.");
  }

  const settingsCard = <form className="rounded-3xl bg-white p-5 shadow-sm" onSubmit={saveSettings}>
    <h2 className="mb-3 flex items-center gap-2 font-bold"><Settings className="h-4 w-4 text-[#6d4dff]" />Referral Program Settings</h2>
    <ToggleRow label="Enable Referral Program" checked={enabled} onChange={setEnabled} />
    <label className="mt-2 flex items-center justify-between gap-3 text-sm font-medium">Referral Commission Type<select name="type" value={commissionType} onChange={event => setCommissionType(event.target.value)} className="h-10 rounded-xl border bg-white px-3"><option>Percentage (%)</option><option>Fixed (USD)</option></select></label>
    <label className="mt-3 flex items-center justify-between gap-3 text-sm font-medium">Commission Rate<span className="flex items-center gap-2"><Input name="rate" value={rate} onChange={event => setRate(event.target.value)} className="h-10 w-24 bg-white" inputMode="decimal" required /><span>%</span></span></label>
    <label className="mt-3 flex items-center justify-between gap-3 text-sm font-medium">Reward for New User<span className="flex items-center gap-2"><span>$</span><Input name="reward" value={reward} onChange={event => setReward(event.target.value)} className="h-10 w-24 bg-white" inputMode="decimal" required /><span>USD</span></span></label>
    <label className="mt-3 flex items-center justify-between gap-3 text-sm font-medium">Commission Payout<select name="payout" value={payout} onChange={event => setPayout(event.target.value)} className="h-10 max-w-[180px] rounded-xl border bg-white px-3"><option>Auto (Wallet Credit)</option><option>Manual review</option></select></label>
    <Button type="submit" className="mt-4 h-11 w-full rounded-xl bg-[#6d4dff] hover:bg-[#6d4dff]/90">Save Settings</Button>
    <p className="mt-3 text-xs leading-relaxed text-muted-foreground">Saving keeps these values in this preview. Wallet credit does not add funds.</p>
  </form>;

  const linkCard = <section className="rounded-3xl bg-white p-5 shadow-sm">
    <h2 className="mb-3 flex items-center gap-2 font-bold"><Link2 className="h-4 w-4 text-[#6d4dff]" />Referral Link & Materials</h2>
    <label className="block text-sm font-medium">Your Referral Link<span className="mt-1 flex items-center gap-2"><Input readOnly value={REFERRAL_LINK} className="h-10 bg-[#f7f8fc]" aria-label="Your referral link" /><button type="button" aria-label="Copy referral link" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border" onClick={() => copyText(REFERRAL_LINK, "Sample referral link")}><Copy className="h-4 w-4" /></button></span></label>
    <label className="mt-3 block text-sm font-medium">Referral Code<span className="mt-1 flex items-center gap-2"><Input readOnly value={REFERRAL_PROGRAM_CODE} className="h-10 bg-[#f7f8fc]" aria-label="Referral code" /><button type="button" aria-label="Copy referral code" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border" onClick={() => copyText(REFERRAL_PROGRAM_CODE, "Sample referral code")}><Copy className="h-4 w-4" /></button></span></label>
    <div className="mt-4 grid gap-2 sm:grid-cols-2"><Button type="button" variant="outline" className="h-11 rounded-xl" onClick={() => setQrOpen(true)}><QrCode className="h-4 w-4" />Download QR Code</Button><Button type="button" variant="outline" className="h-11 rounded-xl" onClick={shareLink}><Share2 className="h-4 w-4" />Share Link</Button></div>
    <p className="mt-3 text-xs leading-relaxed text-muted-foreground">This preview link does not open a live signup. The QR code is not a wallet address and cannot receive a deposit.</p>
  </section>;

  const campaignCard = (all: boolean) => <section className="rounded-3xl bg-white p-5 shadow-sm">
    <div className="mb-3 flex items-center justify-between"><h2 className="flex items-center gap-2 font-bold"><Megaphone className="h-4 w-4 text-[#6d4dff]" />Referral Campaigns</h2>{!all && <button type="button" className="text-sm font-semibold text-[#6d4dff]" onClick={() => setTab("campaigns")}>View All</button>}</div>
    <ul className="space-y-3">{(all ? campaigns : campaigns.slice(0, 4)).map(campaign => <li key={campaign.id} className="flex items-center gap-3"><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${campaign.name.includes("Trading") ? "bg-sky-50 text-sky-600" : "bg-[#f3eefe] text-[#6d4dff]"}`}>{campaign.name.includes("Trading") ? <ArrowLeftRight className="h-4 w-4" /> : <Gift className="h-4 w-4" />}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{campaign.name}</span><span className="block truncate text-xs text-muted-foreground">{campaign.detail}</span></span><Pill tone={campaign.status === "Active" ? "green" : campaign.status === "Scheduled" ? "blue" : "amber"}>{campaign.status}</Pill><DropdownMenu><DropdownMenuTrigger asChild><button type="button" aria-label={`${campaign.name} actions`} className="px-1 text-lg leading-none text-muted-foreground">···</button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => setViewing(campaign)}>View</DropdownMenuItem><DropdownMenuItem onClick={() => { setCampaigns(current => current.map(item => item.id === campaign.id ? { ...item, status: item.status === "Paused" ? "Active" : "Paused" } : item)); setNotice(`${campaign.name} updated in this preview. No reward was paid.`); }}>{campaign.status === "Paused" ? "Resume" : "Pause"}</DropdownMenuItem></DropdownMenuContent></DropdownMenu></li>)}</ul>
  </section>;

  const referrerTable = (all: boolean) => <section className="overflow-x-auto rounded-3xl bg-white shadow-sm">
    <div className="flex items-center justify-between px-4 py-4"><h2 className="flex items-center gap-2 font-bold"><Trophy className="h-4 w-4 text-[#6d4dff]" />Top Referrers</h2>{!all && <button type="button" className="text-sm font-semibold text-[#6d4dff]" onClick={() => setTab("referrers")}>View All</button>}</div>
    <table className="w-full min-w-[520px] text-left text-sm"><thead className="text-xs text-muted-foreground"><tr><th className="px-4 py-2">#</th><th className="px-4 py-2">User</th><th className="px-4 py-2">Referrals</th><th className="px-4 py-2">Total Commission (USD)</th><th className="px-4 py-2">Status</th></tr></thead><tbody>{referrers.map((row, index) => <tr key={row.id} className="border-t"><td className="px-4 py-3 text-muted-foreground">{index + 1}</td><td className="px-4 py-3"><span className="flex items-center gap-2"><span className={`grid h-8 w-8 place-items-center rounded-full text-xs font-bold ${AVATAR[row.initials] ?? "bg-slate-100"}`}>{row.initials}</span><span className="font-semibold">{row.name}</span></span></td><td className="px-4 py-3">{adminCount(row.referrals)}</td><td className="px-4 py-3">{adminMoney(row.commission, 2)}</td><td className="px-4 py-3"><Pill tone="green">{row.status}</Pill></td></tr>)}</tbody></table>
    {referrers.length === 0 && <p className="px-4 py-6 text-sm text-muted-foreground">No sample referrers match that search.</p>}
  </section>;

  const commissionTable = (all: boolean) => <section className="overflow-x-auto rounded-3xl bg-white shadow-sm">
    <div className="flex items-center justify-between px-4 py-4"><h2 className="flex items-center gap-2 font-bold"><BarChart3 className="h-4 w-4 text-[#6d4dff]" />Recent Referral Commissions</h2>{!all && <button type="button" className="text-sm font-semibold text-[#6d4dff]" onClick={() => setTab("commissions")}>View All</button>}</div>
    <table className="w-full min-w-[680px] text-left text-sm"><thead className="text-xs text-muted-foreground"><tr><th className="px-4 py-2">#</th><th className="px-4 py-2">Referrer</th><th className="px-4 py-2">Referred User</th><th className="px-4 py-2">Commission (USD)</th><th className="px-4 py-2">Type</th><th className="px-4 py-2">Status</th><th className="px-4 py-2">Date & Time</th></tr></thead><tbody>{commissions.map((row, index) => <tr key={row.id} className="border-t"><td className="px-4 py-3 text-muted-foreground">{index + 1}</td><td className="px-4 py-3"><span className="flex items-center gap-2"><span className={`grid h-8 w-8 place-items-center rounded-full text-xs font-bold ${AVATAR[row.initials] ?? "bg-slate-100"}`}>{row.initials}</span><span className="font-semibold">{row.referrer}</span></span></td><td className="px-4 py-3">{row.user}</td><td className="px-4 py-3">{adminMoney(row.amount, 2)}</td><td className="px-4 py-3"><Pill tone={row.type === "Signup" ? "violet" : row.type === "Trading" ? "blue" : "green"}>{row.type}</Pill></td><td className="px-4 py-3"><Pill tone={row.status === "Paid" ? "green" : "amber"}>{row.status}</Pill></td><td className="px-4 py-3 text-muted-foreground">{row.date}</td></tr>)}</tbody></table>
    {commissions.length === 0 && <p className="px-4 py-6 text-sm text-muted-foreground">No sample commissions match that search.</p>}
  </section>;

  return <section className="space-y-4">
    <div className="flex flex-wrap items-center gap-2">
      {([["overview", "Overview"], ["referrers", "Referrers"], ["users", "Referred Users"], ["commissions", "Commissions"], ["rewards", "Rewards"], ["campaigns", "Campaigns"], ["settings", "Settings"]] as const).map(([id, label]) => <button key={id} type="button" aria-pressed={tab === id} className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === id ? "bg-[#6d4dff] text-white" : "bg-white text-muted-foreground"}`} onClick={() => { setTab(id); setQuery(""); }}>{label}</button>)}
      <div className="ml-auto flex gap-2"><Button type="button" variant="outline" className="h-10 rounded-xl bg-white" onClick={exportCsv}><Download className="h-4 w-4" />Export</Button><Button type="button" className="h-10 rounded-xl bg-[#6d4dff] hover:bg-[#6d4dff]/90" onClick={() => setCreating(true)}><Plus className="h-4 w-4" />Create Campaign</Button></div>
    </div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <PriceStat label="Total Referrals" value={adminCount(REFERRAL_SUMMARY.total)} icon={Users} tone="total" foot={<span className="rounded-full bg-white/20 px-2 py-1 text-xs font-bold">↑ +{REFERRAL_SUMMARY.totalChange.toFixed(1)}%</span>} />
      <PriceStat label="Active Referrers" value={adminCount(REFERRAL_SUMMARY.activeReferrers)} icon={UserPlus} tone="treasury" foot={<span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700">↑ +{REFERRAL_SUMMARY.activeChange.toFixed(1)}%</span>} />
      <PriceStat label="Referred Users" value={adminCount(REFERRAL_SUMMARY.referredUsers)} icon={Users} tone="locked" foot={<span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700">↑ +{REFERRAL_SUMMARY.referredChange.toFixed(1)}%</span>} />
      <PriceStat label="Total Commissions" value={adminMoney(REFERRAL_SUMMARY.commissions)} icon={Layers} tone="share" foot={<span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700">↑ +{REFERRAL_SUMMARY.commissionsChange.toFixed(1)}%</span>} />
      <article className="rounded-3xl bg-[#fde8f4] p-5"><span className="flex items-center gap-2 text-sm font-medium opacity-80"><Gift className="h-4 w-4" />Rewards Paid</span><p className="mt-3 text-2xl font-extrabold">{adminMoney(REFERRAL_SUMMARY.rewardsPaid)}</p><div className="mt-3"><span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700">↑ +{REFERRAL_SUMMARY.rewardsChange.toFixed(1)}%</span></div></article>
    </div>
    {(tab === "referrers" || tab === "users" || tab === "commissions") && <label className="flex h-11 max-w-md items-center gap-2 rounded-xl border bg-white px-3 text-sm"><Search className="h-4 w-4 text-muted-foreground" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder={tab === "commissions" ? "Search commissions" : tab === "users" ? "Search referred users" : "Search referrers"} className="w-full bg-transparent outline-none" aria-label={tab === "commissions" ? "Search commissions" : tab === "users" ? "Search referred users" : "Search referrers"} /></label>}
    {tab === "overview" && <>
      <div className="grid gap-4 xl:grid-cols-5">
        <section className="rounded-3xl bg-white p-5 shadow-sm xl:col-span-3">
          <div className="mb-3 flex flex-wrap items-center gap-3"><h2 className="flex items-center gap-2 font-bold"><BarChart3 className="h-4 w-4 text-[#6d4dff]" />Referral Performance</h2><span className="ml-auto flex items-center gap-3 text-xs text-muted-foreground"><span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#7c4dff]" />Referrals</span><span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#d8ccff]" />Commissions (USD)</span></span></div>
          <ReferralChart />
        </section>
        <section className="rounded-3xl bg-white p-5 shadow-sm xl:col-span-2">
          <h2 className="mb-3 flex items-center gap-2 font-bold"><PieChart className="h-4 w-4 text-[#6d4dff]" />Referral Summary</h2>
          <div className="flex flex-wrap items-center gap-4"><ReferralDonut /><ul className="min-w-[180px] flex-1 space-y-2 text-sm">{REFERRAL_MIX.map(item => <li key={item.label} className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} /><span>{item.label}</span><span className="ml-auto font-semibold">{adminCount(item.count)}</span><span className="w-12 text-right text-muted-foreground">{item.share.toFixed(1)}%</span></li>)}</ul></div>
        </section>
      </div>
      <div className="grid gap-4 xl:grid-cols-3">{settingsCard}{linkCard}{campaignCard(false)}</div>
      <div className="grid gap-4 xl:grid-cols-2">{referrerTable(false)}{commissionTable(false)}</div>
    </>}
    {tab === "referrers" && referrerTable(true)}
    {tab === "users" && <section className="overflow-x-auto rounded-3xl bg-white shadow-sm"><div className="px-4 py-4"><h2 className="font-bold">Referred Users</h2></div><table className="w-full min-w-[560px] text-left text-sm"><thead className="text-xs text-muted-foreground"><tr><th className="px-4 py-2">Referred User</th><th className="px-4 py-2">Referrer</th><th className="px-4 py-2">Status</th><th className="px-4 py-2">Date & Time</th></tr></thead><tbody>{commissions.map(row => <tr key={row.id} className="border-t"><td className="px-4 py-3 font-semibold">{row.user}</td><td className="px-4 py-3">{row.referrer}</td><td className="px-4 py-3"><Pill tone={row.status === "Paid" ? "green" : "amber"}>{row.status === "Paid" ? "Rewarded" : "Pending"}</Pill></td><td className="px-4 py-3 text-muted-foreground">{row.date}</td></tr>)}</tbody></table><p className="px-4 py-3 text-xs text-muted-foreground">Sample referred users from the commission list. No account was created.</p></section>}
    {tab === "commissions" && commissionTable(true)}
    {tab === "rewards" && <section className="grid gap-3 sm:grid-cols-2"><article className="rounded-3xl bg-white p-5 shadow-sm"><p className="font-bold">New user reward</p><p className="mt-1 text-2xl font-extrabold">${reward}</p><p className="text-sm text-muted-foreground">Sample amount for a new signup.</p></article><article className="rounded-3xl bg-white p-5 shadow-sm"><p className="font-bold">Trading referral</p><p className="mt-1 text-2xl font-extrabold">0.05%</p><p className="text-sm text-muted-foreground">Sample share of trading fees.</p></article><article className="rounded-3xl bg-white p-5 shadow-sm"><p className="font-bold">Invest & Earn referral</p><p className="mt-1 text-2xl font-extrabold">1.00%</p><p className="text-sm text-muted-foreground">Sample share of an investment amount.</p></article><article className="rounded-3xl bg-white p-5 shadow-sm"><p className="font-bold">Seasonal promo</p><p className="mt-1 text-2xl font-extrabold">$10</p><p className="text-sm text-muted-foreground">Extra sample amount per referral.</p></article><p className="text-sm text-muted-foreground sm:col-span-2">Rewards stay on this screen. They are not added to a wallet.</p></section>}
    {tab === "campaigns" && campaignCard(true)}
    {tab === "settings" && <div className="max-w-xl">{settingsCard}</div>}
    {notice && <p role="status" className="text-sm text-muted-foreground">{notice}</p>}
    <p className="text-xs leading-relaxed text-muted-foreground">Sample referral figures for Oct 25 – Nov 1, 2026. Recorded at {REFERRAL_STAMP}. No invite is sent and no reward is paid.</p>
    <Dialog open={creating} onOpenChange={setCreating}><DialogContent className="max-w-md rounded-3xl"><form className="space-y-4" onSubmit={createCampaign}><DialogHeader><DialogTitle>Create Campaign</DialogTitle><DialogDescription>The campaign stays in this preview. No code is issued.</DialogDescription></DialogHeader><Field name="name" label="Campaign name" defaultValue="Weekend referral bonus" /><Field name="detail" label="Offer" defaultValue="Extra $5 per referral" /><label className="block text-sm">Status<select name="status" className="mt-1 h-11 w-full rounded-md border bg-card px-3"><option>Active</option><option>Scheduled</option></select></label><Button type="submit" className="h-11 w-full">Save preview</Button></form></DialogContent></Dialog>
    <Dialog open={!!viewing} onOpenChange={open => { if (!open) setViewing(null); }}><DialogContent className="max-w-md rounded-3xl">{viewing && <><DialogHeader><DialogTitle>{viewing.name}</DialogTitle><DialogDescription>{viewing.detail}</DialogDescription></DialogHeader><Info label="Status" value={viewing.status} /><p className="text-sm text-muted-foreground">This campaign is a preview. No reward was paid.</p></>}</DialogContent></Dialog>
    <Dialog open={qrOpen} onOpenChange={setQrOpen}><DialogContent className="max-w-sm rounded-3xl"><DialogHeader><DialogTitle>Demo QR code</DialogTitle><DialogDescription>This identifier is not a wallet address and cannot receive a deposit.</DialogDescription></DialogHeader><div id="referral-qr-wrap" className="mx-auto w-fit rounded-2xl border bg-white p-3"><QRCodeSVG value={REFERRAL_QR} size={168} level="H" title="Referral preview code, not a wallet address" bgColor="#ffffff" fgColor="#1b1240" /></div><p className="break-all text-center text-xs text-muted-foreground">{REFERRAL_QR}</p><Button type="button" className="h-11 w-full" onClick={downloadQr}>Download QR Code</Button></DialogContent></Dialog>
  </section>;
}

function ReferralChart() {
  const width = 640;
  const height = 250;
  const padL = 42;
  const padR = 46;
  const padB = 28;
  const padT = 12;
  const max = 100_000;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;
  const step = innerW / REFERRAL_SERIES.length;
  const y = (value: number) => padT + innerH - (value / max) * innerH;
  const ticks = [0, 20_000, 40_000, 60_000, 80_000, 100_000];
  const left = ["0", "20K", "40K", "60K", "80K", "100K"];
  const right = ["$0", "$20K", "$40K", "$60K", "$80K", "$100K"];
  const line = REFERRAL_SERIES.map((point, index) => `${padL + step * index + step / 2},${y(point.trend)}`).join(" ");
  return <svg viewBox={`0 0 ${width} ${height}`} className="h-64 w-full min-w-[520px]" role="img" aria-label="Sample referral performance from Oct 25 to Nov 1">{ticks.map((tick, index) => <g key={tick}><line x1={padL} x2={width - padR} y1={y(tick)} y2={y(tick)} stroke="#eef0f6" /><text x={padL - 6} y={y(tick) + 3} textAnchor="end" fontSize="10" fill="#94a3b8">{left[index]}</text><text x={width - padR + 6} y={y(tick) + 3} fontSize="10" fill="#94a3b8">{right[index]}</text></g>)}{REFERRAL_SERIES.map((point, index) => { const x = padL + step * index + step * 0.22; const barW = step * 0.5; const refH = (point.referrals / max) * innerH; const comH = (point.commissions / max) * innerH; const base = padT + innerH; return <g key={point.label}><rect x={x} y={base - refH - comH} width={barW} height={comH} rx="3" fill="#d8ccff" /><rect x={x} y={base - refH} width={barW} height={refH} fill="#7c4dff" /><text x={x + barW / 2} y={height - 8} textAnchor="middle" fontSize="10" fill="#94a3b8">{point.label}</text></g>; })}<polyline points={line} fill="none" stroke="#7c4dff" strokeWidth="2.5" />{REFERRAL_SERIES.map((point, index) => <circle key={point.label} cx={padL + step * index + step / 2} cy={y(point.trend)} r="3.5" fill="#7c4dff" />)}</svg>;
}

export function DepositsMonitoring() {
  const [tab, setTab] = useState<"all" | "pending" | "confirmed" | "failed" | "asset" | "user" | "network">("all");
  const [query, setQuery] = useState("");
  const [asset, setAsset] = useState("All Assets");
  const [status, setStatus] = useState("All Status");
  const [network, setNetwork] = useState("All Networks");
  const [refresh, setRefresh] = useState(true);
  const [selectedId, setSelectedId] = useState("dep-2");
  const [notice, setNotice] = useState("");
  const needle = query.trim().toLowerCase();
  const filtered = DEPOSIT_ROWS.filter(row => {
    const tabOk = tab === "pending" ? row.status === "Pending" : tab === "confirmed" ? row.status === "Confirmed" : tab === "failed" ? row.status === "Failed" : true;
    const text = `${row.user} ${row.asset} ${row.network} ${row.ref} ${row.code} ${row.address}`.toLowerCase();
    return tabOk && (asset === "All Assets" || row.asset === asset) && (status === "All Status" || row.status === status) && (network === "All Networks" || row.network === network) && text.includes(needle);
  });
  const selected = DEPOSIT_ROWS.find(row => row.id === selectedId) ?? DEPOSIT_ROWS[1];
  const networks = [...new Set(filtered.map(row => row.network))].map(name => ({ name, count: filtered.filter(row => row.network === name).length, usd: filtered.filter(row => row.network === name).reduce((sum, row) => sum + row.usd, 0) }));

  function exportCsv() {
    const rows = ["Ref,User,Asset,Amount,USD,Network,Status,Time,Preview identifier", ...filtered.map(row => `${row.ref},${row.user},${row.asset},${row.amount},${row.usd},${row.network},${row.status},${row.fullTime},${row.code}`)];
    download("basecola-deposits-sample.csv", rows.join("\n"));
    setNotice("Downloaded a sample deposit list. It is not a live export, and no deposit was credited.");
  }

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setNotice("Preview identifier copied. It is not a transaction hash or deposit address, and it cannot receive a deposit.");
    } catch {
      setNotice(`Copy unavailable. The preview identifier is ${code}.`);
    }
  }

  const table = <div className="overflow-x-auto"><table className="w-full min-w-[860px] text-left text-sm"><thead className="text-xs text-muted-foreground"><tr><th className="px-3 py-2">#</th><th className="px-3 py-2">User</th><th className="px-3 py-2">Asset</th><th className="px-3 py-2">Amount</th><th className="px-3 py-2">Network</th><th className="px-3 py-2">TxID (Hash)</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Time</th><th className="px-3 py-2">Actions</th></tr></thead><tbody>{filtered.map((row, index) => <tr key={row.id} className={`border-t ${row.id === selected.id ? "bg-[#f7f3ff]" : ""}`}><td className="px-3 py-3 text-muted-foreground">{index + 1}</td><td className="px-3 py-3"><span className="flex items-center gap-2"><span className={`grid h-8 w-8 place-items-center rounded-full text-xs font-bold ${AVATAR[row.initials] ?? "bg-slate-100"}`}>{row.initials}</span><span className="font-semibold">{row.user}</span></span></td><td className="px-3 py-3"><span className="flex items-center gap-2"><AssetMark symbol={row.asset} />{row.asset}</span></td><td className="px-3 py-3">{row.amount}</td><td className="px-3 py-3">{row.network}</td><td className="px-3 py-3 font-medium text-[#6d4dff]">{row.ref}</td><td className="px-3 py-3"><Pill tone={row.status === "Confirmed" ? "green" : row.status === "Pending" ? "amber" : "red"}>{row.status}</Pill></td><td className="px-3 py-3 text-muted-foreground">{row.time}</td><td className="px-3 py-3"><span className="flex items-center"><IconButton label={`View ${row.ref}`} onClick={() => setSelectedId(row.id)}><Eye className="h-4 w-4" /></IconButton><DropdownMenu><DropdownMenuTrigger asChild><button type="button" aria-label={`${row.ref} actions`} className="px-1 text-lg leading-none text-muted-foreground">···</button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => setSelectedId(row.id)}>View</DropdownMenuItem><DropdownMenuItem onClick={() => copyCode(row.code)}>Copy preview identifier</DropdownMenuItem></DropdownMenuContent></DropdownMenu></span></td></tr>)}{filtered.length === 0 && <tr><td colSpan={9} className="px-3 py-6 text-sm text-muted-foreground">No sample deposits match that search.</td></tr>}</tbody></table></div>;

  return <section className="space-y-4">
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <DepositStat label="Total Deposits" value={adminCount(DEPOSIT_MONITOR.total)} change={DEPOSIT_MONITOR.totalChange} tone="total" icon={ArrowDownToLine} />
      <DepositStat label="Total Amount (USD)" value={adminMoney(DEPOSIT_MONITOR.amount)} change={DEPOSIT_MONITOR.amountChange} tone="amount" icon={Layers} />
      <DepositStat label="Confirmed" value={adminCount(DEPOSIT_MONITOR.confirmed)} change={DEPOSIT_MONITOR.confirmedChange} tone="confirmed" icon={BadgeCheck} />
      <DepositStat label="Pending" value={adminCount(DEPOSIT_MONITOR.pending)} change={DEPOSIT_MONITOR.pendingChange} tone="pending" icon={Clock} />
      <DepositStat label="Failed" value={adminCount(DEPOSIT_MONITOR.failed)} change={DEPOSIT_MONITOR.failedChange} tone="failed" icon={Ban} />
    </div>
    <div className="flex flex-wrap items-center gap-2">
      {([["all", "All Deposits"], ["pending", `Pending (${adminCount(DEPOSIT_MONITOR.pending)})`], ["confirmed", `Confirmed (${adminCount(DEPOSIT_MONITOR.confirmed)})`], ["failed", `Failed (${adminCount(DEPOSIT_MONITOR.failed)})`], ["asset", "By Asset"], ["user", "By User"], ["network", "By Network"]] as const).map(([id, label]) => <button key={id} type="button" aria-pressed={tab === id} className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === id ? "bg-[#6d4dff] text-white" : "bg-white text-muted-foreground"}`} onClick={() => setTab(id)}>{label}</button>)}
      <Button type="button" variant="outline" className="ml-auto h-10 rounded-xl bg-white" onClick={exportCsv}><Download className="h-4 w-4" />Export</Button>
    </div>
    <div className="flex flex-wrap items-center gap-2">
      <label className="flex h-11 min-w-[240px] flex-1 items-center gap-2 rounded-xl border bg-white px-3 text-sm"><Search className="h-4 w-4 text-muted-foreground" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search by TxID, address, user (email/ID)..." className="w-full bg-transparent outline-none" aria-label="Search deposits" /></label>
      <select aria-label="Asset" value={asset} onChange={event => setAsset(event.target.value)} className="h-11 rounded-xl border bg-white px-3 text-sm">{["All Assets", "BTC", "ETH", "USDT", "USDC", "XRP", "SOL"].map(option => <option key={option}>{option}</option>)}</select>
      <select aria-label="Status" value={status} onChange={event => setStatus(event.target.value)} className="h-11 rounded-xl border bg-white px-3 text-sm">{["All Status", "Confirmed", "Pending", "Failed"].map(option => <option key={option}>{option}</option>)}</select>
      <select aria-label="Network" value={network} onChange={event => setNetwork(event.target.value)} className="h-11 rounded-xl border bg-white px-3 text-sm">{["All Networks", "Bitcoin", "Ethereum", "Tron", "ERC20", "XRP Ledger", "Solana", "Arbitrum", "BEP20"].map(option => <option key={option}>{option}</option>)}</select>
      <label className="flex h-11 items-center gap-2 rounded-xl border bg-white px-3 text-sm font-medium"><RefreshCw className="h-4 w-4 text-muted-foreground" />Auto Refresh (10s)<Switch checked={refresh} onCheckedChange={value => { setRefresh(value); setNotice(value ? "Auto refresh is on for this preview. No network was contacted, and no deposit was credited." : "Auto refresh is off. No network was contacted."); }} aria-label="Auto refresh" className="data-[state=checked]:bg-emerald-500" /></label>
    </div>
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <section className="overflow-hidden rounded-3xl bg-white shadow-sm">
        {(tab === "asset" || tab === "user" || tab === "network") ? <div className="p-4">
          {tab === "asset" && <ul className="space-y-3">{DEPOSIT_ASSETS.map(item => <li key={item.symbol} className="flex items-center gap-3 text-sm"><AssetMark symbol={item.symbol} /><span className="w-14 font-semibold">{item.symbol}</span><span className="h-2 flex-1 rounded-full bg-[#f4f5fb]"><span className="block h-2 rounded-full" style={{ width: `${item.share}%`, background: item.color }} /></span><span className="w-12 text-right text-muted-foreground">{item.share.toFixed(1)}%</span><span className="w-24 text-right font-semibold">{adminMoney(item.value)}</span></li>)}</ul>}
          {tab === "user" && table}
          {tab === "network" && <table className="w-full text-left text-sm"><thead className="text-xs text-muted-foreground"><tr><th className="px-3 py-2">Network</th><th className="px-3 py-2">Sample deposits</th><th className="px-3 py-2">Sample amount</th></tr></thead><tbody>{networks.map(item => <tr key={item.name} className="border-t"><td className="px-3 py-3 font-semibold">{item.name}</td><td className="px-3 py-3">{item.count}</td><td className="px-3 py-3">{adminMoney(item.usd, 2)}</td></tr>)}</tbody></table>}
          <p className="mt-3 text-xs text-muted-foreground">These groups use the sample rows on this page. The headline totals stay the labeled figures.</p>
        </div> : table}
        <p className="px-4 py-3 text-xs text-muted-foreground">Showing {filtered.length} sample deposits of {adminCount(DEPOSIT_MONITOR.total)}. The TxID is a preview identifier, not a transaction hash.</p>
      </section>
      <div className="space-y-4">
        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 font-bold"><PieChart className="h-4 w-4 text-[#6d4dff]" />Deposit Overview</h2>
          <div className="flex items-center gap-3"><DepositDonut /><ul className="space-y-2 text-sm"><li className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />Confirmed <span className="font-semibold">{adminCount(DEPOSIT_MONITOR.confirmed)}</span> <span className="text-muted-foreground">(97.8%)</span></li><li className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" />Pending <span className="font-semibold">{adminCount(DEPOSIT_MONITOR.pending)}</span> <span className="text-muted-foreground">(1.5%)</span></li><li className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-red-500" />Failed <span className="font-semibold">{adminCount(DEPOSIT_MONITOR.failed)}</span> <span className="text-muted-foreground">(0.4%)</span></li></ul></div>
        </section>
        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 font-bold"><ArrowDownToLine className="h-4 w-4 text-[#6d4dff]" />Deposit Details</h2>
          <dl className="space-y-3 text-sm">
            <Detail icon={Code} label="TxID (Hash)" value={selected.ref} />
            <div className="flex items-start justify-between gap-3"><dt className="text-muted-foreground">User</dt><dd className="flex items-center gap-2 font-semibold"><span className={`grid h-7 w-7 place-items-center rounded-full text-[10px] font-bold ${AVATAR[selected.initials] ?? "bg-slate-100"}`}>{selected.initials}</span>{selected.user}</dd></div>
            <Detail icon={Coins} label="Asset" value={selected.asset} />
            <Detail icon={Layers} label="Amount" value={`${selected.amount} ${selected.asset} (≈ ${adminMoney(selected.usd, 2)})`} />
            <Detail icon={Landmark} label="Network" value={selected.networkDetail} />
            <div className="flex items-center justify-between gap-3"><dt className="text-muted-foreground">Status</dt><dd><Pill tone={selected.status === "Confirmed" ? "green" : selected.status === "Pending" ? "amber" : "red"}>{selected.status}</Pill></dd></div>
            <Detail icon={BadgeCheck} label="Confirmations" value={selected.confirmations} />
            <Detail icon={Wallet} label="Deposit Address" value={selected.address} />
            <Detail icon={Clock} label="Time" value={selected.fullTime} />
          </dl>
          <p className="mt-3 break-all text-xs leading-relaxed text-muted-foreground">{selected.code}. This identifier is not a transaction hash or a deposit address, and it cannot receive a deposit.</p>
          <Button type="button" variant="outline" className="mt-3 h-10 w-full rounded-xl" onClick={() => copyCode(selected.code)}><Copy className="h-4 w-4" />Copy preview identifier</Button>
        </section>
      </div>
    </div>
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="rounded-3xl bg-white p-5 shadow-sm"><h2 className="mb-3 flex items-center gap-2 font-bold"><Activity className="h-4 w-4 text-[#6d4dff]" />Deposit Trend</h2><DepositTrend /></section>
      <section className="rounded-3xl bg-white p-5 shadow-sm"><h2 className="mb-3 font-bold">Top Deposit Assets</h2><ul className="space-y-3">{DEPOSIT_ASSETS.map(item => <li key={item.symbol} className="grid grid-cols-[88px_1fr_auto] items-center gap-3 text-sm"><span className="flex items-center gap-2 font-semibold"><AssetMark symbol={item.symbol} />{item.symbol}</span><span className="h-2 rounded-full bg-[#f4f5fb]"><span className="block h-2 rounded-full" style={{ width: `${item.share}%`, background: item.color }} /></span><span className="text-right"><span className="block text-xs text-muted-foreground">{item.share.toFixed(1)}%</span><span className="font-semibold">{adminMoney(item.value)}</span></span></li>)}</ul></section>
    </div>
    {notice && <p role="status" className="text-sm text-muted-foreground">{notice}</p>}
    <p className="text-xs leading-relaxed text-muted-foreground">Sample deposit figures for Oct 25 – Nov 1, 2026. No deposit was credited and customer balances are unchanged.</p>
  </section>;
}

function DepositStat({ label, value, change, tone, icon: Icon }: { label: string; value: string; change: number; tone: "total" | "amount" | "confirmed" | "pending" | "failed"; icon: typeof Wallet }) {
  const toneClass = { total: "bg-gradient-to-br from-[#7c4dff] to-[#9a6dff] text-white", amount: "bg-[#eef0fb]", confirmed: "bg-[#e7f8ef]", pending: "bg-[#fff4e8]", failed: "bg-[#fdecec]" }[tone];
  const up = change > 0;
  return <article className={`rounded-3xl p-5 ${toneClass}`}><span className="flex items-center gap-2 text-sm font-medium opacity-80"><Icon className="h-4 w-4" />{label}</span><p className="mt-3 text-2xl font-extrabold">{value}</p><p className={`mt-3 inline-flex rounded-full px-2 py-1 text-xs font-bold ${tone === "total" ? "bg-white/20" : up ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>{up ? "↑" : "↓"} {up ? "+" : ""}{change.toFixed(1)}%</p></article>;
}

function DepositTrend() {
  const width = 640;
  const height = 220;
  const padL = 52;
  const padB = 28;
  const padT = 12;
  const max = 1_200_000;
  const innerW = width - padL - 12;
  const innerH = height - padT - padB;
  const y = (value: number) => padT + innerH - (value / max) * innerH;
  const ticks = [0, 200_000, 400_000, 600_000, 800_000, 1_000_000, 1_200_000];
  const labels = ["$0", "$200K", "$400K", "$600K", "$800K", "$1.0M", "$1.2M"];
  const coords = DEPOSIT_TREND.map((point, index) => [padL + (index * innerW) / (DEPOSIT_TREND.length - 1), y(point.usd)] as const);
  const line = coords.map(point => point.join(",")).join(" ");
  const area = `M ${coords[0][0]},${padT + innerH} L ${line} L ${coords[coords.length - 1][0]},${padT + innerH} Z`;
  return <svg viewBox={`0 0 ${width} ${height}`} className="h-56 w-full min-w-[480px]" role="img" aria-label="Sample deposit trend from Oct 25 to Nov 1">{ticks.map((tick, index) => <g key={tick}><line x1={padL} x2={width - 8} y1={y(tick)} y2={y(tick)} stroke="#eef0f6" /><text x={padL - 6} y={y(tick) + 3} textAnchor="end" fontSize="10" fill="#94a3b8">{labels[index]}</text></g>)}<path d={area} fill="#7c4dff" opacity="0.18" /><polyline points={line} fill="none" stroke="#7c4dff" strokeWidth="2.5" />{DEPOSIT_TREND.map((point, index) => <text key={point.label} x={coords[index][0]} y={height - 8} textAnchor="middle" fontSize="10" fill="#94a3b8">{point.label}</text>)}</svg>;
}

function DepositDonut() {
  const parts = [{ count: DEPOSIT_MONITOR.confirmed, color: "#22c55e" }, { count: DEPOSIT_MONITOR.pending, color: "#f59e0b" }, { count: DEPOSIT_MONITOR.failed, color: "#ef4444" }];
  const total = parts.reduce((sum, part) => sum + part.count, 0);
  const radius = 42;
  const circ = 2 * Math.PI * radius;
  return <div className="relative h-32 w-32 shrink-0"><svg viewBox="0 0 120 120" className="h-full w-full">{parts.map((part, index) => { const start = parts.slice(0, index).reduce((sum, item) => sum + item.count, 0); const length = (part.count / total) * circ; return <circle key={part.color} cx="60" cy="60" r={radius} fill="none" stroke={part.color} strokeWidth="14" strokeDasharray={`${length} ${circ - length}`} strokeDashoffset={-((start / total) * circ)} transform="rotate(-90 60 60)" />; })}</svg><div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"><span className="text-sm font-extrabold leading-tight">{adminCount(DEPOSIT_MONITOR.total)}</span><span className="text-[10px] text-muted-foreground">Deposits</span></div></div>;
}

function ReferralDonut() {
  const radius = 46;
  const circ = 2 * Math.PI * radius;
  return <div className="relative h-36 w-36 shrink-0"><svg viewBox="0 0 120 120" className="h-full w-full">{REFERRAL_MIX.map((part, index) => { const start = REFERRAL_MIX.slice(0, index).reduce((sum, item) => sum + item.share, 0); const length = (part.share / 100) * circ; return <circle key={part.label} cx="60" cy="60" r={radius} fill="none" stroke={part.color} strokeWidth="14" strokeDasharray={`${length} ${circ - length}`} strokeDashoffset={-((start / 100) * circ)} transform="rotate(-90 60 60)" />; })}</svg><div className="absolute inset-0 flex flex-col items-center justify-center px-7 text-center"><span className="text-[11px] font-extrabold leading-tight">{adminCount(REFERRAL_SUMMARY.total)}</span><span className="text-[10px] text-muted-foreground">Total Referrals</span></div></div>;
}

function ReportDonut() {
  const radius = 46;
  const circ = 2 * Math.PI * radius;
  return <div className="relative h-36 w-36 shrink-0"><svg viewBox="0 0 120 120" className="h-full w-full">{REPORT_ASSETS.map((part, index) => { const start = REPORT_ASSETS.slice(0, index).reduce((sum, item) => sum + item.share, 0); const length = (part.share / 100) * circ; return <circle key={part.symbol} cx="60" cy="60" r={radius} fill="none" stroke={part.color} strokeWidth="14" strokeDasharray={`${length} ${circ - length}`} strokeDashoffset={-((start / 100) * circ)} transform="rotate(-90 60 60)" />; })}</svg><div className="absolute inset-0 flex flex-col items-center justify-center px-7 text-center"><span className="text-[11px] font-extrabold leading-tight">{adminMoney(REPORT_SUMMARY.volume)}</span><span className="text-[10px] text-muted-foreground">Total Volume</span></div></div>;
}

type SettingsTab = "general" | "policies" | "support" | "features" | "security" | "integrations" | "notifications" | "website" | "system";
type PolicyId = "privacy" | "terms" | "aml" | "kyc" | "refund";

const SETTINGS_TABS: { id: SettingsTab; label: string }[] = [
  { id: "general", label: "General" },
  { id: "policies", label: "Policies & Legal" },
  { id: "support", label: "Support & Contacts" },
  { id: "features", label: "Platform Features" },
  { id: "security", label: "Security" },
  { id: "integrations", label: "Integrations" },
  { id: "notifications", label: "Notifications" },
  { id: "system", label: "System" },
];

const POLICY_LABEL: Record<PolicyId, string> = { privacy: "Privacy Policy", terms: "Terms & Conditions", aml: "AML", kyc: "KYC", refund: "Refund" };

export function SettingsManagement() {
  const [tab, setTab] = useState<SettingsTab>("general");
  const [name, setName] = useState("Basecola");
  const [siteUrl, setSiteUrl] = useState("https://basecola.com");
  const [adminEmail, setAdminEmail] = useState("admin@basecola.com");
  const [supportEmail, setSupportEmail] = useState("support@basecola.com");
  const [phone, setPhone] = useState("+1 (503) 555-9842");
  const [whatsapp, setWhatsapp] = useState("+1 (503) 555-9842");
  const [helpUrl, setHelpUrl] = useState("https://basecola.com/help");
  const [language, setLanguage] = useState("English (EN)");
  const [timezone, setTimezone] = useState("(GMT+01:00) West Africa (Lagos)");
  const [live, setLive] = useState(true);
  const [primary, setPrimary] = useState("#7A00FF");
  const [secondary, setSecondary] = useState("#A855F7");
  const [accent, setAccent] = useState("#2563EB");
  const [theme, setTheme] = useState("Light (Default)");
  const [dark, setDark] = useState(true);
  const [logoName, setLogoName] = useState("");
  const [faviconName, setFaviconName] = useState("");
  const [apiDraft, setApiDraft] = useState("");
  const [previewing, setPreviewing] = useState(false);
  const [editor, setEditor] = useState<PolicyId | null>(null);
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState("");
  const [flags, setFlags] = useState<Record<string, boolean>>({ supportEmail: true, supportPhone: true, whatsapp: true, liveChat: true, helpCenter: true, registration: true, otc: true, kyc: true, deposits: true, twoFactor: true, emailNotes: true, referral: true, invest: true, sms: true, maintenance: false, admin2fa: true, loginAlert: true, inApp: true });
  const [cryptoWithdrawalsEnabled, setCryptoWithdrawalsEnabled] = useState(false);
  const [withdrawalFeeCaps, setWithdrawalFeeCaps] = useState<Record<string, string>>({
    cryptoWithdrawalFeeCapBitcoinUSD: "0",
    cryptoWithdrawalFeeCapEthereumUSD: "0",
    cryptoWithdrawalFeeCapSolanaUSD: "0",
    cryptoWithdrawalFeeCapXrplUSD: "0",
  });
  const [pages, setPages] = useState<Record<PolicyId, string>>({
    privacy: "This preview privacy note says settings stay in the browser. This screen does not collect customer data.",
    terms: "These preview terms say balances, quotes, and rewards are samples. No asset is bought, sold, or held.",
    aml: "Sample AML page. No identity check is sent to a provider.",
    kyc: "Sample KYC page. No document is uploaded or reviewed.",
    refund: "Sample refund page. No payment is returned.",
  });

  function toggle(key: string, value: boolean) {
    setFlags(current => ({ ...current, [key]: value }));
    void persist({ features: { [key]: value } }, key === "maintenance" ? (value ? "Maintenance mode switch saved as on." : "Maintenance mode switch saved as off.") : "Switch saved.");
  }

  const loadSettings = useServerFn(getPlatformSettings);
  const saveSettings = useServerFn(updatePlatformSettings);
  const [audit, setAudit] = useState<SettingsAuditRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  async function refresh() {
    const { settings: s, audit: log } = await loadSettings();
    const str = (o: Record<string, string | boolean>, k: string, set: (v: string) => void) => { if (typeof o[k] === "string") set(o[k] as string); };
    str(s.general, "name", setName); str(s.general, "siteUrl", setSiteUrl); str(s.general, "adminEmail", setAdminEmail); str(s.general, "language", setLanguage); str(s.general, "timezone", setTimezone);
    if (typeof s.general.live === "boolean") setLive(s.general.live);
    str(s.branding, "primary", setPrimary); str(s.branding, "secondary", setSecondary); str(s.branding, "accent", setAccent); str(s.branding, "theme", setTheme);
    if (typeof s.branding.dark === "boolean") setDark(s.branding.dark);
    str(s.support, "supportEmail", setSupportEmail); str(s.support, "phone", setPhone); str(s.support, "whatsapp", setWhatsapp); str(s.support, "helpUrl", setHelpUrl);
    setFlags(current => { const next = { ...current }; for (const [k, v] of Object.entries(s.features)) if (typeof v === "boolean") next[k] = v; return next; });
    setPages(current => { const next = { ...current }; for (const [k, v] of Object.entries(s.policies)) if (typeof v === "string" && v && k in next) next[k as PolicyId] = v; return next; });
    setCryptoWithdrawalsEnabled(s.policies.cryptoWithdrawalsEnabled === true);
    setWithdrawalFeeCaps(current => {
      const next = { ...current };
      for (const key of Object.keys(next)) {
        const value = s.policies[key];
        if (typeof value === "string") next[key] = value;
      }
      return next;
    });
    setAudit(log);
    setLoaded(true);
  }

  useEffect(() => { refresh().catch(error => setNotice(error instanceof Error ? error.message : "Could not load settings.")); }, []);

  async function persist(sections: Partial<Record<SettingsSection, Record<string, string | boolean>>>, message: string) {
    setSaving(true);
    try {
      for (const [section, value] of Object.entries(sections)) await saveSettings({ data: { section: section as SettingsSection, value: value!, note: `Updated from ${tab} tab` } });
      await refresh();
      setNotice(message);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not save settings.");
    } finally { setSaving(false); }
  }

  function save(event?: FormEvent) {
    event?.preventDefault();
    setApiDraft("");
    const general = { name, siteUrl, adminEmail, language, timezone, live };
    const branding = { primary, secondary, accent, theme, dark };
    const support = { supportEmail, phone, whatsapp, helpUrl };
    void persist({ general, branding, support, features: flags }, "Settings saved. All admins now see these values.");
  }

  function savePolicy(id: PolicyId, text: string) {
    setPages(current => ({ ...current, [id]: text }));
    void persist({ policies: { [id]: text } }, `${POLICY_LABEL[id]} saved.`);
  }

  function saveCryptoWithdrawalControls(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const caps = Object.fromEntries(
      Object.entries(withdrawalFeeCaps).map(([key, value]) => [key, value.trim()]),
    );
    if (Object.values(caps).some(value => !/^(?:0|[1-9]\d{0,7})(?:\.\d{1,2})?$/.test(value))) {
      setNotice("Enter valid USD fee caps with up to two decimal places.");
      return;
    }
    if (cryptoWithdrawalsEnabled && Object.values(caps).some(value => Number(value) <= 0)) {
      setNotice("Set a positive fee cap for every network before enabling withdrawals.");
      return;
    }
    void persist({
      policies: {
        cryptoWithdrawalsEnabled,
        cryptoWithdrawalPerRequestLimitUSD: "5000",
        cryptoWithdrawalDailyLimitUSD: "5000",
        cryptoWithdrawalRateLimitPerHour: "5",
        ...caps,
      },
    }, cryptoWithdrawalsEnabled
      ? "Crypto withdrawal controls saved and audited."
      : "Crypto withdrawals suspended and the change audited.");
  }

  function rememberFile(kind: "logo" | "favicon", file: File | undefined) {
    if (!file) return;
    if (kind === "logo") setLogoName(file.name);
    else setFaviconName(file.name);
    setNotice("File name kept in this browser preview. It is not published.");
  }

  function openEditor(id: PolicyId) {
    setEditor(id);
    setDraft(pages[id]);
  }

  const categories: { id: SettingsTab; label: string; detail: string; icon: typeof Settings }[] = [
    { id: "general", label: "General Settings", detail: "Site info, branding, language", icon: Settings },
    { id: "policies", label: "Policies & Legal", detail: "Privacy, Terms, Compliance", icon: Shield },
    { id: "support", label: "Support & Contacts", detail: "Help, Email & Phone Config", icon: Headphones },
    { id: "features", label: "Platform Features", detail: "Enable/Disable platform modules", icon: Layers },
    { id: "security", label: "Security & Access", detail: "2FA, Login, Roles & Permissions", icon: Lock },
    { id: "integrations", label: "Integrations & APIs", detail: "Payment, Blockchain, Webhooks", icon: Zap },
    { id: "notifications", label: "Notifications", detail: "Email, SMS & In-App alerts", icon: Bell },
    { id: "website", label: "Website & Content", detail: "Pages, Menus, SEO, Banners", icon: Monitor },
    { id: "system", label: "System & Maintenance", detail: "Logs, Backup, Updates, Mode", icon: Wrench },
  ];

  const generalFields = <form className="rounded-3xl bg-white p-5 shadow-sm" onSubmit={save}>
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3"><div><h2 className="flex items-center gap-2 font-bold"><Settings className="h-4 w-4 text-[#6d4dff]" />General Settings</h2><p className="text-sm text-muted-foreground">Manage your platform&apos;s core information and basic configuration</p></div><div className="flex gap-2"><Button type="button" variant="outline" className="h-10 rounded-xl" onClick={() => setPreviewing(true)}><Eye className="h-4 w-4" />Preview Site</Button><Button type="submit" className="h-10 rounded-xl bg-[#6d4dff] hover:bg-[#6d4dff]/90"><Check className="h-4 w-4" />Save Changes</Button></div></div>
    <div className="grid gap-3 sm:grid-cols-2">
      <SettingInput icon={Monitor} label="Platform Name" value={name} onChange={setName} />
      <SettingInput icon={Globe} label="Website URL" value={siteUrl} onChange={setSiteUrl} />
      <SettingInput icon={Mail} label="Admin Email" value={adminEmail} onChange={setAdminEmail} />
      <SettingInput icon={Mail} label="Support Email" value={supportEmail} onChange={setSupportEmail} />
      <SettingInput icon={Phone} label="Support Phone" value={phone} onChange={setPhone} />
      <label className="block text-sm font-medium">Default Language<span className="mt-1 flex h-11 items-center gap-2 rounded-xl border px-3"><Globe className="h-4 w-4 text-muted-foreground" /><select aria-label="Default Language" value={language} onChange={event => setLanguage(event.target.value)} className="w-full bg-transparent outline-none"><option>English (EN)</option><option>French (FR)</option><option>Arabic (AR)</option></select></span></label>
      <label className="block text-sm font-medium sm:col-span-2">Timezone<span className="mt-1 flex h-11 items-center gap-2 rounded-xl border px-3"><Clock className="h-4 w-4 text-muted-foreground" /><select aria-label="Timezone" value={timezone} onChange={event => setTimezone(event.target.value)} className="w-full bg-transparent outline-none"><option>(GMT+01:00) West Africa (Lagos)</option><option>(GMT+00:00) UTC</option><option>(GMT-05:00) Eastern Time</option></select></span></label>
    </div>
    <div className="mt-4 flex items-center justify-between gap-3"><span className="text-sm font-medium">Platform Status</span><span className="flex items-center gap-2 text-sm font-semibold text-emerald-600">{live ? "Live (Online)" : "Paused in preview"}<Switch checked={live} onCheckedChange={setLive} aria-label="Platform status" className="data-[state=checked]:bg-emerald-500" /></span></div>
  </form>;

  const branding = <section className="rounded-3xl bg-white p-5 shadow-sm">
    <h2 className="mb-4 font-bold">Branding</h2>
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-2xl border p-3"><p className="text-sm font-medium">Site Logo</p><div className="mt-2 flex items-center gap-3"><img src="/logo.png" alt="Basecola" className="h-14 w-auto rounded-xl bg-white" /><FilePick label="Upload logo" onFile={file => rememberFile("logo", file)} /></div>{logoName && <p className="mt-2 truncate text-xs text-muted-foreground">{logoName}</p>}</div>
      <div className="rounded-2xl border p-3"><p className="text-sm font-medium">Favicon</p><div className="mt-2 flex items-center gap-3"><img src="/logo.png" alt="" className="h-12 w-12 rounded-xl bg-white object-contain" /><FilePick label="Upload favicon" onFile={file => rememberFile("favicon", file)} /></div>{faviconName && <p className="mt-2 truncate text-xs text-muted-foreground">{faviconName}</p>}</div>
      <ColorField label="Primary Color" value={primary} onChange={setPrimary} />
      <ColorField label="Secondary Color" value={secondary} onChange={setSecondary} />
      <ColorField label="Accent Color" value={accent} onChange={setAccent} />
      <label className="block text-sm font-medium">Theme Mode<span className="mt-1 flex h-11 items-center gap-2 rounded-xl border px-3"><Sun className="h-4 w-4 text-muted-foreground" /><select aria-label="Theme Mode" value={theme} onChange={event => setTheme(event.target.value)} className="w-full bg-transparent outline-none"><option>Light (Default)</option><option>Dark</option><option>System</option></select></span></label>
    </div>
    <div className="mt-4 flex items-center justify-between"><span className="flex items-center gap-2 text-sm font-medium"><Moon className="h-4 w-4 text-[#6d4dff]" />Enable Dark Mode</span><Switch checked={dark} onCheckedChange={setDark} aria-label="Enable dark mode" className="data-[state=checked]:bg-emerald-500" /></div>
    <p className="mt-3 text-xs text-muted-foreground">Theme choices stay on this screen. The rest of the preview keeps its current appearance.</p>
  </section>;

  const legalCards = <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
    <LegalCard icon={Shield} title="Privacy Policy" text="Create and update your Privacy Policy" action="Edit Policy" onClick={() => openEditor("privacy")} />
    <LegalCard icon={FileText} title="Terms & Conditions" text="Manage your platform Terms and Conditions" action="Edit Terms" onClick={() => openEditor("terms")} />
    <LegalCard icon={Headphones} title="Help & Support" text="Configure support channels, FAQs and help resources" action="Configure Support" onClick={() => setTab("support")} />
    <LegalCard icon={Scale} title="Other Legal Pages" text="Manage additional legal pages (AML, KYC, Refund, etc.)" action="Manage Pages" onClick={() => setTab("policies")} />
  </div>;

  const supportCard = <section className="rounded-3xl bg-white p-5 shadow-sm">
    <h2 className="font-bold">Support Contact Configuration</h2>
    <p className="mb-2 text-sm text-muted-foreground">Set up how users can reach your support team</p>
    <FlagRow icon={Mail} label="Support Email" value={supportEmail} checked={flags.supportEmail} onChange={value => toggle("supportEmail", value)} />
    <FlagRow icon={Phone} label="Support Phone" value={phone} checked={flags.supportPhone} onChange={value => toggle("supportPhone", value)} />
    <FlagRow icon={MessageCircle} label="WhatsApp (Optional)" value={whatsapp} checked={flags.whatsapp} onChange={value => toggle("whatsapp", value)} />
    <FlagRow icon={Headphones} label="Live Chat" value="Enable live chat on website" checked={flags.liveChat} onChange={value => toggle("liveChat", value)} />
    <FlagRow icon={Globe} label="Help Center URL" value={helpUrl} checked={flags.helpCenter} onChange={value => toggle("helpCenter", value)} />
    <p className="mt-2 text-xs text-muted-foreground">These contacts are samples. No email, call, or WhatsApp message is sent.</p>
  </section>;

  const featureCard = <section className="rounded-3xl bg-white p-5 shadow-sm">
    <h2 className="font-bold">Additional Platform Features</h2>
    <p className="mb-2 text-sm text-muted-foreground">Enable or configure important platform features</p>
    <div className="grid gap-x-6 sm:grid-cols-2">
      <FlagRow icon={Users} label="User Registration" checked={flags.registration} onChange={value => toggle("registration", value)} />
      <FlagRow icon={ShoppingCart} label="Buy & Sell (OTC)" checked={flags.otc} onChange={value => toggle("otc", value)} />
      <FlagRow icon={BadgeCheck} label="KYC Verification" checked={flags.kyc} onChange={value => toggle("kyc", value)} />
      <FlagRow icon={ArrowDownToLine} label="Deposits & Withdrawals" checked={flags.deposits} onChange={value => toggle("deposits", value)} />
      <FlagRow icon={Lock} label="Two-Factor (2FA)" checked={flags.twoFactor} onChange={value => toggle("twoFactor", value)} />
      <FlagRow icon={Mail} label="Email Notifications" checked={flags.emailNotes} onChange={value => toggle("emailNotes", value)} />
      <FlagRow icon={Gift} label="Referral Program" checked={flags.referral} onChange={value => toggle("referral", value)} />
      <FlagRow icon={MessageCircle} label="SMS Notifications" checked={flags.sms} onChange={value => toggle("sms", value)} />
      <FlagRow icon={BarChart3} label="Invest / Earn" checked={flags.invest} onChange={value => toggle("invest", value)} />
      <FlagRow icon={Wrench} label="Maintenance Mode" checked={flags.maintenance} onChange={value => toggle("maintenance", value)} />
    </div>
  </section>;

  return <section className="space-y-4">
    <div className="flex flex-wrap gap-2">{SETTINGS_TABS.map(item => <button key={item.id} type="button" aria-pressed={tab === item.id} className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === item.id ? "bg-[#6d4dff] text-white" : "bg-white text-muted-foreground"}`} onClick={() => setTab(item.id)}>{item.label}</button>)}</div>
    <div className="grid items-start gap-4 xl:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="rounded-3xl bg-white p-4 shadow-sm"><h2 className="mb-3 font-bold">Settings Categories</h2><div className="space-y-1">{categories.map(item => { const Icon = item.icon; const active = tab === item.id; return <button key={item.id} type="button" aria-pressed={active} className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left ${active ? "bg-[#f3eefe] text-[#6d4dff]" : "hover:bg-[#f7f8fc]"}`} onClick={() => setTab(item.id)}><Icon className="h-4 w-4 shrink-0" /><span><span className="block text-sm font-semibold">{item.label}</span><span className="block text-xs text-muted-foreground">{item.detail}</span></span></button>; })}</div></aside>
      <div className="space-y-4">
        {tab === "general" && <><div className="grid gap-4 xl:grid-cols-2">{generalFields}{branding}</div>{legalCards}<div className="grid gap-4 xl:grid-cols-2">{supportCard}{featureCard}</div></>}
        {tab === "policies" && <section className="space-y-4 rounded-3xl bg-white p-5 shadow-sm"><h2 className="font-bold">Policies & Legal</h2><div className="grid gap-3 sm:grid-cols-2">{(Object.keys(POLICY_LABEL) as PolicyId[]).map(id => <article key={id} className="rounded-2xl border p-4"><p className="font-semibold">{POLICY_LABEL[id]}</p><p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{pages[id]}</p><Button type="button" variant="outline" className="mt-3 h-10 rounded-xl" onClick={() => openEditor(id)}>Edit</Button></article>)}</div></section>}
        {tab === "support" && <div className="space-y-4">{supportCard}<form className="max-w-xl space-y-3 rounded-3xl bg-white p-5 shadow-sm" onSubmit={save}><h2 className="font-bold">Edit sample contacts</h2><SettingInput icon={Mail} label="Support Email" value={supportEmail} onChange={setSupportEmail} /><SettingInput icon={Phone} label="Support Phone" value={phone} onChange={setPhone} /><SettingInput icon={MessageCircle} label="WhatsApp" value={whatsapp} onChange={setWhatsapp} /><SettingInput icon={Globe} label="Help Center URL" value={helpUrl} onChange={setHelpUrl} /><Button type="submit" className="h-11 rounded-xl bg-[#6d4dff] hover:bg-[#6d4dff]/90">Save Changes</Button></form></div>}
        {tab === "features" && featureCard}
        {tab === "security" && <section className="max-w-xl rounded-3xl bg-white p-5 shadow-sm"><h2 className="font-bold">Security & Access</h2><p className="mb-2 text-sm text-muted-foreground">Admin switches for this preview. The customer demo code stays 482913.</p><FlagRow icon={Lock} label="Require admin 2FA" value="Checked only on this screen" checked={flags.admin2fa} onChange={value => toggle("admin2fa", value)} /><FlagRow icon={Bell} label="Login alerts" value="No alert is sent" checked={flags.loginAlert} onChange={value => toggle("loginAlert", value)} /><Button type="button" className="mt-4 h-11 rounded-xl bg-[#6d4dff] hover:bg-[#6d4dff]/90" onClick={() => save()}>Save Changes</Button></section>}
        {tab === "integrations" && <form className="max-w-xl space-y-3 rounded-3xl bg-white p-5 shadow-sm" onSubmit={save}><h2 className="font-bold">Integrations & APIs</h2><SettingInput icon={Zap} label="Payment provider" value="Sample preview" onChange={() => undefined} /><SettingInput icon={Link2} label="Webhook URL" value="https://basecola.demo/hooks/preview" onChange={() => undefined} /><label className="block text-sm font-medium">API key<span className="mt-1 flex h-11 items-center rounded-xl border px-3"><input value={apiDraft} onChange={event => setApiDraft(event.target.value)} placeholder="No key stored" autoComplete="off" className="w-full bg-transparent outline-none" aria-label="API key" /></span></label><Button type="submit" className="h-11 rounded-xl bg-[#6d4dff] hover:bg-[#6d4dff]/90">Save Changes</Button><p className="text-xs text-muted-foreground">No API key is stored and no external service is contacted.</p></form>}
        {tab === "notifications" && <section className="max-w-xl rounded-3xl bg-white p-5 shadow-sm"><h2 className="font-bold">Notifications</h2><FlagRow icon={Mail} label="Email Notifications" value="No email is sent" checked={flags.emailNotes} onChange={value => toggle("emailNotes", value)} /><FlagRow icon={MessageCircle} label="SMS Notifications" value="No SMS is sent" checked={flags.sms} onChange={value => toggle("sms", value)} /><FlagRow icon={Bell} label="In-app alerts" value="Shown in this admin preview" checked={flags.inApp} onChange={value => toggle("inApp", value)} /><Button type="button" className="mt-4 h-11 rounded-xl bg-[#6d4dff] hover:bg-[#6d4dff]/90" onClick={() => save()}>Save Changes</Button></section>}
        {tab === "website" && <section className="rounded-3xl bg-white p-5 shadow-sm"><h2 className="font-bold">Website & Content</h2><p className="mt-1 text-sm text-muted-foreground">Sample pages for this preview. Nothing is published.</p><ul className="mt-4 divide-y text-sm"><li className="flex justify-between py-3"><span className="font-semibold">Home</span><span className="text-muted-foreground">/</span></li><li className="flex justify-between py-3"><span className="font-semibold">Help</span><span className="text-muted-foreground">/help</span></li><li className="flex justify-between py-3"><span className="font-semibold">Referral</span><span className="text-muted-foreground">/referral</span></li></ul><label className="mt-3 block text-sm font-medium">SEO title<Input value={`${name} demo`} readOnly className="mt-1 h-11 bg-white" aria-label="SEO title" /></label></section>}
        {tab === "system" && <div className="space-y-4">
          <section className="space-y-4 rounded-3xl bg-white p-5 shadow-sm">
            <h2 className="font-bold">System & Maintenance</h2>
            <FlagRow icon={Wrench} label="Maintenance Mode" value="The customer app stays available" checked={flags.maintenance} onChange={value => toggle("maintenance", value)} />
            <div className="flex flex-wrap gap-2"><Button type="button" variant="outline" className="h-10 rounded-xl" onClick={() => setNotice("Backups are handled automatically by the database provider.")}>Backup info</Button><Button type="button" className="h-10 rounded-xl bg-[#6d4dff] hover:bg-[#6d4dff]/90" onClick={() => save()}>Save Changes</Button></div>
            <div><h3 className="mb-2 text-sm font-bold">Recent setting changes</h3>{audit.length === 0 ? <p className="text-sm text-muted-foreground">No changes saved yet.</p> : <ul className="space-y-2 text-sm text-muted-foreground">{audit.map(row => <li key={row.id}>{new Date(row.created_at).toLocaleString()} — {row.section}{row.note ? ` · ${row.note}` : ""}</li>)}</ul>}</div>
          </section>
          <form onSubmit={saveCryptoWithdrawalControls} className="space-y-4 rounded-3xl bg-white p-5 shadow-sm">
            <div>
              <h2 className="font-bold">Custodial crypto withdrawals</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Server-side execution only. Requests remain unavailable until chain providers, monitoring, Turnkey, fee caps, and treasury sponsorship are configured.
              </p>
            </div>
            <FlagRow
              icon={Shield}
              label="Enable crypto withdrawals"
              value="Turn off immediately to suspend new requests and signing."
              checked={cryptoWithdrawalsEnabled}
              onChange={setCryptoWithdrawalsEnabled}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              {([
                ["cryptoWithdrawalFeeCapBitcoinUSD", "Bitcoin fee cap (USD)"],
                ["cryptoWithdrawalFeeCapEthereumUSD", "Ethereum fee cap (USD; includes ERC-20)"],
                ["cryptoWithdrawalFeeCapSolanaUSD", "Solana fee cap (USD)"],
                ["cryptoWithdrawalFeeCapXrplUSD", "XRP Ledger fee cap (USD)"],
              ] as const).map(([key, label]) => (
                <label key={key} className="block text-sm font-medium">
                  {label}
                  <Input
                    inputMode="decimal"
                    value={withdrawalFeeCaps[key]}
                    onChange={event => setWithdrawalFeeCaps(current => ({ ...current, [key]: event.target.value }))}
                    className="mt-1 h-11"
                  />
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              The $5,000 per-request and rolling 24-hour limits include the network fee. Requests are automatically approved; no manual approval is configured. All changes are logged.
            </p>
            <Button type="submit" className="h-11 rounded-xl bg-[#6d4dff] hover:bg-[#6d4dff]/90">
              Save withdrawal controls
            </Button>
          </form>
        </div>}
      </div>
    </div>
    {notice && <p role="status" className="text-sm text-muted-foreground">{notice}</p>}
    <p className="text-xs leading-relaxed text-muted-foreground">{!loaded ? "Loading saved settings…" : saving ? "Saving…" : "Settings are saved to the database and every change is logged. Logo uploads and API keys are not stored here."}</p>
    <Dialog open={previewing} onOpenChange={setPreviewing}><DialogContent className="max-w-md rounded-3xl"><DialogHeader><DialogTitle>Preview Site</DialogTitle><DialogDescription>This preview does not open a live site.</DialogDescription></DialogHeader><p className="break-all text-sm font-semibold">{siteUrl}</p><p className="text-sm text-muted-foreground">The address is sample copy for {name}. No page is published.</p></DialogContent></Dialog>
    <Dialog open={!!editor} onOpenChange={open => { if (!open) setEditor(null); }}><DialogContent className="max-w-lg rounded-3xl">{editor && <form className="space-y-4" onSubmit={event => { event.preventDefault(); savePolicy(editor, draft); setEditor(null); }}><DialogHeader><DialogTitle>{POLICY_LABEL[editor]}</DialogTitle><DialogDescription>Saved for all admins and logged in the change history.</DialogDescription></DialogHeader><textarea value={draft} onChange={event => setDraft(event.target.value)} rows={5} className="w-full rounded-xl border bg-white p-3 text-sm outline-none" aria-label={POLICY_LABEL[editor]} /><Button type="submit" className="h-11 w-full">Save page</Button></form>}</DialogContent></Dialog>
  </section>;
}

function SettingInput({ icon: Icon, label, value, onChange }: { icon: typeof Settings; label: string; value: string; onChange: (value: string) => void }) {
  return <label className="block text-sm font-medium">{label}<span className="mt-1 flex h-11 items-center gap-2 rounded-xl border px-3"><Icon className="h-4 w-4 shrink-0 text-muted-foreground" /><input aria-label={label} value={value} onChange={event => onChange(event.target.value)} className="w-full bg-transparent outline-none" /></span></label>;
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const safe = /^#[0-9A-Fa-f]{6}$/.test(value) ? value : "#7A00FF";
  return <label className="block text-sm font-medium">{label}<span className="mt-1 flex h-11 items-center gap-2 rounded-xl border px-2"><input type="color" aria-label={`${label} swatch`} value={safe} onChange={event => onChange(event.target.value.toUpperCase())} className="h-8 w-8 cursor-pointer border-0 bg-transparent" /><input aria-label={label} value={value} onChange={event => onChange(event.target.value.toUpperCase())} className="w-full bg-transparent font-mono text-sm outline-none" /></span></label>;
}

function FilePick({ label, onFile }: { label: string; onFile: (file: File | undefined) => void }) {
  return <label className="ml-auto inline-flex h-9 cursor-pointer items-center gap-1 rounded-xl border px-3 text-xs font-semibold text-[#6d4dff]"><Upload className="h-3.5 w-3.5" />Upload<input type="file" accept="image/*" className="sr-only" aria-label={label} onChange={event => { onFile(event.target.files?.[0]); event.target.value = ""; }} /></label>;
}

function LegalCard({ icon: Icon, title, text, action, onClick }: { icon: typeof Shield; title: string; text: string; action: string; onClick: () => void }) {
  return <article className="rounded-3xl bg-white p-4 shadow-sm"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#f3eefe] text-[#6d4dff]"><Icon className="h-4 w-4" /></span><h3 className="mt-3 font-bold">{title}</h3><p className="mt-1 text-sm text-muted-foreground">{text}</p><Button type="button" variant="outline" className="mt-4 h-10 w-full rounded-xl" onClick={onClick}>{action}</Button></article>;
}

function FlagRow({ icon: Icon, label, value, checked, onChange }: { icon: typeof Settings; label: string; value?: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <div className="flex items-center gap-3 py-2"><Icon className="h-4 w-4 shrink-0 text-[#6d4dff]" /><span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{label}</span>{value && <span className="block truncate text-xs text-muted-foreground">{value}</span>}</span><Switch checked={checked} onCheckedChange={onChange} aria-label={label} className="data-[state=checked]:bg-emerald-500" /></div>;
}
