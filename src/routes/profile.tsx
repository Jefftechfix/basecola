import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useSyncExternalStore, type FormEvent } from "react";
import { ArrowLeft, BadgeCheck, Bell, Check, ChevronRight, CircleHelp, FileText, Info, Lock, LogOut, Mail, ScrollText, ShieldCheck, Trash2, User, Users } from "lucide-react";
import { Logo } from "@/components/brand";
import { AccountNav } from "@/components/account-shell";
import { NotificationBell } from "@/components/notification-bell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { getAccountVerification, subscribeAccountVerification } from "@/lib/account-verify";
import { COUNTRY_DIALS, countryByIso, countryByName, countryOptionLabel, splitPhone } from "@/lib/countries";
import { REFERRAL_CODE } from "@/lib/referral-demo";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [
    { title: "Profile — Basecola" }, { name: "description", content: "Manage your Basecola demo profile, preferences, and account settings." },
    { property: "og:title", content: "Profile — Basecola" }, { property: "og:description", content: "Your Basecola demo account settings." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: ProfilePage,
});

type Section = "account" | "notifications" | "terms" | "privacy" | "about";
type AccountProfile = { name: string; email: string; phone: string; country: string; address: string };

const SAMPLE_PROFILE: AccountProfile = { name: "Mustapha Suleiman", email: "mustapha@gmail.com", phone: "+1 (971) 555-2389", country: "United States", address: "1200 Demo Street, Portland, OR 97201" };

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "BC";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function ProfilePage() {
  const [section, setSection] = useState<Section | null>(null);
  const [profile, setProfile] = useState(SAMPLE_PROFILE);
  const [draft, setDraft] = useState(profile);
  const [saved, setSaved] = useState("");
  const [activity, setActivity] = useState(true);
  const [market, setMarket] = useState(false);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const { status } = useSyncExternalStore(subscribeAccountVerification, getAccountVerification, getAccountVerification);
  const pending = status === "pending";

  function openAccount() {
    setDraft(profile);
    setSaved("");
    setSection("account");
  }

  return <div className="min-h-screen bg-background pb-28">
    <header className="relative overflow-hidden bg-gradient-primary px-5 pb-16 pt-5 text-primary-foreground">
      <div className="pointer-events-none absolute -right-20 -top-16 h-56 w-56 rounded-full bg-primary-foreground/10" />
      <div className="pointer-events-none absolute -bottom-20 left-8 h-40 w-72 rounded-[50%] bg-primary-foreground/10" />
      <div className="relative mx-auto max-w-3xl">
        <div className="flex items-center justify-between"><Logo tone="light" /><NotificationBell tone="light" /></div>
        <h1 className="mt-6 text-3xl font-extrabold">Profile</h1>
        <p className="mt-1 text-sm text-primary-foreground/80">Manage your account and settings</p>
      </div>
    </header>

    <div className="relative z-10 mx-auto -mt-10 max-w-3xl space-y-3 px-5">
      <section className="flex items-center gap-3 rounded-3xl bg-card p-4 shadow-soft">
        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-accent text-xl font-bold text-primary">{initials(profile.name)}</span>
        <button type="button" onClick={openAccount} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <span className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1">
            <span className="text-base font-bold leading-tight">{profile.name}</span>
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${pending ? "bg-warning-soft text-warning" : "bg-muted text-muted-foreground"}`}>{pending ? "Pending" : "Unverified"}</span>
            <span className="col-start-1 flex items-center gap-1.5 text-xs text-muted-foreground"><Mail className="h-3.5 w-3.5 shrink-0" /><span className="break-all">{profile.email}</span></span>
          </span>
          <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
        </button>
      </section>

      {section ? <ProfileSection section={section} onBack={() => setSection(null)} profile={profile} draft={draft} setDraft={setDraft} onSave={next => { setProfile(next); setDraft(next); setSaved("Profile updated for this preview."); }} saved={saved} activity={activity} setActivity={setActivity} market={market} setMarket={setMarket} emailAlerts={emailAlerts} setEmailAlerts={setEmailAlerts} /> : <>
        <MenuButton icon={User} tint="bg-accent text-primary" title="Account Information" detail="Update your personal details" onClick={openAccount} />
        <Link to="/verify-account" className="flex w-full items-center gap-3 rounded-2xl bg-card px-3 py-3 text-left shadow-soft">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent text-primary"><BadgeCheck className="h-5 w-5" /></span>
          <span className="min-w-0 flex-1"><span className="block font-bold">Verify account</span><span className="block text-xs text-muted-foreground">{pending ? "Submitted for this preview" : "Confirm your details, ID, and selfie"}</span></span>
          <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
        </Link>
        <Link to="/security" className="flex w-full items-center gap-3 rounded-2xl bg-card px-3 py-3 text-left shadow-soft">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent text-primary"><ShieldCheck className="h-5 w-5" /></span>
          <span className="min-w-0 flex-1"><span className="block font-bold">Security</span><span className="block text-xs text-muted-foreground">Change PIN, password, and two-factor authentication</span></span>
          <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
        </Link>
        <Link to="/referral" className="flex w-full items-center gap-3 rounded-2xl bg-card px-3 py-3 text-left shadow-soft">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-green-soft text-success"><Users className="h-5 w-5" /></span>
          <span className="min-w-0 flex-1"><span className="block font-bold">Referral Program</span><span className="block text-xs text-muted-foreground">Earn $10 for each person you refer</span></span>
          <span className="text-xs font-semibold text-primary">Ref: {REFERRAL_CODE}</span>
          <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
        </Link>
        <Link to="/statements" className="flex w-full items-center gap-3 rounded-2xl bg-card px-3 py-3 text-left shadow-soft">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent text-primary"><FileText className="h-5 w-5" /></span>
          <span className="min-w-0 flex-1"><span className="block font-bold">Statements</span><span className="block text-xs text-muted-foreground">Download your statement of account</span></span>
          <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
        </Link>
        <MenuButton icon={Bell} tint="bg-pink-soft text-pink" title="Notifications" detail="Manage your notification preferences" onClick={() => setSection("notifications")} />
        <Link to="/help" className="flex w-full items-center gap-3 rounded-2xl bg-card px-3 py-3 text-left shadow-soft">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent text-primary"><CircleHelp className="h-5 w-5" /></span>
          <span className="min-w-0 flex-1"><span className="block font-bold">Help & Support</span><span className="block text-xs text-muted-foreground">Get help, contact support, and FAQs</span></span>
          <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
        </Link>
        <MenuButton icon={ScrollText} tint="bg-accent text-primary" title="Terms & Conditions" detail="Read the rules for using Basecola" onClick={() => setSection("terms")} />
        <MenuButton icon={Lock} tint="bg-accent text-primary" title="Privacy Policy" detail="How this demo handles your information" onClick={() => setSection("privacy")} />
        <MenuButton icon={Info} tint="bg-muted text-muted-foreground" title="About Basecola" detail="App version and product information" extra="v1.0.0" onClick={() => setSection("about")} />
        <Link to="/delete-account" className="flex w-full items-center gap-3 rounded-2xl bg-card px-3 py-3 text-left shadow-soft">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-pink-soft text-pink"><Trash2 className="h-5 w-5" /></span>
          <span className="min-w-0 flex-1"><span className="block font-bold">Delete account</span><span className="block text-xs text-muted-foreground">Close this preview account</span></span>
          <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
        </Link>
        <Link to="/" className="mt-2 flex h-14 items-center justify-center gap-2 rounded-2xl bg-pink-soft text-base font-bold text-pink"><LogOut className="h-5 w-5" />Log Out</Link>
      </>}
    </div>
    <AccountNav active="/profile" />
  </div>;
}

function MenuButton({ icon: Icon, tint, title, detail, extra, onClick }: { icon: typeof User; tint: string; title: string; detail: string; extra?: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="flex w-full items-center gap-3 rounded-2xl bg-card px-3 py-3 text-left shadow-soft">
    <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${tint}`}><Icon className="h-5 w-5" /></span>
    <span className="min-w-0 flex-1"><span className="block font-bold">{title}</span><span className="block text-xs text-muted-foreground">{detail}</span></span>
    {extra && <span className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">{extra}</span>}
    <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
  </button>;
}

