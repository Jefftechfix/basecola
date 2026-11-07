import { useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  CircleHelp,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { Logo } from "@/components/brand";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { HELP_EMAIL, HELP_EMAIL_HREF } from "@/lib/help-demo";
import {
  getMarketingPage,
  MARKETING_NAV,
  marketingPagePath,
  type MarketingCategory,
} from "@/lib/marketing-pages";

export function MarketingContentPage({
  category,
  slug,
}: {
  category: MarketingCategory;
  slug: string;
}) {
  const page = getMarketingPage(category, slug);

  if (!page) {
    return (
      <main className="grid min-h-screen place-items-center px-5">
        <div className="max-w-md text-center">
          <h1 className="text-3xl font-extrabold">Page not found</h1>
          <p className="mt-2 text-muted-foreground">
            This company, product, or support page does not exist.
          </p>
          <Button asChild className="mt-5">
            <Link to="/">
              Back to Basecola <ArrowRight />
            </Link>
          </Button>
        </div>
      </main>
    );
  }

  const relatedPages = (page.related ?? [])
    .map((slug) =>
      MARKETING_NAV.flatMap((group) =>
        group.items.map((item) => ({ ...item, category: group.category })),
      ).find((item) => item.slug === slug),
    )
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  const actions = page.actions ?? (page.action ? [page.action] : []);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <Link to="/" aria-label="Basecola home">
            <Logo />
          </Link>
          <nav
            aria-label="Main navigation"
            className="flex items-center gap-3 text-sm font-semibold"
          >
            <Link
              to="/login"
              className="hidden text-muted-foreground hover:text-foreground sm:inline"
            >
              Log in
            </Link>
            <Button asChild size="sm">
              <Link to="/signup">Get started</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden bg-navy text-navy-foreground">
          <div className="pointer-events-none absolute -right-32 -top-40 h-96 w-96 rounded-full bg-primary/30 blur-3xl" />
          <div className="relative mx-auto max-w-6xl px-5 pb-12 pt-6 sm:pb-16 sm:pt-8">
            <nav
              aria-label="Breadcrumb"
              className="mb-8 flex items-center gap-2 text-sm text-navy-foreground/65"
            >
              <Link to="/" className="hover:text-white">
                Home
              </Link>
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
              <span>{page.category}</span>
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
              <span aria-current="page" className="text-white">
                {page.label}
              </span>
            </nav>
            <div className="max-w-3xl">
              <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-white/75">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                {page.eyebrow}
              </p>
              <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">{page.title}</h1>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">
                {page.description}
              </p>
              {actions.length > 0 && (
                <div className="mt-7 flex flex-wrap gap-3">
                  {actions.map((action) => (
                    <a
                      key={action.href}
                      href={action.href}
                      className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-white px-5 py-3 font-bold text-primary transition hover:bg-white/90"
                    >
                      {action.label}
                      <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-5 px-5 py-10 md:grid-cols-[minmax(0,1fr)_280px] md:py-14">
          <div className="space-y-4">
            {page.sections.map((section, index) => (
              <article
                key={section.title}
                className="rounded-3xl border bg-card p-5 shadow-sm sm:p-7"
              >
                <p className="text-xs font-bold uppercase tracking-wider text-primary">
                  0{index + 1} · {page.category}
                </p>
                <h2 className="mt-2 text-xl font-extrabold sm:text-2xl">{section.title}</h2>
                <p className="mt-3 leading-relaxed text-muted-foreground">{section.body}</p>
                <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                  {section.points.map((point) => (
                    <li key={point} className="flex items-start gap-2 text-sm leading-relaxed">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                      {point}
                    </li>
                  ))}
                </ul>
              </article>
            ))}

            {page.faqs && <PageFaq faqs={page.faqs} />}

            {(slug === "contact" || slug === "report-an-issue") && (
              <ContactForm issueReport={slug === "report-an-issue"} />
            )}
          </div>

          <aside className="space-y-4">
            <div className="rounded-3xl border bg-card p-5 shadow-sm">
              <p className="text-sm font-bold">Explore more</p>
              <nav aria-label="Related pages" className="mt-3 space-y-1">
                {relatedPages.map((item) => (
                  <a
                    key={`${item.category}-${item.slug}`}
                    href={marketingPagePath(item.category, item.slug)}
                    className="flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-accent"
                  >
                    {item.label}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  </a>
                ))}
                {page.category === "Support" && (
                  <a
                    href="/help"
                    className="flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-accent"
                  >
                    Open Help Center
                    <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  </a>
                )}
              </nav>
            </div>
            <div className="rounded-3xl bg-accent p-5">
              <p className="flex items-center gap-2 font-bold">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Preview experience
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Some features and data on this website are for demonstration. Verify the service and
                transaction details before making financial decisions.
              </p>
            </div>
          </aside>
        </section>
      </main>

      <footer className="bg-navy text-navy-foreground">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <Link to="/" aria-label="Basecola home">
              <Logo tone="light" />
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-white/65">
              Explore crypto with clear information and helpful account tools.
            </p>
          </div>
          {MARKETING_NAV.map((group) => (
            <div key={group.category}>
              <h2 className="font-bold">{group.category}</h2>
              <ul className="mt-3 space-y-2 text-sm text-white/65">
                {group.items.map((item) => (
                  <li key={item.slug}>
                    <a
                      className="transition hover:text-white"
                      href={marketingPagePath(group.category, item.slug)}
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-white/10">
          <p className="mx-auto max-w-6xl px-5 py-4 text-xs text-white/55">
            © 2026 Basecola. Preview information only; availability and terms may vary.
          </p>
        </div>
      </footer>
    </div>
  );
}

function PageFaq({ faqs }: { faqs: { question: string; answer: string }[] }) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const filteredFaqs = faqs.filter(({ question, answer }) =>
    `${question} ${answer}`.toLowerCase().includes(normalizedQuery),
  );

  return (
    <section className="rounded-3xl border bg-card p-5 shadow-sm sm:p-7">
      <h2 className="flex items-center gap-2 text-xl font-extrabold">
        <CircleHelp className="h-5 w-5 text-primary" />
        Quick answers
      </h2>
      <Label htmlFor="faq-search" className="sr-only">
        Search frequently asked questions
      </Label>
      <Input
        id="faq-search"
        className="mt-4"
        placeholder="Search questions"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      {filteredFaqs.length > 0 ? (
        <Accordion type="single" collapsible className="mt-3">
          {filteredFaqs.map((faq, index) => (
            <AccordionItem key={faq.question} value={`faq-${index}`}>
              <AccordionTrigger>{faq.question}</AccordionTrigger>
              <AccordionContent className="leading-relaxed text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No answers match that search.
        </p>
      )}
    </section>
  );
}

function ContactForm({ issueReport }: { issueReport: boolean }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  function prepareEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      name.trim().length < 2 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      message.trim().length < 10
    ) {
      setError("Enter your name, a valid email address, and at least 10 characters of detail.");
      setNotice("");
      return;
    }

    const subject = issueReport ? "Basecola website issue" : "Basecola inquiry";
    const body = `Name: ${name.trim()}\nReply email: ${email.trim()}\n\n${message.trim()}`;
    window.location.href = `${HELP_EMAIL_HREF}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setError("");
    setNotice("An email draft was prepared. Review it in your email app before sending.");
  }

  return (
    <form
      onSubmit={prepareEmail}
      className="rounded-3xl border bg-card p-5 shadow-sm sm:p-7"
      noValidate
    >
      <h2 className="flex items-center gap-2 text-xl font-extrabold">
        <Mail className="h-5 w-5 text-primary" />
        {issueReport ? "Prepare an issue report" : "Send an inquiry"}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        This opens your email app with a draft to {HELP_EMAIL}. Nothing is uploaded or stored by
        this form.
      </p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contact-name">Name</Label>
          <Input
            id="contact-name"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-email">Email</Label>
          <Input
            id="contact-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <Label htmlFor="contact-message">
          {issueReport ? "What happened?" : "How can we help?"}
        </Label>
        <Textarea
          id="contact-message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className="min-h-32"
          placeholder={
            issueReport
              ? "Include the page and steps to reproduce the issue. Do not include passwords or wallet secrets."
              : "Describe your question. Do not include passwords or wallet secrets."
          }
        />
      </div>
      {error && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="mt-3 text-sm text-success">
          {notice}
        </p>
      )}
      <Button type="submit" className="mt-4">
        <Mail />
        Prepare email
      </Button>
      <p className="mt-3 text-xs text-muted-foreground">
        For account assistance, you can also visit the{" "}
        <a href="/help" className="font-semibold text-primary underline">
          Help Center
        </a>
        .
      </p>
    </form>
  );
}
