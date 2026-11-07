import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ArrowLeft, CircleHelp, Mail, Phone, Search } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Logo } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { HELP_EMAIL, HELP_EMAIL_HREF, HELP_FAQS, HELP_PHONE, HELP_PHONE_HREF, HELP_TOPICS, helpMessageError, matchingFaqs } from "@/lib/help-demo";

export const Route = createFileRoute("/help")({
  head: () => ({ meta: [
    { title: "Help & Support — Basecola" }, { name: "description", content: "Browse Basecola demo answers and leave a support note in this preview." },
    { property: "og:title", content: "Help & Support — Basecola" }, { property: "og:description", content: "Find answers about the Basecola demo." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: HelpPage,
});

function HelpPage() {
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const faqs = matchingFaqs(query);

  function send(event: FormEvent) {
    event.preventDefault();
    const problem = helpMessageError(topic, message);
    if (problem) { setError(problem); setNotice(""); return; }
    setMessage("");
    setError("");
    setNotice(`Your ${topic} note stays in this preview. It was not sent to a support team.`);
  }

  return <main className="mx-auto min-h-screen max-w-3xl space-y-4 px-5 py-5">
    <header className="mb-7 flex items-center justify-between">
      <Link to="/" aria-label="Basecola home"><Logo /></Link>
      <Button asChild variant="outline"><Link to="/"><ArrowLeft />Back to home</Link></Button>
    </header>
    <h1 className="text-3xl font-extrabold">Help & Support</h1>
    <section className="rounded-3xl bg-gradient-primary p-6 text-primary-foreground shadow-soft">
      <p className="flex items-center gap-2 text-sm text-primary-foreground/80"><CircleHelp className="h-4 w-4" />Help & Support</p>
      <p className="mt-2 text-2xl font-extrabold">How can we help?</p>
      <p className="mt-2 text-sm text-primary-foreground/90">Browse answers about this demo, or leave a note. Messages stay on this device.</p>
    </section>
    <div className="relative mt-4"><Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" /><Input id="help-search" aria-label="Search help" className="h-12 bg-card pl-9" placeholder="Search questions" value={query} onChange={e => setQuery(e.target.value)} /></div>
    <section className="mt-4 rounded-3xl bg-card p-5 shadow-soft">
      <div className="flex items-center justify-between gap-3"><h2 className="font-bold">Common questions</h2><span className="text-sm text-muted-foreground">{faqs.length} of {HELP_FAQS.length}</span></div>
      {faqs.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">No answers match that search.</p> : <Accordion type="single" collapsible className="mt-2">
        {faqs.map(item => <AccordionItem key={item.id} value={item.id}><AccordionTrigger>{item.question}</AccordionTrigger><AccordionContent className="text-muted-foreground">{item.answer}</AccordionContent></AccordionItem>)}
      </Accordion>}
    </section>
    <section className="mt-4 rounded-3xl bg-card p-5 shadow-soft">
      <h2 className="font-bold">Contact support</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <a href={HELP_PHONE_HREF} className="flex items-center gap-3 rounded-2xl bg-background px-3 py-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent text-primary"><Phone className="h-5 w-5" /></span>
          <span className="min-w-0"><span className="block text-xs text-muted-foreground">Phone</span><span className="block font-bold">{HELP_PHONE}</span></span>
        </a>
        <a href={HELP_EMAIL_HREF} className="flex items-center gap-3 rounded-2xl bg-background px-3 py-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent text-primary"><Mail className="h-5 w-5" /></span>
          <span className="min-w-0"><span className="block text-xs text-muted-foreground">Email</span><span className="block break-all font-bold">{HELP_EMAIL}</span></span>
        </a>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">These are sample contacts for this preview.</p>
    </section>
    <form className="mt-4 space-y-4 rounded-3xl bg-card p-5 shadow-soft" onSubmit={send}>
      <h2 className="font-bold">Send a note</h2>
      <div className="space-y-2">
        <Label htmlFor="help-topic">Topic</Label>
        <Select value={topic} onValueChange={value => { setTopic(value); setError(""); }}>
          <SelectTrigger id="help-topic" className="h-12 bg-background"><SelectValue placeholder="Choose a topic" /></SelectTrigger>
          <SelectContent>{HELP_TOPICS.map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="help-message">Message</Label>
        <Textarea id="help-message" value={message} onChange={e => { setMessage(e.target.value); setError(""); }} placeholder="Tell us what you need" className="min-h-28 bg-background" aria-invalid={!!error} aria-describedby={error ? "help-error" : undefined} />
      </div>
      {error && <p id="help-error" role="alert" className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="h-12 w-full"><Mail />Send message</Button>
      {notice && <p role="status" className="text-sm text-muted-foreground">{notice}</p>}
      <p className="text-xs leading-relaxed text-muted-foreground">This form does not email anyone or open a support ticket.</p>
    </form>
  </main>;
}
