import { useState } from "react";
import { BadgeCheck, Calendar, Clock, Download, Eye, EyeOff, FileText, Mail, MapPin, Phone, Search, Send, Shield, StickyNote, User, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { VERIFICATION_SUBMISSIONS, VERIFICATION_TOTAL, adminCount, type VerificationStatus, type VerificationSubmission } from "@/lib/admin-demo";

const AVATAR: Record<string, string> = {
  MS: "bg-violet-100 text-violet-700",
  AB: "bg-pink-100 text-pink-700",
  JC: "bg-sky-100 text-sky-700",
  FM: "bg-amber-100 text-amber-700",
  DW: "bg-indigo-100 text-indigo-700",
  CO: "bg-emerald-100 text-emerald-700",
  SJ: "bg-rose-100 text-rose-700",
};

const DAYS = ["Nov 1, 2026 – Nov 8, 2026", "Nov 8, 2026", "Nov 7, 2026", "Nov 6, 2026"];

export function VerificationManagement() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All Statuses");
  const [day, setDay] = useState(DAYS[0]);
  const [selectedId, setSelectedId] = useState("ver-1");
  const [tab, setTab] = useState<"overview" | "documents" | "history" | "transactions">("overview");
  const [overrides, setOverrides] = useState<Record<string, VerificationStatus>>({});
  const [notes, setNotes] = useState<Record<string, string[]>>({});
  const [note, setNote] = useState("");
  const [showLast4, setShowLast4] = useState(true);
  const [activity, setActivity] = useState(false);
  const [reverify, setReverify] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [doc, setDoc] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  const rows = VERIFICATION_SUBMISSIONS.map(item => overrides[item.id] ? { ...item, status: overrides[item.id] } : item);
  const needle = query.trim().toLowerCase();
  const visible = rows.filter(item => {
    const text = `${item.name} ${item.email} ${item.phone} ${item.idNumber} ${item.country}`.toLowerCase();
    const statusOk = status === "All Statuses" || item.status === status;
    const dayOk = day === DAYS[0] || item.day === day;
    return statusOk && dayOk && text.includes(needle);
  });
  const selected = rows.find(item => item.id === selectedId) ?? rows[0];
  const userNotes = notes[selected.id] ?? [];

  function choose(item: VerificationSubmission) {
    setSelectedId(item.id);
    setTab("overview");
    setShowLast4(true);
    setNote("");
  }

  function exportList() {
    const body = ["Name,Email,Phone,Country,Status,Submitted,ID type,Sample ID,SSN last four", ...visible.map(item => [item.name, item.email, item.phone, item.country, item.status, item.submitted, item.idType, item.idNumber, item.ssnLast4 ?? ""].join(","))].join("\n");
    download("basecola-verifications-sample.csv", body);
    setNotice("Downloaded a sample verification list. It is not a live export, and no document or full Social Security number was included.");
  }

  function downloadDocs() {
    const body = ["Document,Status", "Government ID front,Sample placeholder", "Government ID back,Sample placeholder", "Selfie,Sample placeholder"].join("\n");
    download("basecola-verification-documents-sample.csv", body);
    setNotice("Downloaded a sample document list. No identity document or photo was stored or sent.");
  }

  function addNote() {
    const text = note.trim();
    if (!text) return;
    setNotes(current => ({ ...current, [selected.id]: [...(current[selected.id] ?? []), text] }));
    setNote("");
    setNotice("Note saved in this preview. The customer was not notified.");
  }

  function reject() {
    setOverrides(current => ({ ...current, [selected.id]: "Rejected" }));
    setRejecting(false);
    setNotice("Marked rejected in this preview. The customer account is unchanged and no message was sent.");
  }

  return <section className="space-y-4">
    <div className="flex flex-wrap items-center gap-2">
      <label className="relative min-w-64 flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input aria-label="Search verifications" placeholder="Search users, email, phone, ID..." value={query} onChange={event => setQuery(event.target.value)} className="h-11 bg-white pl-9" /></label>
      <label className="flex h-11 items-center gap-2 rounded-xl border bg-white px-3 text-sm"><span className="sr-only">Status</span><select aria-label="Status" value={status} onChange={event => setStatus(event.target.value)} className="bg-transparent outline-none">{["All Statuses", "Verified", "Pending", "Under Review", "Rejected"].map(option => <option key={option}>{option}</option>)}</select></label>
      <label className="flex h-11 items-center gap-2 rounded-xl border bg-white px-3 text-sm"><Calendar className="h-4 w-4 text-muted-foreground" /><span className="sr-only">Submitted dates</span><select aria-label="Submitted dates" value={day} onChange={event => setDay(event.target.value)} className="bg-transparent outline-none">{DAYS.map(option => <option key={option}>{option}</option>)}</select></label>
      <Button type="button" className="h-11 rounded-xl bg-[#6d4dff] hover:bg-[#6d4dff]/90" onClick={exportList}><Download className="h-4 w-4" />Export</Button>
    </div>
    <div className="verify-board grid items-start gap-4">
      <aside className="rounded-3xl bg-white p-4 shadow-sm">
        <h2 className="font-bold">All Users ({adminCount(VERIFICATION_TOTAL)})</h2>
        <label className="relative mt-3 block"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input aria-label="Search verification users" placeholder="Search by name, email, phone..." value={query} onChange={event => setQuery(event.target.value)} className="h-10 bg-[#f7f8fc] pl-9" /></label>
        <ul className="mt-3 max-h-[760px] space-y-1 overflow-y-auto">
          {visible.map(item => {
            const active = item.id === selected.id;
            return <li key={item.id} className={`flex items-start gap-1 rounded-2xl pr-1 ${active ? "bg-[#f3eefe]" : ""}`}>
              <button type="button" className="flex min-w-0 flex-1 items-start gap-3 rounded-2xl px-2 py-2 text-left" onClick={() => choose(item)}>
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-xs font-bold ${AVATAR[item.initials] ?? "bg-accent"}`}>{item.initials}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2"><span className="text-sm font-semibold leading-tight">{item.name}</span><StatusDot status={item.status} /></span>
                  <span className="block truncate text-xs text-muted-foreground">{item.email}</span>
                  <span className="mt-1 flex items-center gap-2 text-xs text-muted-foreground"><CountryLabel country={item.country} /> <StatusPill status={item.status} /></span>
                  <span className="mt-1 block text-[11px] text-muted-foreground">{item.submitted}</span>
                </span>
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild><button type="button" aria-label={`More actions for ${item.name}`} className="mt-2 px-1 text-lg leading-none text-muted-foreground">···</button></DropdownMenuTrigger>
                <DropdownMenuContent align="end"><DropdownMenuItem onClick={() => { choose(item); setActivity(true); }}>View activity</DropdownMenuItem></DropdownMenuContent>
              </DropdownMenu>
            </li>;
          })}
          {visible.length === 0 && <li className="px-2 py-6 text-sm text-muted-foreground">No sample submissions match these filters.</li>}
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">Showing {visible.length} sample submissions of {adminCount(VERIFICATION_TOTAL)}.</p>
      </aside>
      <div className="space-y-4">
        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start gap-3">
            <span className={`grid h-16 w-16 place-items-center rounded-full ${AVATAR[selected.initials] ?? "bg-accent"}`}><User className="h-7 w-7" /></span>
            <div className="min-w-0 flex-1">
              <h2 className="flex flex-wrap items-center gap-2 text-xl font-extrabold">{selected.name} <StatusPill status={selected.status} /></h2>
              <p className="text-sm text-muted-foreground">{selected.email}</p>
              <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground"><span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{selected.phone}</span><CountryLabel country={selected.country} /><span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />Joined: {selected.joined}</span></p>
            </div>
            <Button type="button" variant="outline" className="h-10 rounded-xl" onClick={() => setActivity(true)}>View Activity</Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild><button type="button" aria-label={`More actions for ${selected.name}`} className="grid h-10 w-10 place-items-center rounded-xl border text-lg leading-none">···</button></DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setActivity(true)}>View activity</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTab("documents")}>View documents</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="mt-4 flex gap-4 border-b text-sm font-semibold">
            {([["overview", "Overview"], ["documents", "Documents"], ["history", "Verification History"], ["transactions", "Transactions"]] as const).map(([id, label]) => <button key={id} type="button" aria-pressed={tab === id} className={`border-b-2 pb-2 ${tab === id ? "border-[#6d4dff] text-[#6d4dff]" : "border-transparent text-muted-foreground"}`} onClick={() => setTab(id)}>{label}</button>)}
          </div>
        </section>
        {tab === "overview" && <>
          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-3xl bg-white p-5 shadow-sm">
              <h3 className="mb-3 flex items-center gap-2 font-bold"><User className="h-4 w-4 text-[#6d4dff]" />Personal Information</h3>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <Fact label="Full Name" value={selected.name} />
                <Fact label="Email Address" value={selected.email} />
                <Fact label="Phone Number" value={selected.phone} />
                <Fact label="Country" value={selected.country} />
                <Fact label="Date of Birth" value={selected.dob} />
                <Fact label="Address" value={selected.address} />
              </dl>
            </section>
            <section className="rounded-3xl bg-white p-5 shadow-sm">
              <h3 className="mb-3 flex items-center gap-2 font-bold"><Shield className="h-4 w-4 text-[#6d4dff]" />Identity Information</h3>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                {selected.ssnLast4 && <div><dt className="text-xs text-muted-foreground">SSN (US Users)</dt><dd className="mt-1 flex items-center gap-2 font-semibold"><span>{showLast4 ? `***-**-${selected.ssnLast4}` : "***-**-****"}</span><button type="button" aria-label={showLast4 ? "Hide last four digits" : "Show last four digits"} className="text-muted-foreground" onClick={() => setShowLast4(value => !value)}>{showLast4 ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</button></dd></div>}
                <Fact label="ID Type" value={selected.idType} />
                <Fact label="ID Number" value={selected.idNumber} />
                <Fact label="State Issued" value={selected.stateIssued} />
                <Fact label="Expiry Date" value={selected.expiry} />
              </dl>
              <p className="mt-3 text-xs text-muted-foreground">Sample identity details. A full Social Security number is not stored, and no document was uploaded.</p>
            </section>
          </div>
          <section className="rounded-3xl bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between"><h3 className="flex items-center gap-2 font-bold"><FileText className="h-4 w-4 text-[#6d4dff]" />Verification Documents & Selfie</h3><button type="button" className="text-sm font-semibold text-[#6d4dff]" onClick={() => setTab("documents")}>View All</button></div>
            <div className="grid gap-3 sm:grid-cols-3"><DocCard title="Government ID (Front)" kind="front" state={docLabel(selected, "id")} onOpen={() => setDoc("Government ID (Front)")} /><DocCard title="Government ID (Back)" kind="back" state={docLabel(selected, "id")} onOpen={() => setDoc("Government ID (Back)")} /><DocCard title="Selfie with ID" kind="selfie" state={docLabel(selected, "selfie")} onOpen={() => setDoc("Selfie with ID")} /></div>
            <p className={`mt-4 flex items-start gap-2 rounded-2xl px-3 py-3 text-sm ${selected.status === "Verified" ? "bg-emerald-50 text-emerald-800" : selected.status === "Rejected" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800"}`}><Shield className="mt-0.5 h-4 w-4 shrink-0" />{banner(selected.status)}</p>
          </section>
        </>}
        {tab === "documents" && <section className="rounded-3xl bg-white p-5 shadow-sm">
          <h3 className="mb-1 font-bold">Documents</h3>
          <p className="mb-4 text-sm text-muted-foreground">Placeholders for this preview. No identity document or photo is stored.</p>
          <div className="grid gap-3 sm:grid-cols-3"><DocCard title="Government ID (Front)" kind="front" state={docLabel(selected, "id")} onOpen={() => setDoc("Government ID (Front)")} /><DocCard title="Government ID (Back)" kind="back" state={docLabel(selected, "id")} onOpen={() => setDoc("Government ID (Back)")} /><DocCard title="Selfie with ID" kind="selfie" state={docLabel(selected, "selfie")} onOpen={() => setDoc("Selfie with ID")} /></div>
        </section>}
        {tab === "history" && <section className="rounded-3xl bg-white p-5 shadow-sm">
          <h3 className="mb-4 font-bold">Verification History</h3>
          <ol className="space-y-4">{selected.history.map(item => <li key={`${item.title}-${item.date}`} className="flex gap-3 text-sm"><span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#6d4dff]" /><span><span className="block font-semibold">{item.title}</span><span className="text-muted-foreground">{item.detail}</span><span className="mt-1 block text-xs text-muted-foreground">{item.date}</span></span></li>)}</ol>
        </section>}
        {tab === "transactions" && <section className="overflow-x-auto rounded-3xl bg-white p-5 shadow-sm">
          <h3 className="mb-4 font-bold">Transactions</h3>
          <table className="w-full min-w-[640px] text-left text-sm"><thead className="text-xs text-muted-foreground"><tr>{["Transaction ID", "Type", "Asset", "Amount", "Status", "Date"].map(heading => <th key={heading} className="px-2 py-2 font-medium">{heading}</th>)}</tr></thead><tbody>{selected.transactions.map(item => <tr key={item.id} className="border-t"><td className="px-2 py-3 font-medium">{item.id}</td><td className="px-2 py-3">{item.type}</td><td className="px-2 py-3">{item.asset}</td><td className="px-2 py-3">{item.amount}</td><td className="px-2 py-3"><StatusPill status={item.status} /></td><td className="px-2 py-3 text-muted-foreground">{item.date}</td></tr>)}</tbody></table>
          <p className="mt-3 text-xs text-muted-foreground">Sample activity for this profile. Customer balances are unchanged.</p>
        </section>}
      </div>
      <div className="space-y-4">
        <section className={`rounded-3xl p-5 shadow-sm ${selected.status === "Verified" ? "bg-emerald-50" : selected.status === "Rejected" ? "bg-red-50" : "bg-amber-50"}`}>
          <h3 className="flex items-center gap-2 font-bold">{selected.status === "Verified" ? <BadgeCheck className="h-5 w-5 text-emerald-600" /> : selected.status === "Rejected" ? <XCircle className="h-5 w-5 text-red-600" /> : <Clock className="h-5 w-5 text-amber-600" />}Verification Status</h3>
          <p className="mt-2 text-lg font-extrabold">{selected.status}</p>
          <p className="text-sm text-muted-foreground">{statusCopy(selected.status)}</p>
          <ul className="mt-3 space-y-2">{selected.checks.map(item => <li key={item.label} className="flex items-start justify-between gap-3 text-sm"><span className="font-semibold">{item.label}</span><span className="text-right text-muted-foreground">{item.state} · {item.date}</span></li>)}</ul>
        </section>
        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <h3 className="mb-3 font-bold">Quick Actions</h3>
          <div className="space-y-2">
            <Button type="button" className="h-11 w-full rounded-xl bg-[#6d4dff] hover:bg-[#6d4dff]/90" onClick={downloadDocs}><Download className="h-4 w-4" />Download Documents</Button>
            <Button type="button" variant="outline" className="h-11 w-full rounded-xl" onClick={() => setReverify(true)}><Send className="h-4 w-4" />Send Reverification Link</Button>
            <Button type="button" variant="outline" className="h-11 w-full rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-600" disabled={selected.status === "Rejected"} onClick={() => setRejecting(true)}><XCircle className="h-4 w-4" />Reject Verification</Button>
          </div>
        </section>
        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <h3 className="mb-2 flex items-center gap-2 font-bold"><StickyNote className="h-4 w-4 text-[#6d4dff]" />Notes</h3>
          {userNotes.length === 0 ? <p className="text-sm text-muted-foreground">No additional notes.</p> : <ul className="space-y-2 text-sm">{userNotes.map(item => <li key={item} className="rounded-xl bg-[#f7f8fc] px-3 py-2">{item}</li>)}</ul>}
          <label className="mt-3 block text-sm font-medium">Add Note<Input value={note} onChange={event => setNote(event.target.value)} placeholder="Add a preview note" className="mt-1 h-11 bg-white" aria-label="Add Note" /></label>
          <Button type="button" variant="outline" className="mt-2 h-10 w-full rounded-xl" onClick={addNote}>Add Note</Button>
        </section>
      </div>
    </div>
    {notice && <p role="status" className="text-sm text-muted-foreground">{notice}</p>}
    <p className="text-xs leading-relaxed text-muted-foreground">Sample verification queue. Downloads, notes, and status changes stay in this browser. No document, photo, or Social Security number is saved, and no email is sent.</p>
    <Dialog open={activity} onOpenChange={setActivity}><DialogContent className="max-w-md rounded-3xl"><DialogHeader><DialogTitle>Activity · {selected.name}</DialogTitle><DialogDescription>Sample history for this preview.</DialogDescription></DialogHeader><ol className="space-y-3 text-sm">{selected.history.map(item => <li key={`${item.title}-${item.date}`}><span className="font-semibold">{item.title}</span><span className="mt-0.5 block text-muted-foreground">{item.detail}</span><span className="text-xs text-muted-foreground">{item.date}</span></li>)}</ol></DialogContent></Dialog>
    <Dialog open={reverify} onOpenChange={setReverify}><DialogContent className="max-w-md rounded-3xl"><DialogHeader><DialogTitle>Send Reverification Link</DialogTitle><DialogDescription>This preview does not send the link.</DialogDescription></DialogHeader><p className="flex items-center gap-2 text-sm"><Mail className="h-4 w-4 text-[#6d4dff]" />{selected.email}</p><Button type="button" className="h-11 w-full rounded-xl bg-[#6d4dff] hover:bg-[#6d4dff]/90" onClick={() => { setReverify(false); setNotice(`Reverification note saved for ${selected.email}. No email was sent.`); }}>Save preview link</Button></DialogContent></Dialog>
    <Dialog open={rejecting} onOpenChange={setRejecting}><DialogContent className="max-w-md rounded-3xl"><DialogHeader><DialogTitle>Reject verification</DialogTitle><DialogDescription>This marks {selected.name} rejected in the preview only.</DialogDescription></DialogHeader><p className="flex items-start gap-2 text-sm text-muted-foreground"><MapPin className="mt-0.5 h-4 w-4 shrink-0" />The customer account stays unchanged and no message is sent.</p><Button type="button" variant="outline" className="h-11 w-full rounded-xl border-red-200 text-red-600" onClick={reject}>Reject in preview</Button></DialogContent></Dialog>
    <Dialog open={!!doc} onOpenChange={open => { if (!open) setDoc(null); }}><DialogContent className="max-w-md rounded-3xl"><DialogHeader><DialogTitle>{doc}</DialogTitle><DialogDescription>Sample placeholder. This preview does not store an identity document or a photo.</DialogDescription></DialogHeader><DocArt kind={doc === "Government ID (Back)" ? "back" : doc === "Selfie with ID" ? "selfie" : "front"} /></DialogContent></Dialog>
  </section>;
}

function CountryLabel({ country }: { country: string }) {
  const code = country === "United States" ? "US" : country === "Nigeria" ? "NG" : "CA";
  return <span className="inline-flex items-center gap-1"><span className="rounded bg-[#eef0fb] px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-[#1b1240]">{code}</span>{country}</span>;
}

function Fact({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 font-semibold">{value}</dd></div>;
}

function StatusPill({ status }: { status: string }) {
  const tone = status === "Verified" || status === "Completed" || status === "Approved" ? "bg-emerald-100 text-emerald-700" : status === "Pending" ? "bg-amber-100 text-amber-700" : status === "Under Review" || status === "In review" ? "bg-orange-100 text-orange-700" : "bg-red-100 text-red-600";
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${tone}`}>{status}</span>;
}

function StatusDot({ status }: { status: string }) {
  const tone = status === "Verified" ? "bg-emerald-500" : status === "Pending" ? "bg-amber-500" : status === "Under Review" ? "bg-orange-500" : "bg-red-500";
  return <span className={`h-2 w-2 rounded-full ${tone}`} aria-hidden />;
}

function docLabel(user: VerificationSubmission, kind: "id" | "selfie") {
  const label = kind === "selfie" ? "Selfie Verification" : "Identity Document";
  const state = user.checks.find(item => item.label === label)?.state;
  if (state === "Approved") return "Verified";
  if (state === "In review") return "Under Review";
  return "Pending";
}

function banner(status: VerificationStatus) {
  if (status === "Verified") return "This user's identity has been verified and approved in this preview. The documents shown are placeholders and match the sample details.";
  if (status === "Under Review") return "This sample is marked under review. No reviewer was assigned and no message was sent.";
  if (status === "Rejected") return "Marked rejected in this preview. The customer account is unchanged and no message was sent.";
  return "This submission is waiting in the preview. No document was uploaded and no reviewer was notified.";
}

function statusCopy(status: VerificationStatus) {
  if (status === "Verified") return "User has completed all required verification steps in this preview.";
  if (status === "Under Review") return "Sample checks are still open. No reviewer was assigned.";
  if (status === "Rejected") return "Rejected in this preview only.";
  return "Waiting for a preview review. Nothing has been approved.";
}

function DocCard({ title, kind, state, onOpen }: { title: string; kind: "front" | "back" | "selfie"; state: string; onOpen: () => void }) {
  return <article className="overflow-hidden rounded-2xl border">
    <div className="relative h-36 bg-[#f4f5fb] p-3"><DocArt kind={kind} /><span className="absolute left-2 top-2"><StatusPill status={state} /></span><button type="button" aria-label={`Open ${title}`} className="absolute bottom-2 right-2 grid h-8 w-8 place-items-center rounded-full bg-white shadow" onClick={onOpen}><Search className="h-4 w-4" /></button></div>
    <p className="px-2 py-2 text-center text-xs font-semibold">{title}</p>
  </article>;
}

function DocArt({ kind }: { kind: "front" | "back" | "selfie" }) {
  if (kind === "back") return <div className="flex h-full flex-col justify-end rounded-xl bg-white p-3"><div className="h-8 bg-[repeating-linear-gradient(90deg,#111_0_2px,transparent_2px_5px)]" /><p className="mt-2 text-[10px] font-semibold text-muted-foreground">SAMPLE BACK</p></div>;
  if (kind === "selfie") return <div className="grid h-full place-items-center rounded-xl bg-white"><User className="h-10 w-10 text-slate-300" /><span className="sr-only">Sample selfie placeholder</span></div>;
  return <div className="flex h-full items-center gap-3 rounded-xl bg-white p-3"><span className="grid h-12 w-12 place-items-center rounded-lg bg-slate-100"><User className="h-6 w-6 text-slate-400" /></span><span><span className="block text-[10px] font-bold tracking-wide text-sky-700">SAMPLE ID</span><span className="block text-[10px] text-muted-foreground">Front placeholder</span></span></div>;
}

function download(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
