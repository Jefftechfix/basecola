import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Check, Copy, Gift, Share2, UserPlus } from "lucide-react";
import { AccountShell } from "@/components/account-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { money } from "@/lib/account-demo";
import { REFERRAL_REWARD } from "@/lib/referral-demo";

export const Route = createFileRoute("/referral")({
  head: () => ({ meta: [
    { title: "Referral Program — Basecola" }, { name: "description", content: "Invite friends to Basecola and earn a $10 reward for each person you refer." },
    { property: "og:title", content: "Referral Program — Basecola" }, { property: "og:description", content: "Earn a $10 reward for each friend you refer." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: ReferralPage,
});

type Ref = { id: string; name: string; status: string; date: string };

function ReferralPage() {
  const [code, setCode] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState(true);
  const [people, setPeople] = useState<Ref[]>([]);
  const [notice, setNotice] = useState("");
  useEffect(() => { void (async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { setSignedIn(false); return; }
    const [{ data: profile }, { data: refs }] = await Promise.all([
      supabase.from("profiles").select("my_referral_code").eq("id", auth.user.id).maybeSingle(),
      supabase.from("admin_referrals").select("id, status, created_at, referral_code").order("created_at", { ascending: false }),
    ]);
    setCode(profile?.my_referral_code ?? null);
    setPeople((refs ?? []).map((r, i) => ({ id: r.id, name: `Referral #${(refs?.length ?? 0) - i}`, status: r.status, date: new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) })));
  })(); }, []);
  const earned = people.filter(p => p.status === "paid").length * REFERRAL_REWARD;
  const REFERRAL_CODE = code ?? "—";

  async function copyCode() {
    if (!code) return;
    try { await navigator.clipboard.writeText(code); setNotice("Referral code copied"); }
    catch { setNotice(`Copy unavailable. Your code is ${code}.`); }
  }

  async function shareCode() {
    if (!code) return;
    const text = `Join Basecola with my referral code ${code}: ${window.location.origin}/signup`;
    if (navigator.share) {
      try { await navigator.share({ title: "Basecola referral", text }); return; }
      catch { /* fall back to copy */ }
    }
    await copyCode();
  }

  return <AccountShell active="/profile" title="Referral">
    <Button asChild variant="link" className="mb-4 h-auto px-0"><Link to="/profile"><ArrowLeft />Back to profile</Link></Button>
    <section className="rounded-3xl bg-gradient-primary p-6 text-primary-foreground shadow-soft">
      <p className="flex items-center gap-2 text-sm text-primary-foreground/80"><Gift className="h-4 w-4" />Referral reward</p>
      <p className="mt-2 text-4xl font-extrabold">{money(REFERRAL_REWARD)}</p>
      <p className="mt-2 text-sm text-primary-foreground/90">You receive {money(REFERRAL_REWARD)} for each person you refer who joins.</p>
    </section>
    <section className="mt-4 rounded-3xl bg-card p-5 shadow-soft">
      <p className="text-sm text-muted-foreground">Your referral code</p>
      <p className="mt-2 text-center text-2xl font-extrabold tracking-wide text-primary">{REFERRAL_CODE}</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Button type="button" variant="outline" onClick={copyCode}><Copy />Copy</Button>
        <Button type="button" onClick={shareCode}><Share2 />Share</Button>
      </div>
    </section>
    <ol className="mt-4 space-y-3">
      {["Share your code with a friend.", "They sign up for Basecola with that code.", `Once approved, ${money(REFERRAL_REWARD)} is added to your wallet.`].map((step, index) => <li key={step} className="flex items-center gap-3 rounded-2xl bg-card px-4 py-3 shadow-soft"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent text-sm font-bold text-primary">{index + 1}</span><span className="text-sm font-medium">{step}</span></li>)}
    </ol>
    <section className="mt-4 rounded-3xl bg-card p-5 shadow-soft">
      <div className="flex items-center justify-between gap-3"><h2 className="font-bold">Your referrals</h2><p className="text-sm font-semibold text-success">{money(earned)} earned</p></div>
      <ul className="mt-3 divide-y">{!signedIn ? <li className="py-3 text-sm text-muted-foreground"><Link to="/login" className="font-semibold text-primary">Log in</Link> to see your referrals.</li> : people.length === 0 ? <li className="py-3 text-sm text-muted-foreground">No referrals yet. Share your code to get started.</li> : people.map(person => <li key={person.id} className="flex items-center gap-3 py-3"><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${person.status === "paid" || person.status === "approved" ? "bg-green-soft text-success" : person.status === "rejected" ? "bg-muted text-muted-foreground" : "bg-warning-soft text-warning"}`}>{person.status === "paid" || person.status === "approved" ? <Check className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}</span><span className="min-w-0 flex-1"><span className="block font-semibold">{person.name}</span><span className="block text-xs capitalize text-muted-foreground">{person.status} · {person.date}</span></span><span className="text-sm font-bold">{person.status === "rejected" ? "—" : money(REFERRAL_REWARD)}</span></li>)}</ul>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">Rewards are reviewed by Basecola. Once paid, {money(REFERRAL_REWARD)} is added to your wallet balance.</p>
    </section>
    {notice && <p role="status" className="mt-3 text-sm text-muted-foreground">{notice}</p>}
  </AccountShell>;
}
