"use client";

import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
  Code2,
  Coins,
  Globe2,
  Landmark,
  Network,
  Shield,
  Server,
  Compass,
  Eye,
  Layers,
  Mail,
  Sparkles,
  ShieldCheck,
  WalletCards,
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
            <a href="/">
              Back to Basecola <ArrowRight />
            </a>
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
          <a href="/" aria-label="Basecola home">
            <Logo />
          </a>
          <nav
            aria-label="Main navigation"
            className="flex items-center gap-3 text-sm font-semibold"
          >
            <a
              href="/login"
              className="hidden text-muted-foreground hover:text-foreground sm:inline"
            >
              Log in
            </a>
            <Button asChild size="sm">
              <a href="/signup">Get started</a>
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
              <a href="/" className="hover:text-white">
                Home
              </a>
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

        {slug === "about-us" ? (
          <AboutCompanyStory relatedPages={relatedPages} />
        ) : slug === "careers" ? (
          <CareersOverview />
        ) : slug === "blog" ? (
          <CryptoNewsBlog />
        ) : (
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
                        <Check
                          className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                          aria-hidden="true"
                        />
                        {point}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}

              {page.faqs && <PageFaq faqs={page.faqs} />}

              {slug === "contact" && <ContactForm issueReport={false} />}
            </div>

            <RelatedPageAside category={page.category} relatedPages={relatedPages} />
          </section>
        )}
      </main>

      <footer className="bg-navy text-navy-foreground">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <a href="/" aria-label="Basecola home">
              <Logo tone="light" />
            </a>
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

