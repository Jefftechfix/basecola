import { useState, type FormEvent, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowDownToLine, Check, Copy, RefreshCw, CircleCheck, CircleX, Eye, Minus, Plus, Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { adjustAdminUserBalance, cancelAdminTreasuryOperation, deleteAdminUser, exportAccountDataForDeletionRequest, getAdminUserDetails, listAccountDeletionRequests, listAdminAssetNetworks, listAdminDeposits, listAdminReferrals, listAdminTradeOrders, listAdminTradeSettings, listAdminTradeSettingsAudit, listAdminTransactions, listAdminTreasuryBalances, listAdminUsers, listAdminVerifications, listAdminWalletAccounts, listAdminTreasuryOperationRequests, requestAdminTreasuryOperation, reviewVerification, setAdminUserStatus, updateAdminAssetNetwork, updateAdminReferral, updateAdminTradeSettings, type AdminAssetNetworkRow, type AdminDepositRow, type AdminTradeOrderRow, type AdminTradeSettingRow, type AdminTradeSettingsAuditRow, type AdminTransactionRow, type AdminTreasuryBalanceRow, type AdminVerificationRow } from "@/lib/admin.functions";

const pill: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700", approved: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700", reviewing: "bg-sky-100 text-sky-700", completed: "bg-muted text-muted-foreground", confirmed: "bg-emerald-100 text-emerald-700", successful: "bg-emerald-100 text-emerald-700", failed: "bg-red-100 text-red-700", unmatched: "bg-slate-100 text-slate-700", suspended: "bg-red-100 text-red-700", deleted: "bg-red-100 text-red-800", rejected: "bg-red-100 text-red-700",
  none: "bg-muted text-muted-foreground",
};
const Pill = ({ value, children }: { value: string; children?: ReactNode }) => <span className={`rounded-full px-2 py-0.5 text-xs font-bold capitalize ${pill[value] ?? "bg-muted"}`}>{children ?? (value === "none" ? "Not submitted" : value)}</span>;
const date = (v: string) => new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export function LiveUsersManagement() {
  const fetchUsers = useServerFn(listAdminUsers);
  const setStatus = useServerFn(setAdminUserStatus);
  const fetchDetails = useServerFn(getAdminUserDetails);
  const adjustBalance = useServerFn(adjustAdminUserBalance);
  const deleteUser = useServerFn(deleteAdminUser);
  const qc = useQueryClient();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [adjustment, setAdjustment] = useState({ amount: "", note: "" });
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [actionError, setActionError] = useState("");
  const { data = [], isPending, error } = useQuery({ queryKey: ["admin-users"], queryFn: () => fetchUsers() });
  const detailsQuery = useQuery({ queryKey: ["admin-user-details", selectedId], queryFn: () => fetchDetails({ data: { userId: selectedId! } }), enabled: !!selectedId });
  const toggle = useMutation({
    mutationFn: (v: { userId: string; status: "active" | "suspended" }) => setStatus({ data: v }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin-users"] });
      if (selectedId) void qc.invalidateQueries({ queryKey: ["admin-user-details", selectedId] });
    },
  });
  const balanceAction = useMutation({
    mutationFn: (direction: "credit" | "debit") => adjustBalance({ data: { userId: selectedId!, direction, amount: Number(adjustment.amount), note: adjustment.note } }),
    onSuccess: () => {
      setAdjustment({ amount: "", note: "" });
      setActionError("");
      void qc.invalidateQueries({ queryKey: ["admin-user-details", selectedId] });
      void qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: Error) => setActionError(e.message),
  });
  const deletion = useMutation({
    mutationFn: () => deleteUser({ data: { userId: selectedId!, confirmation: deleteConfirmation } }),
    onSuccess: () => {
      setActionError("");
      setDeleteConfirmation("");
      setSelectedId(null);
      void qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: Error) => setActionError(e.message),
  });
  const q = query.trim().toLowerCase();
  const rows = data.filter(u => `${u.full_name} ${u.email} ${u.phone}`.toLowerCase().includes(q));

  return <section className="space-y-4 rounded-3xl bg-white p-5 shadow-sm">
    <div className="flex flex-wrap items-center gap-3">
      <h2 className="mr-auto text-lg font-bold">Members ({data.length})</h2>
      <label className="relative w-72"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input aria-label="Search members" placeholder="Search name, email, phone" value={query} onChange={e => setQuery(e.target.value)} className="h-10 pl-9" /></label>
    </div>
    {error && <p role="alert" className="text-sm text-destructive">{(error as Error).message}</p>}
    {toggle.error && <p role="alert" className="text-sm text-destructive">{(toggle.error as Error).message}</p>}
    <div className="overflow-x-auto"><table className="w-full text-sm">
      <thead><tr className="text-left text-xs text-muted-foreground"><th className="p-2">Member</th><th className="p-2">Phone</th><th className="p-2">Country</th><th className="p-2">Verification</th><th className="p-2">Joined</th><th className="p-2">Account</th><th className="p-2" /></tr></thead>
      <tbody>{rows.map(u => <tr key={u.id} className="border-t">
        <td className="p-2"><p className="font-semibold">{u.full_name || "—"}</p><p className="text-xs text-muted-foreground">{u.email}</p></td>
        <td className="p-2">{u.phone || "—"}</td><td className="p-2">{u.country || "—"}</td>
        <td className="p-2"><Pill value={u.kyc} /></td><td className="p-2">{date(u.created_at)}</td>
        <td className="p-2"><Pill value={u.account_status} /></td>
        <td className="p-2 text-right"><div className="flex justify-end gap-2"><Button size="sm" variant="outline" onClick={() => { setSelectedId(u.id); setActionError(""); setDeleteConfirmation(""); }}><Eye className="h-4 w-4" />Details</Button><Button size="sm" variant="outline" disabled={toggle.isPending || u.account_status === "deleted"}
          onClick={() => toggle.mutate({ userId: u.id, status: u.account_status === "suspended" ? "active" : "suspended" })}>
          {u.account_status === "suspended" ? "Unsuspend" : "Suspend"}</Button></div></td>
      </tr>)}</tbody>
    </table></div>
    {isPending && <p className="text-sm text-muted-foreground">Loading members…</p>}
    {!isPending && rows.length === 0 && <p className="text-sm text-muted-foreground">No members found.</p>}
    <Dialog open={!!selectedId} onOpenChange={open => { if (!open) { setSelectedId(null); setActionError(""); } }}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        {detailsQuery.isPending ? <p className="text-sm text-muted-foreground">Loading account details…</p> : detailsQuery.error ? <p role="alert" className="text-sm text-destructive">{(detailsQuery.error as Error).message}</p> : detailsQuery.data && <>
          {(() => {
            const details = detailsQuery.data;
            const member = data.find(user => user.id === selectedId);
            return <div className="space-y-5">
              <DialogHeader>
                <DialogTitle>{details.profile.full_name || "Member details"}</DialogTitle>
                <DialogDescription>{details.profile.email || "No email"} · Joined {date(details.profile.created_at)}</DialogDescription>
              </DialogHeader>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[["Phone", details.profile.phone || "—"], ["Country", details.profile.country || "—"], ["Status", details.management.account_status], ["Available USD", `$${details.balance_usd.toFixed(2)}`], ["Last sign in", details.auth?.last_sign_in_at ? date(details.auth.last_sign_in_at) : "Never"], ["Referral code", details.profile.my_referral_code || "—"], ["Verification", details.verifications[0]?.status ?? "Not submitted"], ["Wallet addresses", String(details.wallet_accounts.filter(account => account.status === "active").length)]] .map(([label, value]) => <div key={label} className="rounded-lg bg-muted/50 p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 break-words text-sm font-semibold">{value}</p></div>)}
              </div>
              {details.management.admin_note && <p className="rounded-lg bg-muted p-3 text-sm"><b>Admin note:</b> {details.management.admin_note}</p>}
              <section className="grid gap-4 border-t pt-4 sm:grid-cols-2">
                <div className="space-y-2"><h3 className="font-bold">Verification records</h3>{details.verifications.length ? details.verifications.map(verification => <div key={verification.id} className="rounded-lg border p-3 text-sm"><div className="flex justify-between gap-2"><span className="font-semibold">{verification.id_document_type}</span><Pill value={verification.status} /></div><p className="mt-1 text-muted-foreground">{verification.address}</p>{verification.ssn_last4 && <p className="mt-1 text-xs text-muted-foreground">SSN ending {verification.ssn_last4}</p>}</div>) : <p className="text-sm text-muted-foreground">No verification record.</p>}</div>
                <div className="space-y-2"><h3 className="font-bold">Deposit addresses</h3>{details.wallet_accounts.length ? details.wallet_accounts.map((account, index) => <div key={`${account.network}-${index}`} className="rounded-lg border p-3 text-sm"><div className="flex justify-between gap-2"><span className="font-semibold">{account.network}</span><Pill value={account.status} /></div><p className="mt-1 break-all font-mono text-xs">{account.address || "Address not provisioned"}</p>{account.destination_tag != null && <p className="mt-1 text-xs text-muted-foreground">Destination tag: {account.destination_tag}</p>}</div>) : <p className="text-sm text-muted-foreground">No wallet accounts.</p>}</div>
              </section>
              <section className="space-y-3 border-t pt-4">
                <h3 className="font-bold">Wallet adjustment (USD)</h3>
                <div className="grid gap-3 sm:grid-cols-[150px_1fr_auto_auto]">
                  <div className="space-y-1"><Label htmlFor="admin-adjustment-amount">Amount</Label><Input id="admin-adjustment-amount" inputMode="decimal" value={adjustment.amount} onChange={event => setAdjustment(current => ({ ...current, amount: event.target.value }))} placeholder="0.00" /></div>
                  <div className="space-y-1"><Label htmlFor="admin-adjustment-note">Reason</Label><Input id="admin-adjustment-note" value={adjustment.note} onChange={event => setAdjustment(current => ({ ...current, note: event.target.value }))} maxLength={500} placeholder="Required audit reason" /></div>
                  <Button type="button" className="self-end" disabled={balanceAction.isPending} onClick={() => balanceAction.mutate("credit")}><Plus className="h-4 w-4" />Credit</Button>
                  <Button type="button" variant="outline" className="self-end" disabled={balanceAction.isPending} onClick={() => balanceAction.mutate("debit")}><Minus className="h-4 w-4" />Debit</Button>
                </div>
              </section>
              <section className="space-y-2 border-t pt-4">
                <h3 className="font-bold">Recent transactions</h3>
                {details.transactions.length ? <div className="max-h-48 overflow-auto"><table className="w-full text-left text-xs"><thead className="text-muted-foreground"><tr><th className="p-2">Date</th><th className="p-2">Activity</th><th className="p-2">Reference</th><th className="p-2">Amount</th><th className="p-2">Status</th></tr></thead><tbody>{details.transactions.slice(0, 20).map(transaction => <tr key={transaction.id} className="border-t"><td className="p-2">{date(transaction.created_at)}</td><td className="p-2 capitalize">{transaction.kind} · {transaction.direction}</td><td className="max-w-56 truncate p-2 font-mono" title={transaction.reference || "—"}>{transaction.reference || "—"}</td><td className="p-2">${Number(transaction.usd_amount).toFixed(2)}</td><td className="p-2 capitalize">{transaction.status}</td></tr>)}</tbody></table></div> : <p className="text-sm text-muted-foreground">No transactions.</p>}
              </section>
              <section className="space-y-3 border-t border-destructive/30 pt-4">
                <h3 className="font-bold text-destructive">Delete account access</h3>
                <p className="text-sm text-muted-foreground">This blocks sign-in and marks the account deleted. Financial and custody records are retained. Enter the member’s email to confirm.</p>
                <div className="flex flex-wrap gap-2"><Input aria-label="Confirm user email to delete account" value={deleteConfirmation} onChange={event => setDeleteConfirmation(event.target.value)} placeholder={details.profile.email ?? "Member email"} className="min-w-56 flex-1" /><Button type="button" variant="destructive" disabled={deletion.isPending || member?.account_status === "deleted" || deleteConfirmation.trim().toLowerCase() !== (details.profile.email ?? "").toLowerCase()} onClick={() => deletion.mutate()}><Trash2 className="h-4 w-4" />{member?.account_status === "deleted" ? "Deleted" : "Delete user"}</Button></div>
              </section>
              {actionError && <p role="alert" className="text-sm text-destructive">{actionError}</p>}
            </div>;
          })()}
        </>}
      </DialogContent>
    </Dialog>
  </section>;
}

