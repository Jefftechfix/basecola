import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { loadVerifications, saveVerification, statusLabel } from "@/lib/verification-records";
import { Camera, Check, ChevronRight, CloudUpload, CreditCard, Globe, Lock, Mail, MapPin, Phone, ShieldCheck, User } from "lucide-react";
import { AccountShell } from "@/components/account-shell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatSsn, ID_DOCUMENTS, VERIFY_COUNTRIES, verifyDetailsError, verifyDocumentError } from "@/lib/account-verify";
import { loadAccountProfile } from "@/lib/account-profile";
import { COUNTRY_DIALS, countryByIso, countryByName, splitPhone } from "@/lib/countries";
import { CountryCodeSelect } from "@/components/country-code-select";

export const Route = createFileRoute("/verify-account")({
  head: () => ({ meta: [
    { title: "Verify Your Account — Basecola" }, { name: "description", content: "Preview Basecola account verification. Documents stay on this device." },
    { property: "og:title", content: "Verify Your Account — Basecola" }, { property: "og:description", content: "Confirm sample details. No identity document is uploaded." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: VerifyAccountPage,
});

const STEPS = ["Details", "ID Document", "Selfie", "Review"] as const;
const INTRO = [
  { icon: User, title: "Confirm Your Details", detail: "Provide your personal information." },
  { icon: CreditCard, title: "Verify Your Identity", detail: "Choose a sample government ID." },
  { icon: Camera, title: "Take a Selfie", detail: "Confirm it is you with a sample photo." },
  { icon: Lock, title: "Secure & Compliant", detail: "Files stay on this device and are not uploaded." },
];
function VerifyAccountPage() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const { data: records, isLoading } = useQuery({ queryKey: ["account-verifications"], queryFn: loadVerifications });
  const [saving, setSaving] = useState(false);
  const [resubmit, setResubmit] = useState(false);
  const [step, setStep] = useState(0);
  const { data: profile } = useQuery({ queryKey: ["account-profile"], queryFn: loadAccountProfile });
  const seeded = useRef(false);
  const [name, setName] = useState("");
  const [phoneIso, setPhoneIso] = useState("US");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [ssn, setSsn] = useState("");
  const [address, setAddress] = useState("");
  const [idType, setIdType] = useState("");
  const [idName, setIdName] = useState("");
  const [selfieUrl, setSelfieUrl] = useState("");
  const [selfieLabel, setSelfieLabel] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!profile || seeded.current) return;
    seeded.current = true;
    const parsed = splitPhone(profile.phone, countryByName(profile.country)?.iso ?? "US");
    setName(profile.name);
    setEmail(profile.email);
    setCountry(profile.country);
    setAddress(profile.address);
    setPhoneIso(parsed.iso);
    setPhone(parsed.national);
  }, [profile]);

  useEffect(() => () => { if (selfieUrl) URL.revokeObjectURL(selfieUrl); }, [selfieUrl]);

  function rememberFile(file: File | undefined, kind: "id" | "selfie") {
    if (!file) return;
    const allowed = kind === "id" ? /^(image\/jpeg|image\/png|application\/pdf)$/.test(file.type) : file.type.startsWith("image/");
    if (!allowed || file.size > 10 * 1024 * 1024) {
      setError(kind === "id" ? "Choose a JPG, PNG, or PDF under 10MB. It stays on this device." : "Choose a photo under 10MB. It stays on this device.");
      return;
    }
    setError("");
    if (kind === "id") setIdName(file.name);
    else {
      if (selfieUrl) URL.revokeObjectURL(selfieUrl);
      setSelfieUrl(URL.createObjectURL(file));
      setSelfieLabel("Photo captured");
    }
  }

  function continueDetails(event: FormEvent) {
    event.preventDefault();
    const problem = verifyDetailsError({ name, phone, email, address, country, ssn });
    if (problem) { setError(problem); return; }
    setError("");
    setStep(2);
  }

  function continueDocument() {
    const problem = verifyDocumentError(idType);
    if (problem) { setError(problem); return; }
    setError("");
    setStep(3);
  }

  function continueSelfie() {
    if (!selfieLabel) { setError("Take a sample selfie or choose a photo. It stays on this device."); return; }
    setError("");
    setStep(4);
  }

  async function submit() {
    setSaving(true); setError("");
    try {
      await saveVerification({ full_name: name, email, phone: `${countryByIso(phoneIso)?.dial ?? ""} ${phone}`.trim(), country, address, ssn, id_document_type: idType });
      if (selfieUrl) URL.revokeObjectURL(selfieUrl);
      setSelfieUrl(""); setIdName(""); setSsn(""); setResubmit(false);
      await qc.invalidateQueries({ queryKey: ["account-verifications"] });
      setSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not submit verification. Please try again.");
    } finally { setSaving(false); }
  }

  if (isLoading) return <AccountShell active="/profile" title="Verify Your Account"><p className="rounded-3xl bg-card p-6 text-center text-sm text-muted-foreground shadow-soft">Loading your verification…</p></AccountShell>;

  if (records && !records.signedIn) {
    return <AccountShell active="/profile" title="Verify Your Account">
      <section className="rounded-3xl bg-card p-6 text-center shadow-soft">
        <h2 className="text-2xl font-extrabold">Log in to verify</h2>
        <p className="mt-2 text-sm text-muted-foreground">Sign in to submit and track your verification request.</p>
        <Button asChild className="mt-6 h-12 w-full rounded-2xl"><Link to="/login">Log in</Link></Button>
      </section>
    </AccountShell>;
  }

  const latest = records?.records[0];
  if (latest && !success && step === 0 && !resubmit) {
    const tone = latest.status === "approved" ? "bg-green-soft text-success" : latest.status === "rejected" ? "bg-destructive/10 text-destructive" : "bg-accent text-primary";
    return <AccountShell active="/profile" title="Verify Your Account">
      <section className="rounded-3xl bg-card p-6 text-center shadow-soft">
        <span className={`mx-auto grid h-16 w-16 place-items-center rounded-full ${tone}`}><ShieldCheck className="h-8 w-8" /></span>
        <h2 className="mt-4 text-2xl font-extrabold">{statusLabel(latest.status)}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{latest.status === "approved" ? "Your account is verified." : latest.status === "rejected" ? "Your request was not approved. You can submit a new one." : "We received your request and it is waiting for review."}</p>
        {latest.reviewer_note && <p className="mt-3 rounded-2xl bg-background p-3 text-sm"><span className="font-semibold">Reviewer note:</span> {latest.reviewer_note}</p>}
        {latest.status === "rejected" && <Button type="button" className="mt-6 h-12 w-full rounded-2xl" onClick={() => { setResubmit(true); setStep(1); }}>Submit again</Button>}
        <Button asChild variant={latest.status === "rejected" ? "outline" : "default"} className="mt-3 h-12 w-full rounded-2xl"><Link to="/dashboard">Continue to Dashboard</Link></Button>
      </section>
      <section className="mt-4 rounded-3xl bg-card p-5 shadow-soft">
        <h3 className="font-bold">Request history</h3>
        <ul className="mt-3 divide-y">{records!.records.map(r => <li key={r.id} className="flex items-center justify-between py-3 text-sm"><span><span className="block font-semibold">{r.id_document_type}</span><span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span></span><span className="font-semibold">{statusLabel(r.status)}</span></li>)}</ul>
      </section>
    </AccountShell>;
  }

  return <AccountShell active="/profile" title={step === 0 ? "Verify Your Account" : "Verify account"}>
    {step === 0 && <section className="space-y-5">
      <div className="rounded-3xl bg-card px-5 py-8 text-center shadow-soft">
        <div className="relative mx-auto grid h-28 w-28 place-items-center rounded-3xl bg-accent text-primary"><CreditCard className="h-14 w-14" /><span className="absolute -right-2 -top-2 grid h-10 w-10 place-items-center rounded-2xl bg-[#6d4dff] text-white"><ShieldCheck className="h-5 w-5" /></span></div>
        <h2 className="mt-6 text-3xl font-extrabold">Verify Your Account</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">Complete the verification process to secure your account and unlock full features.</p>
        <ul className="mt-6 space-y-3 text-left">{INTRO.map(item => <li key={item.title} className="flex items-center gap-3 rounded-2xl bg-background px-3 py-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent text-primary"><item.icon className="h-5 w-5" /></span><span><span className="block font-bold">{item.title}</span><span className="block text-xs text-muted-foreground">{item.detail}</span></span></li>)}</ul>
        <Button type="button" className="mt-6 h-12 w-full rounded-2xl" onClick={() => setStep(1)}>Start Verification <ChevronRight className="h-4 w-4" /></Button>
      </div>
    </section>}

    {step > 0 && <div className="space-y-4">
      <Stepper step={step} />
      {step === 1 && <form className="space-y-4 rounded-3xl bg-card p-5 shadow-soft" onSubmit={continueDetails}>
        <h2 className="text-2xl font-extrabold">Enter Your Details</h2>
        <p className="text-sm text-muted-foreground">Provide your personal information as it appears on your valid ID.</p>
        <Field icon={User} label="Full Name"><Input id="verify-name" value={name} onChange={event => { setName(event.target.value); setError(""); }} autoComplete="name" /></Field>
        <Field icon={Phone} label="Phone Number"><span className="flex gap-2"><CountryCodeSelect value={phoneIso} onChange={setPhoneIso} className="h-9 border border-input px-2 text-sm" /><Input id="verify-phone" value={phone} onChange={event => { setPhone(event.target.value); setError(""); }} inputMode="tel" autoComplete="tel-national" /></span></Field>
        <Field icon={Mail} label="Email Address"><Input id="verify-email" type="email" value={email} onChange={event => { setEmail(event.target.value); setError(""); }} autoComplete="email" /></Field>
        <Field icon={Globe} label="Country"><select id="verify-country" aria-label="Country" value={country} onChange={event => { const next = event.target.value; setCountry(next); setError(""); if (next !== "United States") setSsn(""); const match = countryByName(next); if (match) setPhoneIso(match.iso); }} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm">{VERIFY_COUNTRIES.map(item => <option key={item}>{item}</option>)}</select></Field>
        {country === "United States" && <Field icon={Lock} label="Social Security Number"><Input id="verify-ssn" value={ssn} onChange={event => { setSsn(formatSsn(event.target.value)); setError(""); }} inputMode="numeric" autoComplete="off" maxLength={11} placeholder="XXX-XX-XXXX" aria-describedby="ssn-note" /></Field>}
        {country === "United States" && <p id="ssn-note" className="text-xs text-muted-foreground">This sample number is cleared when you submit. It is not saved.</p>}
        <Field icon={MapPin} label="Residential Address"><Input id="verify-address" value={address} onChange={event => { setAddress(event.target.value); setError(""); }} autoComplete="street-address" /></Field>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="h-12 w-full rounded-2xl">Continue <ChevronRight className="h-4 w-4" /></Button>
      </form>}

      {step === 2 && <section className="space-y-4 rounded-3xl bg-card p-5 shadow-soft">
        <h2 className="text-2xl font-extrabold">Upload Your ID</h2>
        <p className="text-sm text-muted-foreground">Choose a document type. A selected file stays on this device and is not uploaded.</p>
        <label className="grid cursor-pointer place-items-center rounded-3xl border-2 border-dashed border-[#c4b5fd] bg-[#f7f3ff] px-4 py-8 text-center">
          <CloudUpload className="h-10 w-10 text-[#6d4dff]" />
          <span className="mt-3 font-bold">Tap to Upload ID</span>
          <span className="text-sm text-muted-foreground">or Choose from Gallery</span>
          <span className="mt-1 text-xs text-muted-foreground">JPG, PNG, or PDF (Max 10MB)</span>
          <input type="file" accept="image/jpeg,image/png,application/pdf" className="sr-only" aria-label="Upload ID" onChange={event => { rememberFile(event.target.files?.[0], "id"); event.target.value = ""; }} />
        </label>
        {idName && <p className="text-sm font-semibold text-[#6d4dff]">{idName}</p>}
        <div>
          <p className="mb-2 font-bold">Accepted Documents</p>
          <div className="space-y-2">{ID_DOCUMENTS.map(document => <button key={document} type="button" aria-pressed={idType === document} className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left font-semibold ${idType === document ? "border-[#6d4dff] bg-[#f7f3ff]" : "bg-background"}`} onClick={() => { setIdType(document); setError(""); }}><span>{document}</span><ChevronRight className="h-4 w-4 text-muted-foreground" /></button>)}</div>
        </div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <div className="flex gap-2"><Button type="button" variant="outline" className="h-12 flex-1 rounded-2xl" onClick={() => setStep(1)}>Back</Button><Button type="button" className="h-12 flex-1 rounded-2xl" onClick={continueDocument}>Continue <ChevronRight className="h-4 w-4" /></Button></div>
      </section>}

      {step === 3 && <section className="space-y-4 rounded-3xl bg-card p-5 text-center shadow-soft">
        <h2 className="text-2xl font-extrabold">Take a Selfie</h2>
        <p className="text-sm text-muted-foreground">Use a sample photo or choose one from this device. It is not uploaded.</p>
        <div className="relative mx-auto grid h-48 w-48 place-items-center overflow-hidden rounded-full border-4 border-[#6d4dff]/30 bg-muted">
          {selfieUrl ? <img src={selfieUrl} alt="Selected selfie preview" className="h-full w-full object-cover" /> : <User className="h-20 w-20 text-muted-foreground" />}
        </div>
        <label className="mx-auto grid h-16 w-16 cursor-pointer place-items-center rounded-full bg-[#6d4dff] text-white"><Camera className="h-7 w-7" /><input type="file" accept="image/*" capture="user" className="sr-only" aria-label="Take a selfie" onChange={event => { rememberFile(event.target.files?.[0], "selfie"); event.target.value = ""; }} /></label>
        <p className="text-sm font-semibold">Tap to Take Selfie</p>
        <Button type="button" variant="outline" className="h-11 w-full rounded-2xl" onClick={() => { setSelfieLabel("Photo captured"); setError(""); }}>Use sample selfie</Button>
        {selfieLabel && <p className="text-sm font-semibold text-success">{selfieLabel}</p>}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <div className="flex gap-2"><Button type="button" variant="outline" className="h-12 flex-1 rounded-2xl" onClick={() => setStep(2)}>Back</Button><Button type="button" className="h-12 flex-1 rounded-2xl" onClick={continueSelfie}>Continue <ChevronRight className="h-4 w-4" /></Button></div>
      </section>}

      {step === 4 && <section className="space-y-4 rounded-3xl bg-card p-5 shadow-soft">
        <h2 className="text-2xl font-extrabold">Review & Submit</h2>
        <p className="text-sm text-muted-foreground">Confirm your information below and submit for verification.</p>
        <ReviewRow icon={User} label="Full Name" value={name} onEdit={() => setStep(1)} />
        <ReviewRow icon={Phone} label="Phone Number" value={`${countryByIso(phoneIso)?.dial ?? ""} ${phone}`} onEdit={() => setStep(1)} />
        <ReviewRow icon={Mail} label="Email Address" value={email} onEdit={() => setStep(1)} />
        <ReviewRow icon={Globe} label="Country" value={country} onEdit={() => setStep(1)} />
        {country === "United States" && <ReviewRow icon={Lock} label="Social Security Number" value={ssn ? `***-**-${ssn.slice(-4)}` : ""} onEdit={() => setStep(1)} />}
        <ReviewRow icon={MapPin} label="Address" value={address} onEdit={() => setStep(1)} />
        <ReviewRow icon={CreditCard} label="ID Document" value={idName ? `${idType} · ${idName}` : idType} onEdit={() => setStep(2)} />
        <ReviewRow icon={Camera} label="Selfie" value={selfieLabel || "Photo captured"} onEdit={() => setStep(3)} />
        <p className="text-xs text-muted-foreground">Your details are saved for review. Document files and selfies are not uploaded; only the last 4 digits of an SSN are kept.</p>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <div className="flex gap-2"><Button type="button" variant="outline" className="h-12 flex-1 rounded-2xl" onClick={() => setStep(3)}>Back</Button><Button type="button" disabled={saving} className="h-12 flex-1 rounded-2xl" onClick={submit}>{saving ? "Submitting…" : "Submit for Verification"} <ChevronRight className="h-4 w-4" /></Button></div>
      </section>}
    </div>}

    <Dialog open={success} onOpenChange={open => { if (!open) { setSuccess(false); setStep(0); } }}>
      <DialogContent className="max-w-sm rounded-3xl text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-green-soft text-success"><Check className="h-8 w-8" /></div>
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">Verification Submitted Successfully!</DialogTitle>
          <DialogDescription className="text-center">Your request is pending review. You can check its status on this page anytime.</DialogDescription>
        </DialogHeader>
        <Button asChild className="h-12 w-full rounded-2xl"><Link to="/dashboard">Continue to Dashboard</Link></Button>
      </DialogContent>
    </Dialog>
  </AccountShell>;
}

function Stepper({ step }: { step: number }) {
  return <ol className="grid grid-cols-4 gap-2" aria-label="Verification progress">{STEPS.map((label, index) => {
    const number = index + 1;
    const done = step > number || (step === 4 && number === 4);
    const current = step === number;
    return <li key={label} className="text-center"><span className={`mx-auto grid h-8 w-8 place-items-center rounded-full text-sm font-bold ${done || current ? "bg-[#6d4dff] text-white" : "bg-muted text-muted-foreground"}`}>{done ? <Check className="h-4 w-4" /> : number}</span><span className={`mt-1 block text-[11px] font-semibold ${current ? "text-[#6d4dff]" : "text-muted-foreground"}`}>{label}</span></li>;
  })}</ol>;
}

function Field({ icon: Icon, label, children }: { icon: typeof User; label: string; children: ReactNode }) {
  return <label className="block space-y-2 text-sm font-medium"><span className="flex items-center gap-2"><Icon className="h-4 w-4 text-[#6d4dff]" />{label}</span>{children}</label>;
}

function ReviewRow({ icon: Icon, label, value, onEdit }: { icon: typeof User; label: string; value: string; onEdit: () => void }) {
  return <div className="flex items-center gap-3 border-b py-3 last:border-0"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent text-primary"><Icon className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block text-xs text-muted-foreground">{label}</span><span className="block truncate font-semibold">{value}</span></span><button type="button" className="text-sm font-semibold text-[#6d4dff]" onClick={onEdit}>Edit</button></div>;
}
