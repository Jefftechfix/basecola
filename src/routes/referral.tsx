import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ArrowLeft, Check, Copy, Gift, Share2, UserPlus } from "lucide-react";
import { AccountShell } from "@/components/account-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { money } from "@/lib/account-demo";
import { DEMO_REFERRALS, REFERRAL_CODE, REFERRAL_REWARD, type DemoReferral } from "@/lib/referral-demo";

export const Route = createFileRoute("/referral")({
  head: () => ({ meta: [
    { title: "Referral Program — Basecola" }, { name: "description", content: "Invite friends to Basecola and preview a $10 reward for each person you refer." },
    { property: "og:title", content: "Referral Program — Basecola" }, { property: "og:description", content: "Earn a $10 demo reward for each friend you refer." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: ReferralPage,
});

function ReferralPage() {
  const [people, setPeople] = useState<DemoReferral[]>(DEMO_REFERRALS);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const joined = people.filter(person => person.status === "Joined");
  const earned = joined.length * REFERRAL_REWARD;

  async function copyCode() {
    try { await navigator.clipboard.writeText(REFERRAL_CODE); setNotice("Referral code copied"); }
    catch { setNotice("Copy unavailable. Your demo code is BC123456."); }
  }

  async function shareCode() {
    const text = `Join the Basecola demo with my code ${REFERRAL_CODE}. The $10 referral reward is a sample and is not paid out.`;
    if (navigator.share) {
      try { await navigator.share({ title: "Basecola referral", text }); setNotice("Share sheet opened"); return; }
      catch { /* The user can still copy the code. */ }
    }
    await copyCode();
  }

  function refer(event: FormEvent) {
    event.preventDefault();
    const friend = name.trim();
    if (friend.length < 2) { setError("Enter the name of the person you are referring."); return; }
    setPeople(current => [{ id: `ref-${Date.now()}`, name: friend, status: "Pending", date: "Today" }, ...current]);
    setName("");
    setError("");
    setNotice(`${friend} was added. You receive ${money(REFERRAL_REWARD)} when they join. No cash has been paid.`);
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
      {["Share your code with a friend.", "They join Basecola with that code.", `You receive ${money(REFERRAL_REWARD)} for that referral.`].map((step, index) => <li key={step} className="flex items-center gap-3 rounded-2xl bg-card px-4 py-3 shadow-soft"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent text-sm font-bold text-primary">{index + 1}</span><span className="text-sm font-medium">{step}</span></li>)}
    </ol>
    <form className="mt-4 space-y-3 rounded-3xl bg-card p-5 shadow-soft" onSubmit={refer}>
      <h2 className="font-bold">Refer someone</h2>
      <div className="space-y-2"><Label htmlFor="friend-name">Friend's name</Label><Input id="friend-name" value={name} onChange={e => { setName(e.target.value); setError(""); }} placeholder="Enter a name" aria-invalid={!!error} aria-describedby={error ? "friend-error" : undefined} /></div>
      {error && <p id="friend-error" role="alert" className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full"><UserPlus />Add referral</Button>
    </form>
    <section className="mt-4 rounded-3xl bg-card p-5 shadow-soft">
      <div className="flex items-center justify-between gap-3"><h2 className="font-bold">Your referrals</h2><p className="text-sm font-semibold text-success">{money(earned)} earned</p></div>
      <ul className="mt-3 divide-y">{people.map(person => <li key={person.id} className="flex items-center gap-3 py-3"><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${person.status === "Joined" ? "bg-green-soft text-success" : "bg-warning-soft text-warning"}`}>{person.status === "Joined" ? <Check className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}</span><span className="min-w-0 flex-1"><span className="block font-semibold">{person.name}</span><span className="block text-xs text-muted-foreground">{person.status} · {person.date}</span></span><span className="text-sm font-bold">{person.status === "Joined" ? money(REFERRAL_REWARD) : money(REFERRAL_REWARD)}</span></li>)}</ul>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">Pending referrals show the {money(REFERRAL_REWARD)} you receive when they join. Demo rewards are not added to your wallet.</p>
    </section>
    {notice && <p role="status" className="mt-3 text-sm text-muted-foreground">{notice}</p>}
  </AccountShell>;
}