function transactionOutcome(status: string) {
  const normalized = status.trim().toLowerCase();
  if (["completed", "paid", "succeeded", "success"].includes(normalized)) return "successful";
  if (["failed", "rejected", "canceled", "cancelled", "error"].includes(normalized)) return "failed";
  if (["pending", "processing", "created", "queued", "broadcast"].includes(normalized)) return "pending";
  return normalized || "unknown";
}

export function LiveAssetsWalletManagement() {
  const [tab, setTab] = useState<"overview" | "wallets" | "addresses" | "treasury" | "reconcile">("overview");
  const [query, setQuery] = useState("");
  const [networkFilter, setNetworkFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingAsset, setEditingAsset] = useState<AdminAssetNetworkRow | null>(null);
  const [assetError, setAssetError] = useState("");
  const [operationError, setOperationError] = useState("");
  const [notice, setNotice] = useState("");
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const [operationAssetKey, setOperationAssetKey] = useState("");
  const qc = useQueryClient();
  const fetchAssets = useServerFn(listAdminAssetNetworks);
  const fetchWallets = useServerFn(listAdminWalletAccounts);
  const fetchDeposits = useServerFn(listAdminDeposits);
  const fetchOperations = useServerFn(listAdminTreasuryOperationRequests);
  const saveAsset = useServerFn(updateAdminAssetNetwork);
  const createOperation = useServerFn(requestAdminTreasuryOperation);
  const cancelOperation = useServerFn(cancelAdminTreasuryOperation);
  const assetsQuery = useQuery({ queryKey: ["admin-asset-networks"], queryFn: () => fetchAssets() });
  const walletsQuery = useQuery({ queryKey: ["admin-wallet-accounts"], queryFn: () => fetchWallets(), enabled: tab === "wallets" || tab === "addresses" });
  const depositsQuery = useQuery({ queryKey: ["admin-deposit-observations"], queryFn: () => fetchDeposits(), enabled: tab === "reconcile" });
  const operationsQuery = useQuery({ queryKey: ["admin-treasury-operation-requests"], queryFn: () => fetchOperations(), enabled: tab === "treasury" });
  const assetMutation = useMutation({
    mutationFn: (input: { asset: string; network: string; minimumDeposit: number; requiredConfirmations: number; enabled: boolean; note: string }) => saveAsset({ data: input }),
    onSuccess: () => {
      setEditingAsset(null);
      setAssetError("");
      setNotice("Asset network settings saved and audited.");
      void qc.invalidateQueries({ queryKey: ["admin-asset-networks"] });
    },
    onError: (error: Error) => setAssetError(error.message),
  });
  const operationMutation = useMutation({
    mutationFn: (input: Parameters<typeof createOperation>[0]["data"]) => createOperation({ data: input }),
    onSuccess: result => {
      setOperationError("");
      setNotice(`Treasury request ${result.id} recorded as requested. No funds moved.`);
      void qc.invalidateQueries({ queryKey: ["admin-treasury-operation-requests"] });
    },
    onError: (error: Error) => setOperationError(error.message),
  });
  const cancelMutation = useMutation({
    mutationFn: (id: string) => cancelOperation({ data: { id } }),
    onSuccess: () => {
      setOperationError("");
      void qc.invalidateQueries({ queryKey: ["admin-treasury-operation-requests"] });
    },
    onError: (error: Error) => setOperationError(error.message),
  });
  const assets = assetsQuery.data ?? [];
  const enabledAssets = assets.filter(item => item.enabled);
  const selectedOperationAsset = enabledAssets.find(item => `${item.asset}|${item.network}` === operationAssetKey) ?? enabledAssets[0];
  const wallets = walletsQuery.data ?? [];
  const deposits = depositsQuery.data ?? [];
  const operations = operationsQuery.data ?? [];
  const selectedWallet = wallets.find(wallet => wallet.id === selectedWalletId) ?? null;
  const filteredWallets = wallets.filter(wallet => {
    const text = `${wallet.user.full_name} ${wallet.user.email} ${wallet.network} ${wallet.address}`.toLowerCase();
    return text.includes(query.trim().toLowerCase()) && (networkFilter === "all" || wallet.network === networkFilter) && (statusFilter === "all" || wallet.status === statusFilter);
  });
  const networks = [...new Set(wallets.map(wallet => wallet.network))].sort();
  const groupedDeposits = [...deposits.reduce((groups, deposit) => {
    const key = `${deposit.asset} · ${deposit.network}`;
    const group = groups.get(key) ?? { key, asset: deposit.asset, network: deposit.network, count: 0, pending: 0, confirmed: 0, failed: 0, belowMinimum: 0, cryptoAmount: 0, estimatedUsd: 0 };
    group.count++;
    group[deposit.status]++;
    if (deposit.below_minimum) group.belowMinimum++;
    group.cryptoAmount += Number(deposit.crypto_amount);
    group.estimatedUsd += Number(deposit.amount_usd ?? 0);
    groups.set(key, group);
    return groups;
  }, new Map<string, { key: string; asset: string; network: string; count: number; pending: number; confirmed: number; failed: number; belowMinimum: number; cryptoAmount: number; estimatedUsd: number }>()).values()];

  function submitAsset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingAsset) return;
    const form = new FormData(event.currentTarget);
    assetMutation.mutate({
      asset: editingAsset.asset,
      network: editingAsset.network,
      minimumDeposit: Number(form.get("minimumDeposit")),
      requiredConfirmations: Number(form.get("requiredConfirmations")),
      enabled: form.get("enabled") === "on",
      note: String(form.get("note") ?? ""),
    });
  }

  function submitOperation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    operationMutation.mutate({
      operationType: String(form.get("operationType")) as "transfer" | "top_up" | "withdraw" | "rebalance",
      asset: String(form.get("asset")),
      network: String(form.get("network")),
      amount: Number(form.get("amount")),
      fromLocation: String(form.get("fromLocation")),
      toLocation: String(form.get("toLocation")),
      destinationAddress: String(form.get("destinationAddress") ?? ""),
      reason: String(form.get("reason") ?? ""),
    });
    event.currentTarget.reset();
  }

  async function copyAddress(address: string) {
    try { await navigator.clipboard.writeText(address); setNotice("Public deposit address copied."); }
    catch { setNotice(address); }
  }

  const tabItems = [["overview", "Assets"], ["wallets", "Wallet Accounts"], ["addresses", "Deposit Addresses"], ["treasury", "Treasury Requests"], ["reconcile", "Deposit Reconciliation"]] as const;
  return <section className="space-y-4">
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Asset and wallet management">
      {tabItems.map(([id, label]) => <button key={id} type="button" role="tab" aria-selected={tab === id} className={`rounded-lg px-3 py-2 text-sm font-semibold ${tab === id ? "bg-primary text-primary-foreground" : "bg-white text-muted-foreground"}`} onClick={() => { setTab(id); setQuery(""); }}>{label}</button>)}
      <Button type="button" variant="outline" className="ml-auto" onClick={() => {
        void qc.invalidateQueries({ queryKey: ["admin-asset-networks"] });
        void qc.invalidateQueries({ queryKey: ["admin-wallet-accounts"] });
        void qc.invalidateQueries({ queryKey: ["admin-deposit-observations"] });
        void qc.invalidateQueries({ queryKey: ["admin-treasury-operation-requests"] });
      }}><RefreshCw className="h-4 w-4" />Refresh</Button>
    </div>
    {notice && <p role="status" className="text-sm text-muted-foreground">{notice}</p>}
    {assetsQuery.error && <p role="alert" className="text-sm text-destructive">{(assetsQuery.error as Error).message}</p>}

    {tab === "overview" && <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
      <div><h2 className="text-lg font-bold">Supported asset networks</h2><p className="text-sm text-muted-foreground">Test-network configuration only. No prices or treasury balances are represented here.</p></div>
      {assetsQuery.isPending ? <p className="text-sm text-muted-foreground">Loading asset configuration…</p> : <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="text-xs text-muted-foreground"><tr><th className="p-2">Asset</th><th className="p-2">Network</th><th className="p-2">Minimum deposit</th><th className="p-2">Confirmations</th><th className="p-2">Status</th><th className="p-2 text-right">Settings</th></tr></thead><tbody>{assets.map(item => <tr key={`${item.asset}-${item.network}`} className="border-t"><td className="p-2 font-semibold">{item.asset}<span className="block text-xs font-normal text-muted-foreground">{item.display_name}</span></td><td className="p-2">{item.network}</td><td className="p-2">{Number(item.minimum_deposit).toLocaleString(undefined, { maximumFractionDigits: 18 })} {item.asset}</td><td className="p-2">{item.required_confirmations}</td><td className="p-2"><Pill value={item.enabled ? "confirmed" : "suspended"}>{item.enabled ? "Enabled" : "Disabled"}</Pill></td><td className="p-2 text-right"><Button size="sm" variant="outline" onClick={() => { setAssetError(""); setEditingAsset(item); }}>Edit settings</Button></td></tr>)}</tbody></table></div>}
    </section>}

    {(tab === "wallets" || tab === "addresses") && <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-3"><div className="mr-auto"><h2 className="text-lg font-bold">{tab === "wallets" ? "Customer wallet accounts" : "Provisioned deposit addresses"}</h2><p className="text-sm text-muted-foreground">Public address data only; private keys and custody references are never exposed.</p></div><label className="relative w-full sm:max-w-sm"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input aria-label="Search wallet accounts" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search user, email, address" className="pl-9" /></label></div>
        <div className="flex flex-wrap gap-2"><label className="text-xs text-muted-foreground">Network<select aria-label="Filter wallet network" value={networkFilter} onChange={event => setNetworkFilter(event.target.value)} className="ml-2 h-9 rounded-md border bg-white px-2 text-sm text-foreground"><option value="all">All networks</option>{networks.map(value => <option key={value}>{value}</option>)}</select></label><label className="text-xs text-muted-foreground">Status<select aria-label="Filter wallet status" value={statusFilter} onChange={event => setStatusFilter(event.target.value)} className="ml-2 h-9 rounded-md border bg-white px-2 text-sm text-foreground"><option value="all">All statuses</option>{["pending", "active", "suspended"].map(value => <option key={value}>{value}</option>)}</select></label></div>
        {walletsQuery.error && <p role="alert" className="text-sm text-destructive">{(walletsQuery.error as Error).message}</p>}
        <div className="overflow-x-auto"><table className="w-full min-w-[780px] text-left text-sm"><thead className="text-xs text-muted-foreground"><tr><th className="p-2">Member</th><th className="p-2">Network</th><th className="p-2">{tab === "wallets" ? "Address" : "Deposit address"}</th><th className="p-2">Provisioning</th><th className="p-2">Last deposit observed</th><th className="p-2">Status</th><th className="p-2" /></tr></thead><tbody>{filteredWallets.map(wallet => <tr key={wallet.id} className="border-t"><td className="p-2"><p className="font-semibold">{wallet.user.full_name || "—"}</p><p className="text-xs text-muted-foreground">{wallet.user.email}</p></td><td className="p-2">{wallet.network}{wallet.destination_tag != null && <span className="block text-xs text-muted-foreground">Tag {wallet.destination_tag}</span>}</td><td className="max-w-56 truncate p-2 font-mono text-xs" title={wallet.address ?? "Address pending"}>{wallet.address || "Address pending"}</td><td className="p-2 capitalize">{wallet.provisioning_status}</td><td className="p-2">{wallet.last_deposit_at ? date(wallet.last_deposit_at) : "—"}</td><td className="p-2"><Pill value={wallet.status === "active" ? "confirmed" : wallet.status}>{wallet.status}</Pill></td><td className="p-2 text-right"><Button size="sm" variant="outline" disabled={!wallet.address} onClick={() => setSelectedWalletId(wallet.id)}><Eye className="h-4 w-4" />Details</Button></td></tr>)}</tbody></table></div>
        {walletsQuery.isPending && <p className="text-sm text-muted-foreground">Loading wallet accounts…</p>}
        {!walletsQuery.isPending && !filteredWallets.length && <p className="text-sm text-muted-foreground">No wallet accounts match these filters.</p>}
        <p className="text-xs text-muted-foreground">Wallet addresses are provisioned by the private custody service. Admins cannot create or edit an address here.</p>
      </section>
      {selectedWallet && <aside className="space-y-3 rounded-2xl bg-white p-4 shadow-sm"><div className="flex items-center justify-between"><h2 className="font-bold">Address details</h2><Button type="button" size="icon" variant="ghost" aria-label="Close wallet details" onClick={() => setSelectedWalletId(null)}><X className="h-4 w-4" /></Button></div><p className="text-sm font-semibold">{selectedWallet.user.full_name || selectedWallet.user.email || "Member"}</p><p className="text-xs text-muted-foreground">{selectedWallet.network}</p><p className="break-all rounded-lg bg-muted p-3 font-mono text-xs">{selectedWallet.address}</p>{selectedWallet.destination_tag != null && <p className="text-sm">Destination tag: <b>{selectedWallet.destination_tag}</b></p>}<Button type="button" variant="outline" className="w-full" onClick={() => selectedWallet.address && void copyAddress(selectedWallet.address)}><Copy className="h-4 w-4" />Copy public address</Button><p className="text-xs text-muted-foreground">Never send private keys or seed phrases to an admin UI.</p></aside>}
    </div>}

    {tab === "treasury" && <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm"><div><h2 className="text-lg font-bold">Treasury operation requests</h2><p className="text-sm text-muted-foreground">Requests are recorded for operational review only. They are not signed, broadcast, or executed.</p></div>
        {operationsQuery.error && <p role="alert" className="text-sm text-destructive">{(operationsQuery.error as Error).message}</p>}{operationError && <p role="alert" className="text-sm text-destructive">{operationError}</p>}
        <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="text-xs text-muted-foreground"><tr><th className="p-2">Requested</th><th className="p-2">Operation</th><th className="p-2">Asset/network</th><th className="p-2">Amount</th><th className="p-2">Route</th><th className="p-2">Status</th><th className="p-2" /></tr></thead><tbody>{operations.map(operation => <tr key={operation.id} className="border-t"><td className="p-2">{date(operation.requested_at)}</td><td className="p-2 capitalize">{operation.operation_type}</td><td className="p-2">{operation.asset}<span className="block text-xs text-muted-foreground">{operation.network}</span></td><td className="p-2">{Number(operation.amount).toLocaleString(undefined, { maximumFractionDigits: 18 })} {operation.asset}</td><td className="p-2">{operation.from_location} → {operation.to_location}</td><td className="p-2"><Pill value={operation.status === "requested" ? "pending" : "completed"}>{operation.status}</Pill></td><td className="p-2 text-right">{operation.status === "requested" && <Button size="sm" variant="outline" disabled={cancelMutation.isPending} onClick={() => cancelMutation.mutate(operation.id)}>Cancel</Button>}</td></tr>)}</tbody></table></div>
        {operationsQuery.isPending && <p className="text-sm text-muted-foreground">Loading treasury requests…</p>}{!operationsQuery.isPending && !operations.length && <p className="text-sm text-muted-foreground">No treasury operation requests yet.</p>}
      </section>
      <form className="space-y-3 rounded-2xl bg-white p-5 shadow-sm" onSubmit={submitOperation}><h2 className="font-bold">Record operation request</h2><label className="block text-sm">Operation<select name="operationType" className="mt-1 h-10 w-full rounded-md border bg-white px-2"><option value="transfer">Transfer</option><option value="top_up">Top up</option><option value="withdraw">Withdraw</option><option value="rebalance">Rebalance</option></select></label><label className="block text-sm">Asset/network<select name="assetNetwork" value={selectedOperationAsset ? `${selectedOperationAsset.asset}|${selectedOperationAsset.network}` : ""} onChange={event => setOperationAssetKey(event.target.value)} className="mt-1 h-10 w-full rounded-md border bg-white px-2">{enabledAssets.map(item => <option key={`${item.asset}|${item.network}`} value={`${item.asset}|${item.network}`}>{item.asset} · {item.network}</option>)}</select></label><input type="hidden" name="asset" value={selectedOperationAsset?.asset ?? ""} /><input type="hidden" name="network" value={selectedOperationAsset?.network ?? ""} /><label className="block text-sm">Amount<input name="amount" type="number" min="0.00000001" step="any" required className="mt-1 h-10 w-full rounded-md border px-3" /></label><label className="block text-sm">From<input name="fromLocation" required maxLength={120} className="mt-1 h-10 w-full rounded-md border px-3" placeholder="Treasury source" /></label><label className="block text-sm">To<input name="toLocation" required maxLength={120} className="mt-1 h-10 w-full rounded-md border px-3" placeholder="Destination label" /></label><label className="block text-sm">Destination address (required for withdraw)<input name="destinationAddress" maxLength={256} className="mt-1 h-10 w-full rounded-md border px-3 font-mono text-xs" /></label><label className="block text-sm">Reason<textarea name="reason" required maxLength={500} rows={3} className="mt-1 w-full rounded-md border p-3" /></label><Button type="submit" disabled={operationMutation.isPending || !enabledAssets.length} className="w-full"><Plus className="h-4 w-4" />Record pending request</Button></form>
    </div>}

    {tab === "reconcile" && <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm"><div><h2 className="text-lg font-bold">Deposit observation reconciliation</h2><p className="text-sm text-muted-foreground">Summary of chain-monitor records, not wallet balances or treasury reserves.</p></div>{depositsQuery.error && <p role="alert" className="text-sm text-destructive">{(depositsQuery.error as Error).message}</p>}<div className="overflow-x-auto"><table className="w-full min-w-[780px] text-left text-sm"><thead className="text-xs text-muted-foreground"><tr><th className="p-2">Asset/network</th><th className="p-2">Observed records</th><th className="p-2">Pending</th><th className="p-2">Confirmed</th><th className="p-2">Failed</th><th className="p-2">Below minimum</th><th className="p-2">Observed amount</th><th className="p-2">Estimated USD</th></tr></thead><tbody>{groupedDeposits.map(group => <tr key={group.key} className="border-t"><td className="p-2 font-semibold">{group.asset}<span className="block text-xs font-normal text-muted-foreground">{group.network}</span></td><td className="p-2">{group.count}</td><td className="p-2">{group.pending}</td><td className="p-2">{group.confirmed}</td><td className="p-2">{group.failed}</td><td className="p-2">{group.belowMinimum}</td><td className="p-2">{group.cryptoAmount.toLocaleString(undefined, { maximumFractionDigits: 18 })} {group.asset}</td><td className="p-2">${group.estimatedUsd.toFixed(2)}</td></tr>)}</tbody></table></div>{depositsQuery.isPending && <p className="text-sm text-muted-foreground">Loading observations…</p>}{!depositsQuery.isPending && !groupedDeposits.length && <p className="text-sm text-muted-foreground">No chain observations recorded.</p>}<p className="text-xs text-muted-foreground">Summary includes the latest {deposits.length} observation records returned by the admin monitor.</p></section>}

    {assetError && <p role="alert" className="text-sm text-destructive">{assetError}</p>}
    <Dialog open={!!editingAsset} onOpenChange={open => { if (!open) { setEditingAsset(null); setAssetError(""); } }}><DialogContent className="max-w-md"><form className="space-y-4" onSubmit={submitAsset}>{editingAsset && <><DialogHeader><DialogTitle>{editingAsset.asset} · {editingAsset.network}</DialogTitle><DialogDescription>Changes are audited. Deposit processing must use this network configuration.</DialogDescription></DialogHeader><label className="block text-sm">Minimum deposit ({editingAsset.asset})<Input name="minimumDeposit" type="number" min="0" step="any" required defaultValue={editingAsset.minimum_deposit} className="mt-1" /></label><label className="block text-sm">Required confirmations<Input name="requiredConfirmations" type="number" min="1" max="100000" step="1" required defaultValue={editingAsset.required_confirmations} className="mt-1" /></label><label className="flex items-center gap-2 text-sm"><input name="enabled" type="checkbox" defaultChecked={editingAsset.enabled} />Enabled for deposits</label><label className="block text-sm">Reason for change<textarea name="note" required maxLength={500} rows={3} className="mt-1 w-full rounded-md border p-3" /></label><Button type="submit" disabled={assetMutation.isPending} className="w-full">Save audited settings</Button></>}</form></DialogContent></Dialog>
  </section>;
}

