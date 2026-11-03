import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listAdminReferrals, listAdminUsers, listAdminVerifications, reviewVerification, setAdminUserStatus, updateAdminReferral, type AdminVerificationRow } from "@/lib/admin.functions";

const pill: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700", approved: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700", suspended: "bg-red-100 text-red-700", rejected: "bg-red-100 text-red-700",
  none: "bg-muted text-muted-foreground",
};
const Pill = ({ value }: { value: string }) => <span className={`rounded-full px-2 py-0.5 text-xs font-bold capitalize ${pill[value] ?? "bg-muted"}`}>{value === "none" ? "Not submitted" : value}</span>;
const date = (v: string) => new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export function LiveUsersManagement() {
  const fetchUsers = useServerFn(listAdminUsers);
  const setStatus = useServerFn(setAdminUserStatus);
  const qc = useQueryClient();
  const [query, setQuery] = useState("");
  const { data = [], isPending, error } = useQuery({ queryKey: ["admin-users"], queryFn: () => fetchUsers() });
  const toggle = useMutation({
    mutationFn: (v: { userId: string; status: "active" | "suspended" }) => setStatus({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
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
        <td className="p-2 text-right"><Button size="sm" variant="outline" disabled={toggle.isPending}
          onClick={() => toggle.mutate({ userId: u.id, status: u.account_status === "suspended" ? "active" : "suspended" })}>
          {u.account_status === "suspended" ? "Reactivate" : "Suspend"}</Button></td>
      </tr>)}</tbody>
    </table></div>
    {isPending && <p className="text-sm text-muted-foreground">Loading members…</p>}
    {!isPending && rows.length === 0 && <p className="text-sm text-muted-foreground">No members found.</p>}
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
