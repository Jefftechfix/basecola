import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { User, Mail, Phone, Globe, UserPlus, Lock, Eye, EyeOff, CheckCircle2, ShieldCheck } from "lucide-react";
import { AuthShell } from "@/components/brand";
import { COUNTRY_DIALS, countryByName, countryOptionLabel } from "@/lib/countries";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create your account — Basecola" },
      { name: "description", content: "Join Basecola and start trading, buying, and selling crypto securely." },
      { property: "og:title", content: "Create your account — Basecola" },
      { property: "og:description", content: "Join Basecola and start trading crypto securely." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Signup,
});

const field = "flex items-center gap-3 rounded-xl border border-input bg-card px-4 py-3 focus-within:ring-2 focus-within:ring-ring";
const input = "w-full bg-transparent outline-none placeholder:text-muted-foreground";

function Signup() {
  const nav = useNavigate();
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [phoneIso, setPhoneIso] = useState("US");
  const rules = [[pw.length >= 8, "At least 8 characters"], [/[A-Z]/.test(pw), "One uppercase letter"], [/\d/.test(pw), "One number"]] as const;
  const ok = rules.every(([v]) => v);

  return (
    <AuthShell>
      <h1 className="text-center text-3xl font-extrabold">Create Your Account</h1>
      <p className="mt-2 text-center text-muted-foreground">Join Basecola and start trading, buying, and selling cryptocurrency securely.</p>
      <form
        className="mt-6 space-y-4"
        onSubmit={(e) => { e.preventDefault(); if (ok) nav({ to: "/verify", search: { email } }); }}
      >
        <L t="Full Name"><div className={field}><User className="h-5 w-5" /><input required className={input} placeholder="Enter your full name" /></div></L>
        <L t="Email Address"><div className={field}><Mail className="h-5 w-5" /><input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={input} placeholder="Enter your email address" /></div></L>
        <L t="Phone Number"><div className={field}><Phone className="h-5 w-5 shrink-0" /><select aria-label="Country code" value={phoneIso} onChange={event => setPhoneIso(event.target.value)} className="max-w-[46%] shrink-0 bg-transparent text-sm font-semibold outline-none">{COUNTRY_DIALS.map(item => <option key={item.iso} value={item.iso}>{countryOptionLabel(item)}</option>)}</select><input type="tel" className={input} placeholder="Enter your phone number" /></div></L>
        <L t="Country"><div className={field}><Globe className="h-5 w-5 shrink-0" /><select required aria-label="Country" value={country} onChange={event => { const next = event.target.value; setCountry(next); const match = countryByName(next); if (match) setPhoneIso(match.iso); }} className={input}><option value="" disabled>Select your country</option>{COUNTRY_DIALS.map(item => <option key={item.iso} value={item.name}>{item.name}</option>)}</select></div></L>
        <L t={<>Referral Code <span className="font-normal">(Optional)</span></>}><div className={field}><UserPlus className="h-5 w-5" /><input className={input} placeholder="Enter referral code" /></div></L>
        <L t="Password">
          <div className={field}><Lock className="h-5 w-5" /><input type={show ? "text" : "password"} value={pw} onChange={(e) => setPw(e.target.value)} className={input} placeholder="Create a strong password" />
            <button type="button" onClick={() => setShow(!show)} aria-label="Toggle password">{show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button></div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
            {rules.map(([v, t]) => <span key={t} className={`flex items-center gap-1 ${v ? "text-success" : "text-muted-foreground"}`}><CheckCircle2 className="h-4 w-4" />{t}</span>)}
          </div>
        </L>
        <button disabled={!ok} className="w-full rounded-2xl bg-primary py-4 text-lg font-bold text-primary-foreground shadow-soft disabled:opacity-60">Sign Up</button>
      </form>
      <p className="mt-6 text-center">Already have an account? <Link to="/login" className="font-bold text-primary">Log In</Link></p>
      <div className="mt-6 flex items-center justify-center gap-2 rounded-2xl bg-accent py-4 text-sm"><ShieldCheck className="h-5 w-5 text-primary" />Your information is secure and encrypted</div>
    </AuthShell>
  );
}

function L({ t, children }: { t: React.ReactNode; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block font-bold">{t}</span>{children}</label>;
}