export function LiveTreasuryManagement() {
  const fetchBalances = useServerFn(listAdminTreasuryBalances);
  const fetchRequests = useServerFn(listAdminTreasuryOperationRequests);
  const fetchAssets = useServerFn(listAdminAssetNetworks);
  const createRequest = useServerFn(requestAdminTreasuryOperation);
  const cancelRequest = useServerFn(cancelAdminTreasuryOperation);
  const qc = useQueryClient();
  const [operationError, setOperationError] = useState("");
  const [notice, setNotice] = useState("");
  const [selectedAssetKey, setSelectedAssetKey] = useState("");
  const balancesQuery = useQuery({ queryKey: ["admin-treasury-balances"], queryFn: () => fetchBalances() });
  const requestsQuery = useQuery({ queryKey: ["admin-treasury-operation-requests"], queryFn: () => fetchRequests() });
  const assetsQuery = useQuery({ queryKey: ["admin-asset-networks"], queryFn: () => fetchAssets() });
  const createMutation = useMutation({
    mutationFn: (input: Parameters<typeof createRequest>[0]["data"]) => createRequest({ data: input }),
    onSuccess: result => {
      setOperationError("");
      setNotice(`Request ${result.id} recorded. It has not been executed.`);
      void qc.invalidateQueries({ queryKey: ["admin-treasury-operation-requests"] });
    },
    onError: (error: Error) => setOperationError(error.message),
  });
  const cancelMutation = useMutation({
    mutationFn: (id: string) => cancelRequest({ data: { id } }),
    onSuccess: () => {
      setOperationError("");
      setNotice("Pending request cancelled.");
      void qc.invalidateQueries({ queryKey: ["admin-treasury-operation-requests"] });
    },
    onError: (error: Error) => setOperationError(error.message),
  });
  const balances = balancesQuery.data ?? [];
  const requests = requestsQuery.data ?? [];
  const enabledAssets = (assetsQuery.data ?? []).filter(asset => asset.enabled);
  const selectedAsset = enabledAssets.find(asset => `${asset.asset}|${asset.network}` === selectedAssetKey) ?? enabledAssets[0];
  const valuedRows = balances.filter(row => row.amount_usd != null);
  const totalValued = valuedRows.reduce((total, row) => total + Number(row.amount_usd), 0);
  const hotValued = valuedRows.filter(row => row.wallet_type === "hot").reduce((total, row) => total + Number(row.amount_usd), 0);
  const coldValued = valuedRows.filter(row => row.wallet_type === "cold").reduce((total, row) => total + Number(row.amount_usd), 0);
  const accountCount = new Set(balances.map(row => row.wallet_account_id)).size;

  function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    createMutation.mutate({
      operationType: String(form.get("operationType")) as "transfer" | "top_up" | "withdraw" | "rebalance",
      asset: String(form.get("asset")),
      network: String(form.get("network")),
      amount: Number(form.get("amount")),
      fromLocation: String(form.get("fromLocation")),
      toLocation: String(form.get("toLocation")),
      destinationAddress: String(form.get("destinationAddress") ?? ""),
      reason: String(form.get("reason") ?? ""),
    });
    event.currentTarget.reset();
  }

  function moneyOrUnknown(value: number, rows: AdminTreasuryBalanceRow[]) {
    const rowsForType = rows;
    if (!rowsForType.length || rowsForType.some(row => row.amount_usd == null)) return "Valuation unavailable";
    return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  return <section className="space-y-4">
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <article className="rounded-xl bg-white p-4 shadow-sm"><p className="text-xs text-muted-foreground">Registered treasury wallets</p><p className="mt-1 text-xl font-bold">{accountCount}</p></article>
      <article className="rounded-xl bg-emerald-50 p-4"><p className="text-xs text-muted-foreground">Latest valued observations</p><p className="mt-1 text-lg font-bold">{moneyOrUnknown(totalValued, balances)}</p><p className="mt-1 text-xs text-muted-foreground">{valuedRows.length} of {balances.length} asset balances valued</p></article>
      <article className="rounded-xl bg-sky-50 p-4"><p className="text-xs text-muted-foreground">Hot wallet observations</p><p className="mt-1 text-lg font-bold">{moneyOrUnknown(hotValued, balances.filter(row => row.wallet_type === "hot"))}</p></article>
      <article className="rounded-xl bg-slate-100 p-4"><p className="text-xs text-muted-foreground">Cold wallet observations</p><p className="mt-1 text-lg font-bold">{moneyOrUnknown(coldValued, balances.filter(row => row.wallet_type === "cold"))}</p></article>
    </div>
    <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
      <div><h2 className="text-lg font-bold">Treasury balance observations</h2><p className="text-sm text-muted-foreground">Latest snapshots supplied by the trusted treasury monitor. This view does not estimate missing balances.</p></div>
      {balancesQuery.error && <p role="alert" className="text-sm text-destructive">{(balancesQuery.error as Error).message}</p>}
      <div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-left text-sm"><thead className="text-xs text-muted-foreground"><tr><th className="p-2">Wallet</th><th className="p-2">Type/status</th><th className="p-2">Network</th><th className="p-2">Asset balance</th><th className="p-2">USD value</th><th className="p-2">Block</th><th className="p-2">Observed</th></tr></thead><tbody>{balances.map(row => <tr key={`${row.wallet_account_id}-${row.asset}`} className="border-t"><td className="p-2"><p className="font-semibold">{row.label}</p><p className="max-w-56 truncate font-mono text-xs text-muted-foreground" title={row.address}>{row.address}</p></td><td className="p-2 capitalize">{row.wallet_type} · {row.wallet_status}</td><td className="p-2">{row.network}</td><td className="p-2">{Number(row.balance).toLocaleString(undefined, { maximumFractionDigits: 18 })} {row.asset}</td><td className="p-2">{row.amount_usd == null ? "Not valued" : `$${Number(row.amount_usd).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</td><td className="p-2">{row.block_number ?? "—"}</td><td className="p-2">{date(row.observed_at)}</td></tr>)}</tbody></table></div>
      {balancesQuery.isPending && <p className="text-sm text-muted-foreground">Loading treasury observations…</p>}
      {!balancesQuery.isPending && !balances.length && <p className="text-sm text-muted-foreground">No treasury balances observed. Register wallets and deploy the trusted treasury monitor to populate this view.</p>}
    </section>
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm"><div><h2 className="text-lg font-bold">Treasury operation requests</h2><p className="text-sm text-muted-foreground">Requests are not approvals, signed transactions, or completed transfers.</p></div>
        {requestsQuery.error && <p role="alert" className="text-sm text-destructive">{(requestsQuery.error as Error).message}</p>}
        <div className="overflow-x-auto"><table className="w-full min-w-[800px] text-left text-sm"><thead className="text-xs text-muted-foreground"><tr><th className="p-2">Requested</th><th className="p-2">Type</th><th className="p-2">Asset/network</th><th className="p-2">Amount</th><th className="p-2">Route</th><th className="p-2">Reason</th><th className="p-2">Status</th><th className="p-2" /></tr></thead><tbody>{requests.map(request => <tr key={request.id} className="border-t"><td className="p-2">{date(request.requested_at)}</td><td className="p-2 capitalize">{request.operation_type}</td><td className="p-2">{request.asset}<span className="block text-xs text-muted-foreground">{request.network}</span></td><td className="p-2">{Number(request.amount).toLocaleString(undefined, { maximumFractionDigits: 18 })} {request.asset}</td><td className="p-2">{request.from_location} → {request.to_location}</td><td className="max-w-48 truncate p-2" title={request.reason}>{request.reason}</td><td className="p-2"><Pill value={request.status === "requested" ? "pending" : "completed"}>{request.status}</Pill></td><td className="p-2 text-right">{request.status === "requested" && <Button size="sm" variant="outline" disabled={cancelMutation.isPending} onClick={() => cancelMutation.mutate(request.id)}>Cancel request</Button>}</td></tr>)}</tbody></table></div>
        {requestsQuery.isPending && <p className="text-sm text-muted-foreground">Loading treasury requests…</p>}{!requestsQuery.isPending && !requests.length && <p className="text-sm text-muted-foreground">No operation requests recorded.</p>}
      </section>
      <form className="space-y-3 rounded-2xl bg-white p-5 shadow-sm" onSubmit={submitRequest}><h2 className="font-bold">Create operation request</h2><label className="block text-sm">Operation<select name="operationType" className="mt-1 h-10 w-full rounded-md border bg-white px-2"><option value="transfer">Transfer</option><option value="top_up">Top up</option><option value="withdraw">Withdraw</option><option value="rebalance">Rebalance</option></select></label><label className="block text-sm">Asset/network<select name="assetNetwork" value={selectedAsset ? `${selectedAsset.asset}|${selectedAsset.network}` : ""} onChange={event => setSelectedAssetKey(event.target.value)} className="mt-1 h-10 w-full rounded-md border bg-white px-2">{enabledAssets.map(asset => <option key={`${asset.asset}|${asset.network}`} value={`${asset.asset}|${asset.network}`}>{asset.asset} · {asset.network}</option>)}</select></label><input type="hidden" name="asset" value={selectedAsset?.asset ?? ""} /><input type="hidden" name="network" value={selectedAsset?.network ?? ""} /><label className="block text-sm">Amount<input name="amount" type="number" min="0.00000001" step="any" required className="mt-1 h-10 w-full rounded-md border px-3" /></label><label className="block text-sm">From<input name="fromLocation" required maxLength={120} className="mt-1 h-10 w-full rounded-md border px-3" /></label><label className="block text-sm">To<input name="toLocation" required maxLength={120} className="mt-1 h-10 w-full rounded-md border px-3" /></label><label className="block text-sm">Destination address (required for withdrawal)<input name="destinationAddress" maxLength={256} className="mt-1 h-10 w-full rounded-md border px-3 font-mono text-xs" /></label><label className="block text-sm">Reason<textarea name="reason" required maxLength={500} rows={3} className="mt-1 w-full rounded-md border p-3" /></label>{operationError && <p role="alert" className="text-sm text-destructive">{operationError}</p>}{notice && <p role="status" className="text-sm text-muted-foreground">{notice}</p>}<Button type="submit" disabled={createMutation.isPending || !selectedAsset} className="w-full"><Plus className="h-4 w-4" />Record pending request</Button></form>
    </div>
  </section>;
}

