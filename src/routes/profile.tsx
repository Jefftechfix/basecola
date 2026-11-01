import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { User, Bell, ShieldCheck, Globe, Pencil, Check, Mail } from "lucide-react";
import { AccountShell } from "@/components/account-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [
    { title: "Your Profile — Basecola" }, { name: "description", content: "View your Basecola profile and account preferences." },
    { property: "og:title", content: "Your Profile — Basecola" }, { property: "og:description", content: "Your Basecola account profile and preferences." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: ProfilePage,
});

function ProfilePage() {
  const [profile, setProfile] = useState({ name: "Mustapha", email: "", country: "Nigeria" });
  const [draft, setDraft] = useState(profile);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activity, setActivity] = useState(true);
  const [market, setMarket] = useState(false);
  const [currency, setCurrency] = useState("USD");
  return <AccountShell active="/profile" title="My Profile">
    <section className="flex flex-wrap items-center gap-4 border-b pb-7">
      <div className="grid h-20 w-20 place-items-center rounded-full bg-accent text-3xl font-bold text-primary">{profile.name.trim().slice(0, 2).toUpperCase()}</div>
      <div className="min-w-0 flex-1"><h2 className="break-words text-2xl font-bold">{profile.name}</h2><p className="mt-1 break-all text-sm text-muted-foreground">{profile.email || "Email not added"}</p><span className="mt-2 inline-block text-xs text-muted-foreground">Personal account</span></div>
      <Button variant="outline" onClick={() => { setDraft(profile); setEditing(true); }}><Pencil />Edit</Button>
    </section>
    {saved && <p role="status" className="mt-4 flex items-center gap-2 text-sm text-success"><Check className="h-4 w-4" />Profile updated for this preview session.</p>}
    <section className="mt-7"><h2 className="mb-2 text-lg font-bold">Account details</h2><dl className="divide-y">
      {[[User, "Full name", profile.name], [Mail, "Email", profile.email || "Not added"], [Globe, "Country", profile.country]].map(([Icon, label, value]) => {
        const I = Icon as typeof User;
        return <div key={String(label)} className="flex items-start gap-3 py-4"><I className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><dt className="flex-1 text-sm text-muted-foreground">{String(label)}</dt><dd className="max-w-[55%] break-words text-right text-sm font-medium">{String(value)}</dd></div>;
      })}
    </dl></section>
    <section className="mt-7"><h2 className="mb-2 text-lg font-bold">Preferences</h2><div className="divide-y">
      <div className="flex items-center gap-3 py-4"><Bell className="h-5 w-5 text-primary" /><label htmlFor="activity" className="flex-1 text-sm font-medium">Transaction notifications</label><Switch id="activity" checked={activity} onCheckedChange={setActivity} /></div>
      <div className="flex items-center gap-3 py-4"><Bell className="h-5 w-5 text-primary" /><label htmlFor="market" className="flex-1 text-sm font-medium">Market updates</label><Switch id="market" checked={market} onCheckedChange={setMarket} /></div>
      <div className="flex items-center gap-3 py-4"><Globe className="h-5 w-5 text-primary" /><label htmlFor="currency" className="flex-1 text-sm font-medium">Preferred currency</label><select id="currency" className="rounded-md border bg-card px-3 py-2 text-sm" value={currency} onChange={e => setCurrency(e.target.value)}><option value="USD">USD ($)</option><option value="NGN">NGN (₦)</option></select></div>
    </div></section>
    <section className="mt-6 flex items-start gap-3 border-t py-5"><ShieldCheck className="h-6 w-6 shrink-0 text-primary" /><div><h2 className="font-semibold">Account verification</h2><p className="mt-1 text-sm text-muted-foreground">Not available in demo mode</p></div></section>
    <Dialog open={editing} onOpenChange={setEditing}><DialogContent className="w-[calc(100%-2rem)] rounded-lg"><DialogTitle>Edit profile</DialogTitle><DialogDescription>Changes apply to this preview session only.</DialogDescription>
      <form className="space-y-4" onSubmit={e => { e.preventDefault(); setProfile(draft); setSaved(true); setEditing(false); }}>
        <label className="block space-y-2 text-sm font-medium"><span>Full name</span><Input required maxLength={60} value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} /></label>
        <label className="block space-y-2 text-sm font-medium"><span>Email address</span><Input type="email" value={draft.email} onChange={e => setDraft({ ...draft, email: e.target.value })} /></label>
        <label className="block space-y-2 text-sm font-medium"><span>Country</span><select className="h-10 w-full rounded-md border bg-background px-3" value={draft.country} onChange={e => setDraft({ ...draft, country: e.target.value })}>{["Nigeria", "United States", "United Kingdom", "Ghana", "Kenya", "Canada"].map(country => <option key={country}>{country}</option>)}</select></label>
        <Button type="submit" className="w-full" disabled={!draft.name.trim()}><Check />Save changes</Button>
      </form>
    </DialogContent></Dialog>
  </AccountShell>;
}