function AccountForm(props: { draft: AccountProfile; setDraft: (value: AccountProfile) => void; onSave: (next: AccountProfile) => void; saved: string }) {
  const initial = splitPhone(props.draft.phone, countryByName(props.draft.country)?.iso ?? "US");
  const [phoneIso, setPhoneIso] = useState(initial.iso);
  const [national, setNational] = useState(initial.national);

  function save(event: FormEvent) {
    event.preventDefault();
    const dial = countryByIso(phoneIso)?.dial ?? "";
    props.onSave({ ...props.draft, phone: `${dial} ${national}`.trim() });
  }

  return <form className="mt-5 space-y-4" onSubmit={save}>
    <label className="block space-y-2 text-sm font-medium"><span>Full name</span><Input required maxLength={60} value={props.draft.name} onChange={event => props.setDraft({ ...props.draft, name: event.target.value })} /></label>
    <label className="block space-y-2 text-sm font-medium"><span>Email address</span><Input required type="email" value={props.draft.email} onChange={event => props.setDraft({ ...props.draft, email: event.target.value })} /></label>
    <label className="block space-y-2 text-sm font-medium"><span>Phone</span><span className="flex gap-2"><select aria-label="Country code" value={phoneIso} onChange={event => setPhoneIso(event.target.value)} className="h-9 max-w-[46%] shrink-0 rounded-md border border-input bg-transparent px-2 text-sm">{COUNTRY_DIALS.map(item => <option key={item.iso} value={item.iso}>{countryOptionLabel(item)}</option>)}</select><Input required id="profile-phone" value={national} onChange={event => setNational(event.target.value)} inputMode="tel" autoComplete="tel-national" /></span></label>
    <label className="block space-y-2 text-sm font-medium"><span>Country</span>
      <select required aria-label="Country" value={props.draft.country} onChange={event => { const country = event.target.value; props.setDraft({ ...props.draft, country }); const match = countryByName(country); if (match) setPhoneIso(match.iso); }} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
        <option value="">Select a country</option>
        {COUNTRY_DIALS.map(item => <option key={item.iso} value={item.name}>{item.name}</option>)}
      </select>
    </label>
    <label className="block space-y-2 text-sm font-medium"><span>Address</span><Input required maxLength={120} autoComplete="street-address" value={props.draft.address} onChange={event => props.setDraft({ ...props.draft, address: event.target.value })} /></label>
    <Button type="submit" className="w-full" disabled={!props.draft.name.trim() || !props.draft.country || !props.draft.address.trim() || national.trim().length < 7}><Check />Save changes</Button>
    {props.saved && <p role="status" className="text-sm text-success">{props.saved}</p>}
    <p className="text-xs text-muted-foreground">Changes stay in this preview. Account verification is a separate sample step and does not upload a document.</p>
  </form>;
}