export function LiveTransactionsManagement() {
  const fetchTransactions = useServerFn(listAdminTransactions);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [detail, setDetail] = useState<AdminTransactionRow | null>(null);
  const { data = [], isPending, error } = useQuery({ queryKey: ["admin-transactions"], queryFn: () => fetchTransactions() });
  const successful = data.filter(row => transactionOutcome(row.status) === "successful").length;
  const failed = data.filter(row => transactionOutcome(row.status) === "failed").length;
  const pending = data.filter(row => transactionOutcome(row.status) === "pending").length;
  const search = query.trim().toLowerCase();
  const rows = data.filter(row => {
    const outcome = transactionOutcome(row.status);
    const text = [row.id, row.user.full_name, row.user.email, row.reference, row.tx_hash, row.coin, row.network, row.kind, row.counterparty].join(" ").toLowerCase();
    return (filter === "all" || outcome === filter) && text.includes(search);
  });

  return <section className="space-y-4">
    <div className="grid gap-3 sm:grid-cols-3">
      <article className="flex items-center gap-3 rounded-xl bg-emerald-50 p-4"><CircleCheck className="h-5 w-5 text-emerald-700" /><div><p className="text-xs text-muted-foreground">Successful</p><p className="text-xl font-bold">{successful}</p></div></article>
      <article className="flex items-center gap-3 rounded-xl bg-red-50 p-4"><CircleX className="h-5 w-5 text-red-700" /><div><p className="text-xs text-muted-foreground">Failed</p><p className="text-xl font-bold">{failed}</p></div></article>
      <article className="flex items-center gap-3 rounded-xl bg-amber-50 p-4"><div className="h-2.5 w-2.5 rounded-full bg-amber-500" /><div><p className="text-xs text-muted-foreground">Pending / processing</p><p className="text-xl font-bold">{pending}</p></div></article>
    </div>
    <section className="space-y-4 rounded-3xl bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="mr-auto text-lg font-bold">Transactions ({data.length})</h2>
        <label className="relative w-full sm:max-w-sm"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input aria-label="Search transactions" placeholder="Search user, reference, hash, asset" value={query} onChange={event => setQuery(event.target.value)} className="h-10 pl-9" /></label>
        <label className="text-sm font-semibold">Outcome<select aria-label="Filter transaction outcome" value={filter} onChange={event => setFilter(event.target.value)} className="ml-2 rounded-lg border px-2 py-2 font-normal"><option value="all">All</option><option value="successful">Successful</option><option value="failed">Failed</option><option value="pending">Pending</option></select></label>
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{(error as Error).message}</p>}
      <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-sm">
        <thead><tr className="text-left text-xs text-muted-foreground"><th className="p-2">Transaction</th><th className="p-2">User</th><th className="p-2">Activity</th><th className="p-2">Asset / network</th><th className="p-2">Amount (USD)</th><th className="p-2">Outcome</th><th className="p-2">Date</th><th className="p-2 text-right">Details</th></tr></thead>
        <tbody>{rows.map(row => {
          const outcome = transactionOutcome(row.status);
          return <tr key={row.id} className="border-t">
            <td className="max-w-56 truncate p-2 font-mono text-xs" title={row.reference || row.id}>{row.reference || row.id.slice(0, 8)}</td>
            <td className="p-2"><p className="font-semibold">{row.user.full_name || "—"}</p><p className="text-xs text-muted-foreground">{row.user.email}</p></td>
            <td className="p-2 capitalize">{row.kind} · {row.direction}</td>
            <td className="p-2">{row.coin || "USD"}<span className="block text-xs text-muted-foreground">{row.network || "—"}</span></td>
            <td className="p-2">${Number(row.usd_amount).toFixed(2)}</td>
            <td className="p-2"><Pill value={outcome}>{outcome === "successful" ? "Successful" : outcome === "failed" ? "Failed" : outcome === "pending" ? "Pending" : row.status}</Pill></td>
            <td className="p-2">{date(row.created_at)}</td>
            <td className="p-2 text-right"><Button size="sm" variant="outline" aria-label={`View transaction ${row.reference || row.id}`} onClick={() => setDetail(row)}><Eye className="h-4 w-4" />View</Button></td>
          </tr>;
        })}</tbody>
      </table></div>
      {isPending && <p className="text-sm text-muted-foreground">Loading transactions…</p>}
      {!isPending && rows.length === 0 && !error && <p className="text-sm text-muted-foreground">No transactions match these filters.</p>}
      <p className="text-xs text-muted-foreground">Showing the latest {data.length} ledger record{data.length === 1 ? "" : "s"}. Status reflects the transaction record in the platform ledger.</p>
    </section>
    <Dialog open={!!detail} onOpenChange={open => { if (!open) setDetail(null); }}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        {detail && <>
          <DialogHeader><DialogTitle>Transaction details</DialogTitle><DialogDescription>{detail.reference || detail.id}</DialogDescription></DialogHeader>
          <dl className="grid gap-3 sm:grid-cols-2">
            {([["Outcome", transactionOutcome(detail.status) === "successful" ? "Successful" : transactionOutcome(detail.status) === "failed" ? "Failed" : detail.status], ["Status recorded", detail.status], ["Member", detail.user.full_name || "—"], ["Email", detail.user.email || "—"], ["Activity", `${detail.kind} · ${detail.direction}`], ["Asset", detail.coin || "USD"], ["Network", detail.network || "—"], ["Crypto amount", detail.crypto_amount == null ? "—" : String(detail.crypto_amount)], ["USD amount", `$${Number(detail.usd_amount).toFixed(2)}`], ["Fee", `$${Number(detail.fee_usd).toFixed(2)}`], ["Price", `$${Number(detail.price_usd).toFixed(2)}`], ["Counterparty", detail.counterparty || "—"], ["Reference", detail.reference || detail.id], ["Transaction hash", detail.tx_hash || "Not recorded"], ["Created", new Date(detail.created_at).toLocaleString()]] as const).map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 break-all text-sm font-semibold">{label === "Outcome" ? <Pill value={transactionOutcome(detail.status)}>{value}</Pill> : value}</dd></div>)}
            {detail.note && <div className="sm:col-span-2"><dt className="text-xs text-muted-foreground">Note</dt><dd className="mt-1 whitespace-pre-wrap text-sm">{detail.note}</dd></div>}
          </dl>
        </>}
      </DialogContent>
    </Dialog>
  </section>;
}