function CareersOverview() {
  const roles = [
    {
      icon: Code2,
      title: "Backend Engineer",
      type: "Full-time role profile",
      tone: "bg-violet-100 text-violet-700",
      description:
        "Help design the reliable services behind account experiences, asset information, and transaction workflows.",
      responsibilities: [
        "Build and maintain secure, well-documented APIs for web and account features.",
        "Design reliable transaction state, validation, idempotency, and event-processing workflows.",
        "Integrate with databases and external providers for authentication, payments, market data, and blockchain services.",
        "Improve observability with useful logs, metrics, tracing, and actionable alerts.",
        "Partner with product and frontend engineers to turn user needs into dependable backend capabilities.",
      ],
      skills: [
        "Professional backend engineering experience",
        "Strong API, database, and distributed-systems fundamentals",
        "Security-minded approach to sensitive financial workflows",
        "Clear communication and collaborative problem-solving",
      ],
    },
    {
      icon: Server,
      title: "Platform & Reliability Engineer",
      type: "Future role profile",
      tone: "bg-sky-100 text-sky-700",
      description:
        "Shape the deployment, monitoring, and operational foundations that keep services resilient as they grow.",
      responsibilities: [
        "Automate safe build, test, deployment, and rollback workflows.",
        "Develop service monitoring, incident response, and reliability practices.",
        "Improve secrets management, access controls, and infrastructure security.",
      ],
      skills: [
        "Cloud infrastructure and deployment automation",
        "Monitoring, incident management, and reliability practices",
        "Infrastructure-as-code and secure operations",
      ],
    },
    {
      icon: Network,
      title: "Blockchain Integrations Engineer",
      type: "Future role profile",
      tone: "bg-teal-100 text-teal-700",
      description:
        "Help build careful integrations between application services and supported blockchain networks.",
      responsibilities: [
        "Develop and test network data ingestion and transaction monitoring.",
        "Design safe handling for confirmations, retries, and chain reorganization events.",
        "Build clear boundaries between wallet infrastructure and application services.",
      ],
      skills: [
        "Backend systems and blockchain fundamentals",
        "Event-driven systems and asynchronous processing",
        "Strong testing, reconciliation, and security practices",
      ],
    },
  ];

  return (
    <section className="mx-auto max-w-6xl px-5 py-10 sm:py-14">
      <div className="rounded-3xl bg-linear-to-br from-[#1b1240] via-[#30216b] to-[#6d4dff] p-6 text-white shadow-sm sm:p-10">
        <p className="text-sm font-bold uppercase tracking-wider text-white/70">
          Careers at Basecola
        </p>
        <h2 className="mt-3 max-w-3xl text-3xl font-extrabold leading-tight sm:text-4xl">
          Help build the services behind a clearer crypto experience.
        </h2>
        <p className="mt-4 max-w-3xl leading-relaxed text-white/80">
          We value thoughtful engineering, practical security, and technology that makes complex
          systems easier to use. Explore example role profiles and the kinds of problems a growing
          digital-asset product needs to solve.
        </p>
        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2">
            <BriefcaseBusiness className="h-4 w-4" /> Engineering roles
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2">
            <Shield className="h-4 w-4" /> Security-minded work
          </span>
        </div>
      </div>

      <div className="mt-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-primary">Role profiles</p>
          <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">The work we want to do well</h2>
        </div>
        <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
          These profiles describe potential roles and responsibilities, not confirmed vacancies.
          Current openings, location, compensation, and application details have not been published.
        </p>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        {roles.map(({ icon: Icon, title, type, tone, description, responsibilities, skills }) => (
          <article
            key={title}
            className="flex flex-col rounded-3xl border bg-card p-5 shadow-sm sm:p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <span className={`grid h-12 w-12 place-items-center rounded-2xl ${tone}`}>
                <Icon className="h-6 w-6" aria-hidden="true" />
              </span>
              <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-semibold text-muted-foreground">
                {type}
              </span>
            </div>
            <h3 className="mt-5 text-xl font-extrabold">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
            <div className="mt-5">
              <h4 className="text-sm font-bold">What you could work on</h4>
              <ul className="mt-3 space-y-2.5">
                {responsibilities.map((responsibility) => (
                  <li
                    key={responsibility}
                    className="flex gap-2 text-sm leading-relaxed text-muted-foreground"
                  >
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                    {responsibility}
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-5 border-t pt-4">
              <h4 className="text-sm font-bold">Helpful experience</h4>
              <ul className="mt-2 flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <li
                    key={skill}
                    className="rounded-full bg-accent px-2.5 py-1 text-xs text-muted-foreground"
                  >
                    {skill}
                  </li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-8 flex flex-col gap-4 rounded-3xl border border-primary/15 bg-accent/60 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <h2 className="font-extrabold">Interested in future opportunities?</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Contact us with a general careers inquiry. This preview does not accept or store job
            applications.
          </p>
        </div>
        <a
          href="/company/contact"
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90"
        >
          Contact Basecola <ArrowUpRight className="h-4 w-4" />
        </a>
      </div>
    </section>
  );
}

const sampleCryptoStories = [
  {
    category: "Bitcoin & Markets",
    title: "Bitcoin beyond the headlines: what moves a global market?",
    summary:
      "A beginner-friendly look at liquidity, investor expectations, macroeconomic news, and why crypto prices can move sharply in either direction.",
    readTime: "5 min read",
    art: "bitcoin",
  },
  {
    category: "Payments & Stablecoins",
    title: "Stablecoins and the search for faster cross-border payments",
    summary:
      "Explore how digital dollar tokens are used in payment discussions, and the trade-offs around reserves, regulation, access, and settlement.",
    readTime: "7 min read",
    art: "payments",
  },
  {
    category: "Blockchain Ecosystems",
    title: "Ethereum, scaling networks, and the next generation of apps",
    summary:
      "A plain-language overview of how blockchain networks and scaling approaches aim to support applications while managing cost and security.",
    readTime: "6 min read",
    art: "network",
  },
  {
    category: "Policy & Regulation",
    title: "Why crypto rules differ from one country to another",
    summary:
      "Compare the policy questions governments consider, from consumer protection and custody to payments, market conduct, and innovation.",
    readTime: "8 min read",
    art: "policy",
  },
] as const;

function CryptoNewsBlog() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-10 sm:py-14">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
              Crypto world
            </span>
            <span className="rounded-full border px-3 py-1 text-xs font-semibold text-muted-foreground">
              Sample editorial · not live news
            </span>
          </div>
          <h2 className="mt-4 max-w-3xl text-3xl font-extrabold leading-tight sm:text-4xl">
            Big ideas and important conversations across crypto.
          </h2>
          <p className="mt-4 max-w-3xl leading-relaxed text-muted-foreground">
            Explore sample story concepts about digital-asset markets, payments, blockchain
            ecosystems, and policy around the world. These illustrations are editorial examples, not
            current reporting or verified breaking news.
          </p>
        </div>
        <aside className="rounded-3xl bg-navy p-5 text-navy-foreground">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10 text-white">
            <BookOpen className="h-5 w-5" aria-hidden="true" />
          </span>
          <h3 className="mt-4 font-extrabold">Read with context</h3>
          <p className="mt-2 text-sm leading-relaxed text-white/70">
            Crypto markets move quickly. Verify dates, facts, and sources before relying on any
            publication or making a financial decision.
          </p>
        </aside>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        {sampleCryptoStories.map((story, index) => (
          <article
            key={story.title}
            className="overflow-hidden rounded-3xl border bg-card shadow-sm"
          >
            <CryptoStoryArtwork variant={story.art} index={index} />
            <div className="p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  {story.category}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                  {story.readTime}
                </span>
              </div>
              <h3 className="mt-3 text-xl font-extrabold leading-snug">{story.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{story.summary}</p>
              <p className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                Sample story concept
              </p>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-8 flex flex-col gap-4 rounded-3xl border border-sky-200 bg-sky-50/70 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <h2 className="font-extrabold">Exploring an asset?</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Browse the asset page for available market information. Quotes can change and are not
            investment advice.
          </p>
        </div>
        <a
          href="/assets"
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90"
        >
          Explore assets <ArrowUpRight className="h-4 w-4" />
        </a>
      </div>
    </section>
  );
}

function CryptoStoryArtwork({ variant, index }: { variant: string; index: number }) {
  const palettes = [
    { background: "#21164f", glow: "#8b72ff", accent: "#d8d0ff" },
    { background: "#0d3b48", glow: "#42d3c4", accent: "#c5fff3" },
    { background: "#12325f", glow: "#6bb6ff", accent: "#d2eaff" },
    { background: "#56301d", glow: "#ffb563", accent: "#ffe3bf" },
  ];
  const palette = palettes[index % palettes.length];

  return (
    <div
      className="relative h-52 overflow-hidden"
      role="img"
      aria-label={`Illustration for ${variant} sample crypto story`}
    >
      <svg
        viewBox="0 0 640 320"
        className="h-full w-full"
        aria-hidden="true"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id={`story-bg-${index}`} x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor={palette.background} />
            <stop offset="100%" stopColor={palette.glow} />
          </linearGradient>
          <radialGradient id={`story-glow-${index}`}>
            <stop offset="0%" stopColor={palette.accent} stopOpacity=".75" />
            <stop offset="100%" stopColor={palette.accent} stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="640" height="320" fill={`url(#story-bg-${index})`} />
        <circle cx="510" cy="68" r="155" fill={`url(#story-glow-${index})`} />
        <circle cx="90" cy="300" r="170" fill={`url(#story-glow-${index})`} opacity=".55" />
        <path
          d="M0 245 C105 205 125 270 230 225 S390 205 470 173 570 182 640 130"
          fill="none"
          stroke={palette.accent}
          strokeOpacity=".6"
          strokeWidth="3"
        />
        <path
          d="M0 270 C110 245 170 288 250 252 S420 230 520 203 600 218 640 190"
          fill="none"
          stroke="white"
          strokeOpacity=".28"
          strokeWidth="2"
        />
        <g fill="none" stroke="white" strokeOpacity=".62" strokeWidth="2">
          <path d="m335 114 60-34 60 34v68l-60 34-60-34z" />
          <path d="m395 80 0 68 60 34m-60-34-60 34m60-34 60-34" />
          <circle cx="335" cy="114" r="5" fill={palette.accent} />
          <circle cx="395" cy="80" r="5" fill={palette.accent} />
          <circle cx="455" cy="114" r="5" fill={palette.accent} />
          <circle cx="395" cy="148" r="7" fill={palette.accent} />
          <circle cx="335" cy="182" r="5" fill={palette.accent} />
          <circle cx="455" cy="182" r="5" fill={palette.accent} />
        </g>
        <circle
          cx="188"
          cy="140"
          r="57"
          fill="white"
          fillOpacity=".12"
          stroke="white"
          strokeOpacity=".7"
          strokeWidth="2"
        />
        {variant === "bitcoin" ? (
          <text x="188" y="160" fill="white" fontSize="58" fontWeight="700" textAnchor="middle">
            ₿
          </text>
        ) : variant === "payments" ? (
          <g
            fill="none"
            stroke="white"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M157 128h57m-13-13 13 13-13 13M219 153h-57m13-13-13 13 13 13" />
          </g>
        ) : variant === "network" ? (
          <g fill="none" stroke="white" strokeWidth="4">
            <path d="m188 105 27 16v31l-27 16-27-16v-31z" />
            <path d="m188 105v32m27-16-27 16m-27-16 27 16m-27 15 27-15 27 15" />
          </g>
        ) : (
          <g fill="none" stroke="white" strokeWidth="4" strokeLinecap="round">
            <path d="M160 163h56M166 151l10-17 11 8 15-24 13 13" />
            <circle cx="202" cy="118" r="4" fill="white" />
          </g>
        )}
      </svg>
      <span className="absolute bottom-3 left-3 rounded-full bg-black/25 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur">
        Sample illustration
      </span>
    </div>
  );
}

function AboutCompanyStory({
  relatedPages,
}: {
  relatedPages: { category: MarketingCategory; label: string; slug: string }[];
}) {
  const principles = [
    {
      icon: Eye,
      title: "Clarity before complexity",
      description:
        "We aim to make the details of an action easier to understand, from the asset you selected to the information you should review before proceeding.",
      tone: "bg-violet-100 text-violet-700",
    },
    {
      icon: ShieldCheck,
      title: "Security as a foundation",
      description:
        "Account protection and careful transaction habits belong in the everyday experience—not hidden behind fine print or hard-to-find settings.",
      tone: "bg-sky-100 text-sky-700",
    },
    {
      icon: Layers,
      title: "Useful tools, thoughtfully connected",
      description:
        "Markets, asset information, wallet tools, and account guidance should work together so people can move through the product with context.",
      tone: "bg-teal-100 text-teal-700",
    },
    {
      icon: Compass,
      title: "Transparency that builds trust",
      description:
        "Clear communication about previews, estimates, risks, and confirmed activity helps people make better-informed decisions.",
      tone: "bg-amber-100 text-amber-700",
    },
  ];

  return (
    <section className="mx-auto max-w-6xl px-5 py-10 sm:py-14">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(260px,0.7fr)] lg:items-start">
        <article className="space-y-6">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-wider text-primary">Who we are</p>
            <h2 className="mt-2 text-3xl font-extrabold leading-tight sm:text-4xl">
              Building a more approachable way to explore digital assets.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              Basecola is a digital-asset company focused on making crypto products feel easier to
              navigate. We bring market information, asset discovery, wallet experiences, and
              practical account tools together in one place—with an emphasis on clear language and
              considered design.
            </p>
          </div>

          <div className="space-y-4 text-base leading-8 text-muted-foreground">
            <p>
              The world of crypto can feel fragmented. People may need to switch between price
              screens, account settings, transaction details, and help content just to understand
              one simple step. Basecola is being shaped around a more coherent experience: give
              people useful context, make the next action easier to find, and help them review
              important details before they proceed.
            </p>
            <p>
              Our product brings together tools for exploring supported assets and market
              information, navigating buy and sell experiences, and understanding wallet and account
              activity. The goal is not to make digital assets seem risk-free or effortless. It is
              to make the experience more understandable, so people can make decisions with better
              information.
            </p>
            <p>
              We believe trust is earned through transparency. Digital asset prices can move
              quickly, networks have their own rules, and transfers may be irreversible. A useful
              product should communicate these realities, distinguish an estimate from a confirmed
              transaction, and never present a demonstration as real financial activity.
            </p>
          </div>

          <div className="rounded-3xl border border-primary/10 bg-linear-to-br from-primary/5 via-white to-sky-50 p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Compass className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="text-xl font-extrabold">Our purpose</h3>
            </div>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              To build clear, connected, and responsible digital-asset experiences that help people
              understand what they are viewing and what they are choosing to do.
            </p>
          </div>
        </article>

        <aside className="space-y-4">
          <div className="rounded-3xl bg-navy p-6 text-navy-foreground shadow-sm">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10 text-white">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </span>
            <h3 className="mt-4 text-xl font-extrabold">What guides us</h3>
            <p className="mt-2 text-sm leading-relaxed text-white/70">
              Helpful technology starts with respect for the person using it: their time, their
              questions, and the importance of the choices they make.
            </p>
          </div>
          <div className="rounded-3xl border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-100 text-teal-700">
                <WalletCards className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="font-bold">A connected experience</h3>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Explore assets, markets, and wallet tools from a consistent interface, with guidance
              available when you need more context.
            </p>
            <nav aria-label="Explore Basecola" className="mt-4 space-y-1">
              {relatedPages.map((item) => (
                <a
                  key={item.slug}
                  href={marketingPagePath(item.category, item.slug)}
                  className="flex items-center justify-between rounded-lg px-2 py-2 text-sm font-semibold hover:bg-accent"
                >
                  {item.label}
                  <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                </a>
              ))}
            </nav>
          </div>
        </aside>
      </div>

      <div className="mt-14 overflow-hidden rounded-[2rem] border border-violet-100 bg-linear-to-br from-violet-50 via-white to-sky-50 p-5 shadow-sm sm:p-8 lg:p-10">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-bold uppercase tracking-wider text-primary">How we work</p>
          <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">
            Principles behind the product
          </h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            The experience we build is guided by practical principles that put people, clarity, and
            responsible technology first.
          </p>
        </div>
        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          {principles.map(({ icon: Icon, title, description, tone }) => (
            <article
              key={title}
              className="rounded-2xl border border-white/80 bg-white/90 p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-6"
            >
              <span className={`grid h-12 w-12 place-items-center rounded-2xl ${tone}`}>
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 font-bold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="mt-8 rounded-3xl border border-amber-200 bg-amber-50/70 p-5 sm:p-6">
        <h2 className="font-extrabold">Where we are today</h2>
        <p className="mt-2 max-w-4xl text-sm leading-relaxed text-muted-foreground">
          This website includes a preview experience. Some balances, activity, prices, and flows may
          be illustrative or simulated, and not every described capability is connected to a live
          service. A preview is not an offer to provide a financial service, and its activity is not
          evidence that funds moved. We will identify live functionality and its terms through the
          relevant service when it is available.
        </p>
      </div>
    </section>
  );
}

function RelatedPageAside({
  category,
  relatedPages,
}: {
  category: MarketingCategory;
  relatedPages: { category: MarketingCategory; label: string; slug: string }[];
}) {
  return (
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
          {category === "Support" && (
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