function ProfileSection(props: {
  section: Section; onBack: () => void;
  profile: AccountProfile;
  draft: AccountProfile;
  setDraft: (value: AccountProfile) => void;
  onSave: (next: AccountProfile) => void; saved: string;
  activity: boolean; setActivity: (value: boolean) => void; market: boolean; setMarket: (value: boolean) => void;
  emailAlerts: boolean; setEmailAlerts: (value: boolean) => void;
}) {
  const titles: Record<Section, string> = { account: "Account Information", notifications: "Notifications", terms: "Terms & Conditions", privacy: "Privacy Policy", about: "About Basecola" };
  return <section className="rounded-3xl bg-card p-5 shadow-soft">
    <button type="button" onClick={props.onBack} className="mb-4 flex items-center gap-2 text-sm font-semibold text-primary"><ArrowLeft className="h-4 w-4" />Back</button>
    <h2 className="text-xl font-bold">{titles[props.section]}</h2>
    {props.section === "account" && <AccountForm draft={props.draft} setDraft={props.setDraft} onSave={props.onSave} saved={props.saved} />}
    {props.section === "notifications" && <div className="mt-2 divide-y">
      <div className="flex items-center gap-3 py-4"><label htmlFor="activity" className="flex-1 text-sm font-medium">Transaction notifications</label><Switch id="activity" checked={props.activity} onCheckedChange={props.setActivity} /></div>
      <div className="flex items-center gap-3 py-4"><label htmlFor="market" className="flex-1 text-sm font-medium">Market updates</label><Switch id="market" checked={props.market} onCheckedChange={props.setMarket} /></div>
      <div className="flex items-center gap-3 py-4"><label htmlFor="email-alerts" className="flex-1"><span className="block text-sm font-medium">Email notifications</span><span className="block text-xs text-muted-foreground">{props.profile.email}</span></label><Switch id="email-alerts" checked={props.emailAlerts} onCheckedChange={props.setEmailAlerts} /></div>
      <p className="pt-3 text-xs text-muted-foreground">These switches apply to this preview only. Email is not sent.</p>
    </div>}
    {props.section === "terms" && <div className="mt-5 space-y-4 text-sm leading-6 text-muted-foreground">
      <p>These terms describe the Basecola demo. They are sample text for this preview, not a contract with a financial institution.</p>
      <p><span className="font-semibold text-foreground">Demo only.</span> Balances, prices, purchases, sales, and transfers are samples. No money or cryptocurrency is sent, received, or stored.</p>
      <p><span className="font-semibold text-foreground">Your use.</span> Do not treat screens, quotes, or referral codes as an offer to buy, sell, or custody assets.</p>
      <p><span className="font-semibold text-foreground">Availability.</span> Features can change or reset when the preview session ends. Profile edits stay in the browser for this visit only.</p>
    </div>}
    {props.section === "privacy" && <div className="mt-5 space-y-4 text-sm leading-6 text-muted-foreground">
      <p>This privacy note explains the Basecola demo. It is sample text and does not describe a live account.</p>
      <p><span className="font-semibold text-foreground">Information on this device.</span> Name, email, phone, country, address, and PIN stay in this browser session. They are not sent to a Basecola server.</p>
      <p><span className="font-semibold text-foreground">What we do not collect.</span> This preview does not create a customer profile, track you across sites, or sell personal information.</p>
      <p><span className="font-semibold text-foreground">Notifications.</span> Transaction, market, and email switches only change what you see in this preview. No email is sent.</p>
    </div>}
    {props.section === "about" && <div className="mt-5 space-y-3 text-sm text-muted-foreground">
      <p className="font-semibold text-foreground">Version 1.0.0</p>
      <p>Basecola is a demo. Profile details, prices, and balances are samples and are not a financial account.</p>
    </div>}
  </section>;
}