export function LiveTradeManagement({ initialTab = "orders" }: { initialTab?: "orders" | "settings" | "history" }) {
  const fetchOrders = useServerFn(listAdminTradeOrders);
  const fetchSettings = useServerFn(listAdminTradeSettings);
  const fetchSettingsAudit = useServerFn(listAdminTradeSettingsAudit);
  const saveSettings = useServerFn(updateAdminTradeSettings);
  const qc = useQueryClient();
  const [tab, setTab] = useState<"orders" | "settings" | "history">(initialTab);
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [asset, setAsset] = useState("all");
  const [status, setStatus] = useState("all");
  const [detail, setDetail] = useState<AdminTradeOrderRow | null>(null);
  const [editing, setEditing] = useState<AdminTradeSettingRow | null>(null);
  const [message, setMessage] = useState("");
  const ordersQuery = useQuery({ queryKey: ["admin-trade-orders"], queryFn: () => fetchOrders() });
  const settingsQuery = useQuery({ queryKey: ["admin-trade-settings"], queryFn: () => fetchSettings() });
  const auditQuery = useQuery({ queryKey: ["admin-trade-settings-audit"], queryFn: () => fetchSettingsAudit(), enabled: tab === "history" });
  const updateMutation = useMutation({
    mutationFn: (input: { coin: string; network: string; buyPrice: number; sellPrice: number; minimumCrypto: number; maximumCrypto: number; buyEnabled: boolean; sellEnabled: boolean; note: string }) => saveSettings({ data: input }),
    onSuccess: () => {
      setEditing(null);
      setMessage("Trade settings updated and audit recorded.");
      void qc.invalidateQueries({ queryKey: ["admin-trade-settings"] });
    },
    onError: (error: Error) => setMessage(error.message),
  });
  const orders = ordersQuery.data ?? [];
  const settings = settingsQuery.data ?? [];
  const successful = orders.filter(order => ["completed", "success", "succeeded", "paid"].includes(order.status.toLowerCase())).length;
  const failed = orders.filter(order => ["failed", "rejected", "cancelled", "canceled"].includes(order.status.toLowerCase())).length;
  const volume = orders.reduce((total, order) => total + Number(order.usd_amount), 0);
  const assets = [...new Set(orders.map(order => order.coin))].sort();
  const queryText = query.trim().toLowerCase();
  const rows = orders.filter(order => {
    const text = [order.id, order.user.full_name, order.user.email, order.coin, order.network, order.tx_hash].join(" ").toLowerCase();
    return text.includes(queryText) && (type === "all" || order.type.toLowerCase() === type) && (asset === "all" || order.coin === asset) && (status === "all" || order.status.toLowerCase() === status);
  });

  function exportRows() {
    const csvCell = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
    const content = [
      ["Order ID", "User", "Email", "Type", "Asset", "Network", "Crypto amount", "USD amount", "Fee USD", "Settlement USD", "Price USD", "Status", "TX hash", "Created"].map(csvCell).join(","),
      ...rows.map(order => [order.id, order.user.full_name ?? "", order.user.email ?? "", order.type, order.coin, order.network, order.crypto_amount, order.usd_amount, order.fee_usd, order.settlement_usd, order.price_usd, order.status, order.tx_hash ?? "", order.created_at].map(csvCell).join(",")),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "buy-sell-orders.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function submitSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    const form = new FormData(event.currentTarget);
    updateMutation.mutate({
      coin: editing.coin,
      network: editing.network,
      buyPrice: Number(form.get("buyPrice")),
      sellPrice: Number(form.get("sellPrice")),
      minimumCrypto: Number(form.get("minimumCrypto")),
      maximumCrypto: Number(form.get("maximumCrypto")),
      buyEnabled: form.get("buyEnabled") === "on",
      sellEnabled: form.get("sellEnabled") === "on",
      note: String(form.get("note") ?? ""),
    });
  }

  const orderStatusClass = (orderStatus: string) => {
    const normalized = orderStatus.toLowerCase();
    if (["completed", "success", "succeeded", "paid"].includes(normalized)) return "confirmed";
    if (["failed", "rejected", "cancelled", "canceled"].includes(normalized)) return "failed";
    return "pending";
  };

  return <section className="space-y-4">
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <article className="rounded-xl bg-white p-4 shadow-sm"><p className="text-xs text-muted-foreground">Persisted trade records</p><p className="mt-1 text-xl font-bold">{orders.length}</p></article>
      <article className="rounded-xl bg-emerald-50 p-4"><p className="text-xs text-muted-foreground">Successful</p><p className="mt-1 text-xl font-bold">{successful}</p></article>
      <article className="rounded-xl bg-red-50 p-4"><p className="text-xs text-muted-foreground">Failed / cancelled</p><p className="mt-1 text-xl font-bold">{failed}</p></article>
      <article className="rounded-xl bg-white p-4 shadow-sm"><p className="text-xs text-muted-foreground">Recorded order value</p><p className="mt-1 text-xl font-bold">${volume.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p></article>
    </div>
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Buy and sell management tabs">
      {([["orders", "Trade Orders"], ["settings", "Rates & Limits"], ["history", "Rate History"]] as const).map(([id, label]) => <button key={id} type="button" role="tab" aria-selected={tab === id} className={`rounded-lg px-3 py-2 text-sm font-semibold ${tab === id ? "bg-primary text-primary-foreground" : "bg-white text-muted-foreground"}`} onClick={() => setTab(id)}>{label}</button>)}
      <Button type="button" variant="outline" className="ml-auto" onClick={() => { void qc.invalidateQueries({ queryKey: ["admin-trade-orders"] }); void qc.invalidateQueries({ queryKey: ["admin-trade-settings"] }); void qc.invalidateQueries({ queryKey: ["admin-trade-settings-audit"] }); }}><RefreshCw className="h-4 w-4" />Refresh</Button>
    </div>
    {message && <p role="status" className="text-sm text-muted-foreground">{message}</p>}
    {tab === "orders" && <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-3"><div className="mr-auto"><h2 className="text-lg font-bold">Buy and sell orders</h2><p className="text-sm text-muted-foreground">Orders are read from persisted settlement records. This screen does not create, cancel, or alter trades.</p></div><Button type="button" variant="outline" onClick={exportRows}><ArrowDownToLine className="h-4 w-4" />Export CSV</Button></div>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4"><Input aria-label="Search trade orders" placeholder="Search user, order, asset, hash" value={query} onChange={event => setQuery(event.target.value)} /><select aria-label="Filter trade type" value={type} onChange={event => setType(event.target.value)} className="h-10 rounded-md border bg-white px-2 text-sm"><option value="all">All types</option><option value="buy">Buy</option><option value="sell">Sell</option></select><select aria-label="Filter trade asset" value={asset} onChange={event => setAsset(event.target.value)} className="h-10 rounded-md border bg-white px-2 text-sm"><option value="all">All assets</option>{assets.map(symbol => <option key={symbol}>{symbol}</option>)}</select><select aria-label="Filter trade status" value={status} onChange={event => setStatus(event.target.value)} className="h-10 rounded-md border bg-white px-2 text-sm"><option value="all">All statuses</option>{[...new Set(orders.map(order => order.status.toLowerCase()))].sort().map(value => <option key={value}>{value}</option>)}</select></div>
      {ordersQuery.error && <p role="alert" className="text-sm text-destructive">{(ordersQuery.error as Error).message}</p>}
      <div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-left text-sm"><thead className="text-xs text-muted-foreground"><tr><th className="p-2">Order</th><th className="p-2">Member</th><th className="p-2">Type</th><th className="p-2">Asset/network</th><th className="p-2">Crypto</th><th className="p-2">USD value</th><th className="p-2">Fee</th><th className="p-2">Settlement</th><th className="p-2">Status</th><th className="p-2">Created</th><th className="p-2" /></tr></thead><tbody>{rows.map(order => <tr key={`${order.type}-${order.id}`} className="border-t"><td className="p-2 font-mono text-xs">{order.id.slice(0, 8)}</td><td className="p-2"><p className="font-semibold">{order.user.full_name || "—"}</p><p className="text-xs text-muted-foreground">{order.user.email}</p></td><td className="p-2"><Pill value={order.type === "Buy" ? "confirmed" : "pending"}>{order.type}</Pill></td><td className="p-2">{order.coin}<span className="block text-xs text-muted-foreground">{order.network}</span></td><td className="p-2">{Number(order.crypto_amount).toLocaleString(undefined, { maximumFractionDigits: 10 })}</td><td className="p-2">${Number(order.usd_amount).toFixed(2)}</td><td className="p-2">${Number(order.fee_usd).toFixed(2)}</td><td className="p-2">${Number(order.settlement_usd).toFixed(2)}</td><td className="p-2"><Pill value={orderStatusClass(order.status)}>{order.status}</Pill></td><td className="p-2">{date(order.created_at)}</td><td className="p-2 text-right"><Button size="sm" variant="outline" onClick={() => setDetail(order)}><Eye className="h-4 w-4" />Details</Button></td></tr>)}</tbody></table></div>
      {ordersQuery.isPending && <p className="text-sm text-muted-foreground">Loading trade orders…</p>}{!ordersQuery.isPending && !rows.length && <p className="text-sm text-muted-foreground">No persisted buy or sell orders match these filters.</p>}<p className="text-xs text-muted-foreground">Showing up to 2,000 most recent buy/sell records.</p>
    </section>}
    {tab === "settings" && <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm"><div><h2 className="text-lg font-bold">Trade rates and limits</h2><p className="text-sm text-muted-foreground">Changes apply to new customer settlements. Prices sent by clients are ignored by the database.</p></div>{settingsQuery.error && <p role="alert" className="text-sm text-destructive">{(settingsQuery.error as Error).message}</p>}<div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="text-xs text-muted-foreground"><tr><th className="p-2">Asset/network</th><th className="p-2">Buy rate</th><th className="p-2">Sell rate</th><th className="p-2">Min crypto</th><th className="p-2">Max crypto</th><th className="p-2">Buy</th><th className="p-2">Sell</th><th className="p-2" /></tr></thead><tbody>{settings.map(setting => <tr key={`${setting.coin}-${setting.network}`} className="border-t"><td className="p-2 font-semibold">{setting.coin}<span className="block text-xs font-normal text-muted-foreground">{setting.network}</span></td><td className="p-2">${Number(setting.buy_price_usd).toLocaleString()}</td><td className="p-2">${Number(setting.sell_price_usd).toLocaleString()}</td><td className="p-2">{setting.minimum_crypto_amount}</td><td className="p-2">{setting.maximum_crypto_amount}</td><td className="p-2"><Pill value={setting.buy_enabled ? "confirmed" : "failed"}>{setting.buy_enabled ? "On" : "Off"}</Pill></td><td className="p-2"><Pill value={setting.sell_enabled ? "confirmed" : "failed"}>{setting.sell_enabled ? "On" : "Off"}</Pill></td><td className="p-2 text-right"><Button size="sm" variant="outline" onClick={() => { setMessage(""); setEditing(setting); }}>Edit</Button></td></tr>)}</tbody></table></div>{settingsQuery.isPending && <p className="text-sm text-muted-foreground">Loading trade settings…</p>}
    </section>}
    {tab === "history" && <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm"><div><h2 className="text-lg font-bold">Rate and limit change history</h2><p className="text-sm text-muted-foreground">Audited updates to customer-facing buy/sell settings.</p></div>{auditQuery.error && <p role="alert" className="text-sm text-destructive">{(auditQuery.error as Error).message}</p>}<div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-left text-sm"><thead className="text-xs text-muted-foreground"><tr><th className="p-2">Changed</th><th className="p-2">Asset/network</th><th className="p-2">Buy rate</th><th className="p-2">Sell rate</th><th className="p-2">Order limits</th><th className="p-2">Availability</th><th className="p-2">Admin</th><th className="p-2">Reason</th></tr></thead><tbody>{(auditQuery.data ?? []).map((row: AdminTradeSettingsAuditRow) => <tr key={row.id} className="border-t"><td className="p-2">{new Date(row.created_at).toLocaleString()}</td><td className="p-2">{row.coin}<span className="block text-xs text-muted-foreground">{row.network}</span></td><td className="p-2">${row.previous_buy_price_usd} → ${row.next_buy_price_usd}</td><td className="p-2">${row.previous_sell_price_usd} → ${row.next_sell_price_usd}</td><td className="p-2">{row.previous_minimum_crypto_amount}–{row.previous_maximum_crypto_amount} → {row.next_minimum_crypto_amount}–{row.next_maximum_crypto_amount} {row.coin}</td><td className="p-2">Buy {row.previous_buy_enabled ? "on" : "off"} → {row.next_buy_enabled ? "on" : "off"}; Sell {row.previous_sell_enabled ? "on" : "off"} → {row.next_sell_enabled ? "on" : "off"}</td><td className="p-2">{row.admin_name || "Admin account unavailable"}</td><td className="max-w-56 whitespace-normal p-2">{row.note}</td></tr>)}</tbody></table></div>{auditQuery.isPending && <p className="text-sm text-muted-foreground">Loading rate history…</p>}{!auditQuery.isPending && !auditQuery.data?.length && <p className="text-sm text-muted-foreground">No pricing changes have been recorded.</p>}</section>}
    <Dialog open={!!detail} onOpenChange={open => { if (!open) setDetail(null); }}><DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">{detail && <><DialogHeader><DialogTitle>{detail.type} order details</DialogTitle><DialogDescription>{detail.id}</DialogDescription></DialogHeader><dl className="grid gap-3 sm:grid-cols-2">{([["Member", detail.user.full_name || "—"], ["Email", detail.user.email || "—"], ["Type", detail.type], ["Asset", detail.coin], ["Network", detail.network], ["Crypto amount", String(detail.crypto_amount)], ["USD value", `$${Number(detail.usd_amount).toFixed(2)}`], ["Fee", `$${Number(detail.fee_usd).toFixed(2)}`], [detail.type === "Buy" ? "Total charged" : "Payout", `$${Number(detail.settlement_usd).toFixed(2)}`], ["Execution price", `$${Number(detail.price_usd).toLocaleString()}`], ["Status", detail.status], ["Transaction hash", detail.tx_hash || "Not recorded"], ["Created", new Date(detail.created_at).toLocaleString()]] as const).map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 break-all text-sm font-semibold">{label === "Status" ? <Pill value={orderStatusClass(detail.status)}>{value}</Pill> : value}</dd></div>)}</dl></>}</DialogContent></Dialog>
    <Dialog open={!!editing} onOpenChange={open => { if (!open) setEditing(null); }}><DialogContent className="max-w-md"><form className="space-y-4" onSubmit={submitSettings}>{editing && <><DialogHeader><DialogTitle>{editing.coin} · {editing.network}</DialogTitle><DialogDescription>Settings are audited and affect new settlements immediately after save.</DialogDescription></DialogHeader><label className="block text-sm">Buy rate (USD)<Input name="buyPrice" type="number" min="0.0000000001" step="any" required defaultValue={editing.buy_price_usd} className="mt-1" /></label><label className="block text-sm">Sell rate (USD)<Input name="sellPrice" type="number" min="0.0000000001" step="any" required defaultValue={editing.sell_price_usd} className="mt-1" /></label><label className="block text-sm">Minimum amount ({editing.coin})<Input name="minimumCrypto" type="number" min="0.0000000001" step="any" required defaultValue={editing.minimum_crypto_amount} className="mt-1" /></label><label className="block text-sm">Maximum amount ({editing.coin})<Input name="maximumCrypto" type="number" min="0.0000000001" step="any" required defaultValue={editing.maximum_crypto_amount} className="mt-1" /></label><label className="flex items-center gap-2 text-sm"><input name="buyEnabled" type="checkbox" defaultChecked={editing.buy_enabled} />Enable buying</label><label className="flex items-center gap-2 text-sm"><input name="sellEnabled" type="checkbox" defaultChecked={editing.sell_enabled} />Enable selling</label><label className="block text-sm">Reason for change<textarea name="note" required maxLength={500} rows={3} className="mt-1 w-full rounded-md border p-3" /></label><Button type="submit" disabled={updateMutation.isPending} className="w-full">Save audited settings</Button></>}</form></DialogContent></Dialog>
  </section>;
}

export function LiveDepositsMonitoring() {
  const fetchDeposits = useServerFn(listAdminDeposits);
  const [status, setStatus] = useState("all");
  const [asset, setAsset] = useState("all");
  const [userId, setUserId] = useState("all");
  const [network, setNetwork] = useState("all");
  const [query, setQuery] = useState("");
  const [detail, setDetail] = useState<AdminDepositRow | null>(null);
  const { data = [], isPending, error } = useQuery({ queryKey: ["admin-deposit-observations"], queryFn: () => fetchDeposits() });
  const pendingCount = data.filter(row => row.status === "pending").length;
  const confirmedCount = data.filter(row => row.status === "confirmed").length;
  const failedCount = data.filter(row => row.status === "failed").length;
  const assets = [...new Set(data.map(row => row.asset))].sort();
  const networks = [...new Set(data.map(row => row.network))].sort();
  const users = [...new Map(data.filter(row => row.user_id && row.user).map(row => [row.user_id!, { id: row.user_id!, label: row.user?.full_name || row.user?.email || row.user_id! }])).entries()];
  const search = query.trim().toLowerCase();
  const rows = data.filter(row => {
    const text = [row.tx_hash, row.deposit_address, row.asset, row.network, row.user?.full_name, row.user?.email, row.failure_reason].join(" ").toLowerCase();
    return (status === "all" || row.status === status) && (asset === "all" || row.asset === asset) && (userId === "all" || row.user_id === userId) && (network === "all" || row.network === network) && text.includes(search);
  });

  return <section className="space-y-4">
    <div className="grid gap-3 sm:grid-cols-3">
      <article className="rounded-xl bg-amber-50 p-4"><p className="text-xs text-muted-foreground">Pending confirmations</p><p className="mt-1 text-xl font-bold">{pendingCount}</p></article>
      <article className="rounded-xl bg-emerald-50 p-4"><p className="text-xs text-muted-foreground">Confirmed deposits</p><p className="mt-1 text-xl font-bold">{confirmedCount}</p></article>
      <article className="rounded-xl bg-red-50 p-4"><p className="text-xs text-muted-foreground">Failed deposits</p><p className="mt-1 text-xl font-bold">{failedCount}</p></article>
    </div>
    <section className="space-y-4 rounded-3xl bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="mr-auto text-lg font-bold">Chain deposit observations ({data.length})</h2>
        <label className="relative w-full sm:max-w-xs"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input aria-label="Search deposits" placeholder="Search address, hash, user" value={query} onChange={event => setQuery(event.target.value)} className="h-10 pl-9" /></label>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <label className="text-xs font-semibold text-muted-foreground">Status<select aria-label="Filter deposit status" value={status} onChange={event => setStatus(event.target.value)} className="mt-1 block h-10 w-full rounded-md border bg-white px-2 text-sm font-normal text-foreground"><option value="all">All statuses</option><option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="failed">Failed</option></select></label>
        <label className="text-xs font-semibold text-muted-foreground">Asset<select aria-label="Filter deposit asset" value={asset} onChange={event => setAsset(event.target.value)} className="mt-1 block h-10 w-full rounded-md border bg-white px-2 text-sm font-normal text-foreground"><option value="all">All assets</option>{assets.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
        <label className="text-xs font-semibold text-muted-foreground">User<select aria-label="Filter deposit user" value={userId} onChange={event => setUserId(event.target.value)} className="mt-1 block h-10 w-full rounded-md border bg-white px-2 text-sm font-normal text-foreground"><option value="all">All users</option>{users.map(([id, u]) => <option key={id} value={id}>{u.label}</option>)}</select></label>
        <label className="text-xs font-semibold text-muted-foreground">Network<select aria-label="Filter deposit network" value={network} onChange={event => setNetwork(event.target.value)} className="mt-1 block h-10 w-full rounded-md border bg-white px-2 text-sm font-normal text-foreground"><option value="all">All networks</option>{networks.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{(error as Error).message}</p>}
      <div className="overflow-x-auto"><table className="w-full min-w-[1000px] text-sm">
        <thead><tr className="text-left text-xs text-muted-foreground"><th className="p-2">Asset / network</th><th className="p-2">User</th><th className="p-2">Amount</th><th className="p-2">Transaction</th><th className="p-2">Confirmations</th><th className="p-2">Minimum</th><th className="p-2">Status</th><th className="p-2">Observed</th><th className="p-2 text-right">Details</th></tr></thead>
        <tbody>{rows.map(row => <tr key={row.id} className="border-t">
          <td className="p-2"><p className="font-semibold">{row.asset}</p><p className="text-xs text-muted-foreground">{row.network}</p></td>
          <td className="p-2">{row.user ? <><p className="font-semibold">{row.user.full_name || "—"}</p><p className="text-xs text-muted-foreground">{row.user.email}</p></> : <Pill value="unmatched">Unmatched address</Pill>}</td>
          <td className="p-2"><p>{Number(row.crypto_amount).toLocaleString(undefined, { maximumFractionDigits: 18 })} {row.asset}</p>{row.amount_usd != null && <p className="text-xs text-muted-foreground">${Number(row.amount_usd).toFixed(2)}</p>}</td>
          <td className="max-w-48 truncate p-2 font-mono text-xs" title={row.tx_hash}>{row.tx_hash}</td>
          <td className="p-2">{row.confirmations} / {row.required_confirmations}</td>
          <td className="p-2"><Pill value={row.below_minimum ? "failed" : "confirmed"}>{row.below_minimum ? "Below minimum" : "Meets minimum"}</Pill></td>
          <td className="p-2"><Pill value={row.status} /></td>
          <td className="p-2">{date(row.observed_at)}</td>
          <td className="p-2 text-right"><Button size="sm" variant="outline" onClick={() => setDetail(row)}><Eye className="h-4 w-4" />View</Button></td>
        </tr>)}</tbody>
      </table></div>
      {isPending && <p className="text-sm text-muted-foreground">Loading chain observations…</p>}
      {!isPending && rows.length === 0 && !error && <p className="text-sm text-muted-foreground">No deposits match these filters.</p>}
      <p className="text-xs text-muted-foreground">These records come from the trusted chain monitor, not customer-submitted receive requests. Latest {data.length} observations are shown.</p>
    </section>
    <Dialog open={!!detail} onOpenChange={open => { if (!open) setDetail(null); }}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        {detail && <>
          <DialogHeader><DialogTitle>Deposit details</DialogTitle><DialogDescription>{detail.asset} on {detail.network}</DialogDescription></DialogHeader>
          <dl className="grid gap-3 sm:grid-cols-2">
            {([["Status", detail.status], ["User", detail.user?.full_name || detail.user?.email || "Unmatched address"], ["Asset", detail.asset], ["Network", detail.network], ["Crypto amount", `${detail.crypto_amount} ${detail.asset}`], ["Minimum deposit", detail.below_minimum ? "Below configured minimum" : "Meets configured minimum"], ["USD estimate", detail.amount_usd == null ? "Not available" : `$${Number(detail.amount_usd).toFixed(2)}`], ["Transaction hash", detail.tx_hash], ["Output / event index", String(detail.event_index)], ["Deposit address", detail.deposit_address], ["Destination tag", detail.destination_tag == null ? "—" : String(detail.destination_tag)], ["Confirmations", `${detail.confirmations} / ${detail.required_confirmations}`], ["Block number", detail.block_number == null ? "—" : String(detail.block_number)], ["Block hash", detail.block_hash || "—"], ["Observed", new Date(detail.observed_at).toLocaleString()], ["Confirmed at", detail.confirmed_at ? new Date(detail.confirmed_at).toLocaleString() : "—"]] as const).map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 break-all text-sm font-semibold">{label === "Status" ? <Pill value={detail.status} /> : value}</dd></div>)}
            {detail.failure_reason && <div className="sm:col-span-2"><dt className="text-xs text-muted-foreground">Failure reason</dt><dd className="mt-1 whitespace-pre-wrap text-sm">{detail.failure_reason}</dd></div>}
          </dl>
        </>}
      </DialogContent>
    </Dialog>
  </section>;
}

export function LiveAccountDeletionManagement() {
  const fetchRequests = useServerFn(listAccountDeletionRequests);
  const exportData = useServerFn(exportAccountDataForDeletionRequest);
  const [filter, setFilter] = useState("pending");
  const [exportingId, setExportingId] = useState("");
  const [exportError, setExportError] = useState("");
  const { data = [], isPending, error } = useQuery({ queryKey: ["admin-account-deletion-requests"], queryFn: () => fetchRequests() });
  const rows = data.filter(row => filter === "all" || row.status === filter);

  async function download(requestId: string, email: string | null) {
    setExportingId(requestId);
    setExportError("");
    try {
      const bundle = await exportData({ data: { requestId } });
      const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
      const href = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = href;
      link.download = `account-data-${(email ?? requestId).replace(/[^a-z0-9._-]/gi, "_")}.json`;
      link.click();
      URL.revokeObjectURL(href);
    } catch (e) {
      setExportError((e as Error).message);
    } finally {
      setExportingId("");
    }
  }

  return <section className="space-y-4 rounded-3xl bg-white p-5 shadow-sm">
    <div className="flex flex-wrap items-center gap-3">
      <h2 className="mr-auto text-lg font-bold">Deletion requests ({data.length})</h2>
      <label className="text-sm font-semibold">Status
        <select aria-label="Filter deletion requests" value={filter} onChange={event => setFilter(event.target.value)} className="ml-2 rounded-lg border px-2 py-2 font-normal">
          {["pending", "reviewing", "approved", "rejected", "completed", "all"].map(status => <option key={status} value={status}>{status[0].toUpperCase() + status.slice(1)}</option>)}
        </select>
      </label>
    </div>
    {error && <p role="alert" className="text-sm text-destructive">{(error as Error).message}</p>}
    {exportError && <p role="alert" className="text-sm text-destructive">{exportError}</p>}
    <div className="overflow-x-auto"><table className="w-full text-sm">
      <thead><tr className="text-left text-xs text-muted-foreground"><th className="p-2">Member</th><th className="p-2">Phone</th><th className="p-2">Country</th><th className="p-2">Requested</th><th className="p-2">Status</th><th className="p-2 text-right">Account data</th></tr></thead>
      <tbody>{rows.map(request => <tr key={request.id} className="border-t">
        <td className="p-2"><p className="font-semibold">{request.profile.full_name || "—"}</p><p className="text-xs text-muted-foreground">{request.profile.email}</p></td>
        <td className="p-2">{request.profile.phone || "—"}</td>
        <td className="p-2">{request.profile.country || "—"}</td>
        <td className="p-2">{date(request.requested_at)}</td>
        <td className="p-2"><Pill value={request.status} /></td>
        <td className="p-2 text-right"><Button size="sm" variant="outline" disabled={!!exportingId} onClick={() => void download(request.id, request.profile.email)}><ArrowDownToLine className="h-4 w-4" />{exportingId === request.id ? "Preparing…" : "Download JSON"}</Button></td>
      </tr>)}</tbody>
    </table></div>
    {isPending && <p className="text-sm text-muted-foreground">Loading deletion requests…</p>}
    {!isPending && rows.length === 0 && !error && <p className="text-sm text-muted-foreground">No {filter === "all" ? "" : filter + " "}deletion requests.</p>}
  </section>;
}

export function LiveVerificationManagement() {
  const fetchList = useServerFn(listAdminVerifications);
  const review = useServerFn(reviewVerification);
  const qc = useQueryClient();
  const [filter, setFilter] = useState("pending");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [notice, setNotice] = useState("");
  const { data = [], isPending, error } = useQuery({ queryKey: ["admin-verifications"], queryFn: () => fetchList() });
  const decide = useMutation({
    mutationFn: (v: { id: string; decision: "approved" | "rejected"; note?: string }) => review({ data: v }),
    onSuccess: (res, v) => {
      setNote("");
      setNotice(`${v.decision === "approved" ? "Approved" : "Rejected"}. ${res.emailStatus === "sent" ? "The member was emailed." : res.emailStatus === "suppressed" ? "The member has opted out of emails." : "The email could not be sent."}`);
      qc.invalidateQueries({ queryKey: ["admin-verifications"] });
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });
  const rows = data.filter(r => filter === "all" || r.status === filter);
  const selected: AdminVerificationRow | undefined = data.find(r => r.id === selectedId) ?? rows[0];

  return <section className="grid items-start gap-4 lg:grid-cols-[320px_1fr]">
    <aside className="rounded-3xl bg-white p-4 shadow-sm">
      <label className="flex items-center justify-between gap-2 text-sm font-bold">Requests
        <select aria-label="Filter status" value={filter} onChange={e => setFilter(e.target.value)} className="rounded-lg border px-2 py-1 font-normal">
          {["pending", "approved", "rejected", "all"].map(o => <option key={o} value={o}>{o[0].toUpperCase() + o.slice(1)}</option>)}
        </select></label>
      {error && <p role="alert" className="mt-3 text-sm text-destructive">{(error as Error).message}</p>}
      <ul className="mt-3 space-y-1">{rows.map(r => <li key={r.id}>
        <button type="button" onClick={() => { setSelectedId(r.id); setNotice(""); }} className={`w-full rounded-2xl p-3 text-left ${selected?.id === r.id ? "bg-[#f3eefe]" : "hover:bg-muted"}`}>
          <span className="flex items-center justify-between gap-2"><span className="font-semibold">{r.full_name}</span><Pill value={r.status} /></span>
          <span className="block truncate text-xs text-muted-foreground">{r.email} · {date(r.created_at)}</span>
        </button></li>)}</ul>
      {isPending && <p className="mt-3 text-sm text-muted-foreground">Loading…</p>}
      {!isPending && rows.length === 0 && <p className="mt-3 text-sm text-muted-foreground">No {filter === "all" ? "" : filter} requests.</p>}
    </aside>
    {selected ? <article className="space-y-4 rounded-3xl bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-2"><h2 className="mr-auto text-xl font-extrabold">{selected.full_name}</h2><Pill value={selected.status} /></div>
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        {([["Email", selected.email], ["Phone", selected.phone], ["Country", selected.country], ["Address", selected.address], ["ID document", selected.id_document_type], ["SSN last 4", selected.ssn_last4 ?? "—"], ["Submitted", date(selected.created_at)]] as const).map(([k, v]) =>
          <div key={k}><dt className="text-xs text-muted-foreground">{k}</dt><dd className="font-semibold">{v}</dd></div>)}
      </dl>
      {selected.reviewer_note && <p className="rounded-xl bg-muted p-3 text-sm"><b>Reviewer note:</b> {selected.reviewer_note}</p>}
      {selected.status === "pending" && <div className="space-y-3 border-t pt-4">
        <label className="block text-sm font-semibold">Note to member (required to reject)
          <textarea value={note} onChange={e => setNote(e.target.value)} maxLength={500} rows={3} className="mt-1 w-full rounded-xl border p-3 font-normal" placeholder="e.g. The ID photo was blurry. Please upload a clearer copy." /></label>
        <div className="flex gap-2">
          <Button type="button" disabled={decide.isPending} className="bg-emerald-600 hover:bg-emerald-600/90" onClick={() => decide.mutate({ id: selected.id, decision: "approved", note })}><Check className="h-4 w-4" />Accept</Button>
          <Button type="button" variant="destructive" disabled={decide.isPending || !note.trim()} onClick={() => decide.mutate({ id: selected.id, decision: "rejected", note })}><X className="h-4 w-4" />Reject</Button>
        </div>
      </div>}
      {decide.error && <p role="alert" className="text-sm text-destructive">{(decide.error as Error).message}</p>}
      {notice && <p role="status" className="rounded-xl bg-[#f3eefe] p-3 text-sm">{notice}</p>}
    </article> : <p className="rounded-3xl bg-white p-5 text-sm text-muted-foreground shadow-sm">Select a request.</p>}
  </section>;
}

export function LiveReferralManagement() {
  const fetchRefs = useServerFn(listAdminReferrals);
  const update = useServerFn(updateAdminReferral);
  const qc = useQueryClient();
  const [query, setQuery] = useState("");
  const [msg, setMsg] = useState("");
  const { data, isPending, error } = useQuery({ queryKey: ["admin-referrals"], queryFn: () => fetchRefs() });
  const act = useMutation({
    mutationFn: (v: { id: string; status: "approved" | "rejected" | "paid"; note?: string }) => update({ data: v }),
    onSuccess: () => { setMsg(""); qc.invalidateQueries({ queryKey: ["admin-referrals"] }); },
    onError: (e: Error) => setMsg(e.message),
  });
  const q = query.trim().toLowerCase();
  const refs = (data?.referrals ?? []).filter(r => `${r.referral_code} ${r.referrer.name} ${r.referrer.email} ${r.referred.name} ${r.referred.email}`.toLowerCase().includes(q));
  const all = data?.referrals ?? [];
  const sum = (s: string) => all.filter(r => r.status === s).reduce((t, r) => t + r.reward_usd, 0);
  const stats = [["Total referrals", String(all.length)], ["Pending", String(all.filter(r => r.status === "pending").length)], ["Approved rewards", `$${sum("approved").toFixed(2)}`], ["Paid rewards", `$${sum("paid").toFixed(2)}`]];

  return <div className="space-y-4">
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{stats.map(([k, v]) => <div key={k} className="rounded-2xl bg-white p-4 shadow-sm"><p className="text-xs text-muted-foreground">{k}</p><p className="mt-1 text-xl font-extrabold">{v}</p></div>)}</div>
    <section className="space-y-4 rounded-3xl bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-bold">Referrals</h2><div className="relative w-full max-w-xs"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Search code, name or email" value={query} onChange={e => setQuery(e.target.value)} /></div></div>
      {msg && <p role="alert" className="text-sm text-destructive">{msg}</p>}
      {isPending ? <p className="text-sm text-muted-foreground">Loading…</p> : error ? <p className="text-sm text-destructive">{(error as Error).message}</p> : refs.length === 0 ? <p className="text-sm text-muted-foreground">No referrals yet. They appear when someone signs up with a member's code.</p> :
      <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="text-left text-xs text-muted-foreground"><tr><th className="py-2">Referrer</th><th>Referred user</th><th>Code</th><th>Reward</th><th>Status</th><th>Date</th><th className="text-right">Actions</th></tr></thead>
        <tbody className="divide-y">{refs.map(r => <tr key={r.id}>
          <td className="py-3"><p className="font-semibold">{r.referrer.name ?? "—"}</p><p className="text-xs text-muted-foreground">{r.referrer.email}</p></td>
          <td><p className="font-semibold">{r.referred.name ?? "—"}</p><p className="text-xs text-muted-foreground">{r.referred.email}</p></td>
          <td className="font-mono">{r.referral_code}</td><td>${r.reward_usd.toFixed(2)}</td><td><Pill value={r.status} /></td><td>{date(r.created_at)}</td>
          <td className="text-right"><div className="flex justify-end gap-2">
            {r.status === "pending" && <><Button size="sm" disabled={act.isPending} onClick={() => act.mutate({ id: r.id, status: "approved" })}><Check />Approve</Button><Button size="sm" variant="outline" disabled={act.isPending} onClick={() => { const note = window.prompt("Reason for rejection (optional)") ?? undefined; act.mutate({ id: r.id, status: "rejected", note }); }}><X />Reject</Button></>}
            {r.status === "approved" && <Button size="sm" disabled={act.isPending} onClick={() => { if (window.confirm(`Credit $${r.reward_usd.toFixed(2)} to ${r.referrer.name ?? "this member"}'s wallet?`)) act.mutate({ id: r.id, status: "paid" }); }}>Pay reward</Button>}
          </div></td></tr>)}</tbody></table></div>}
    </section>
    <section className="space-y-3 rounded-3xl bg-white p-5 shadow-sm"><h2 className="font-bold">Member referral codes</h2>
      <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="text-left text-xs text-muted-foreground"><tr><th className="py-2">Member</th><th>Code</th><th>Referrals</th></tr></thead>
        <tbody className="divide-y">{(data?.codes ?? []).map(c => <tr key={c.id}><td className="py-3"><p className="font-semibold">{c.name ?? "—"}</p><p className="text-xs text-muted-foreground">{c.email}</p></td><td className="font-mono">{c.code ?? "—"}</td><td>{c.count}</td></tr>)}</tbody></table></div>
    </section>
  </div>;
}
