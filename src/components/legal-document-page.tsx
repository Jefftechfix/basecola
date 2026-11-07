"use client";

import { ArrowLeft, ArrowUpRight, FileText, Printer, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/brand";
import { MARKETING_NAV, marketingPagePath } from "@/lib/marketing-pages";
import type { LegalDocument } from "@/lib/legal-content";
import { Button } from "@/components/ui/button";

export function LegalDocumentPage({ document }: { document: LegalDocument }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <a href="/" aria-label="Basecola home">
            <Logo />
          </a>
          <Button asChild variant="outline" size="sm">
            <a href="/">
              <ArrowLeft />
              Home
            </a>
          </Button>
        </div>
      </header>

      <main>
        <section className="bg-navy text-navy-foreground">
          <div className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white/75">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Legal information
            </p>
            <h1 className="mt-4 text-4xl font-extrabold sm:text-5xl">{document.title}</h1>
            <p className="mt-4 max-w-3xl leading-relaxed text-white/75">{document.introduction}</p>
            <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-white/65">
              <span>Last updated {document.updated}</span>
              <span aria-hidden="true">·</span>
              <span>{document.sections.length} sections</span>
            </div>
          </div>
        </section>

        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-8 sm:py-12 lg:grid-cols-[250px_minmax(0,1fr)]">
          <aside className="h-fit lg:sticky lg:top-6">
            <nav
              aria-label={`${document.shortTitle} policy contents`}
              className="rounded-2xl border bg-card p-4 shadow-sm"
            >
              <p className="flex items-center gap-2 px-2 font-bold">
                <FileText className="h-4 w-4 text-primary" />
                On this page
              </p>
              <ol className="mt-3 max-h-[60vh] space-y-1 overflow-y-auto">
                {document.sections.map((section, index) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className="flex gap-2 rounded-lg px-2 py-2 text-sm leading-snug text-muted-foreground transition hover:bg-accent hover:text-foreground"
                    >
                      <span className="shrink-0 text-xs tabular-nums text-primary">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      {section.title}
                    </a>
                  </li>
                ))}
              </ol>
              <Button
                type="button"
                variant="outline"
                className="mt-4 w-full"
                onClick={() => window.print()}
              >
                <Printer />
                Print or save PDF
              </Button>
            </nav>
          </aside>

          <article className="min-w-0">
            <div className="mb-6 rounded-2xl border border-primary/15 bg-accent/60 p-4 text-sm leading-relaxed text-muted-foreground">
              <p>
                <strong className="text-foreground">About this document:</strong> This policy is
                written for the current Basecola product and preview behavior. The production
                operator, jurisdiction, provider configuration, and applicable laws can affect these
                terms. Have qualified legal counsel review the final documents before relying on
                them as a production contract or compliance notice.
              </p>
            </div>

            <div className="space-y-4">
              {document.sections.map((section, index) => (
                <section
                  id={section.id}
                  key={section.id}
                  className="scroll-mt-6 rounded-2xl border bg-card p-5 shadow-sm sm:p-7"
                >
                  <p className="text-xs font-bold uppercase tracking-wider text-primary">
                    Section {index + 1}
                  </p>
                  <h2 className="mt-1 text-xl font-extrabold">{section.title}</h2>
                  <div className="mt-3 space-y-3 text-sm leading-7 text-muted-foreground">
                    {section.paragraphs.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                    {section.bullets && (
                      <ul className="list-disc space-y-2 pl-5">
                        {section.bullets.map((bullet) => (
                          <li key={bullet}>{bullet}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </section>
              ))}
            </div>

            <div className="mt-6 rounded-2xl bg-accent p-5">
              <p className="font-bold">Need help?</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Visit the Help Center for general product questions. Do not send passwords,
                authentication codes, recovery phrases, or private keys.
              </p>
              <a
                href="/help"
                className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
              >
                Open Help Center
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </article>
        </div>
      </main>

      <footer className="bg-navy text-navy-foreground">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-6 text-sm">
          <a href="/" aria-label="Basecola home">
            <Logo tone="light" />
          </a>
          <nav
            aria-label="Footer navigation"
            className="flex flex-wrap gap-x-5 gap-y-2 text-white/70"
          >
            {MARKETING_NAV.flatMap((group) =>
              group.items.map((item) => (
                <a
                  key={`${group.category}-${item.slug}`}
                  href={marketingPagePath(group.category, item.slug)}
                  className="hover:text-white"
                >
                  {item.label}
                </a>
              )),
            )}
            <a href="/privacy-policy" className="hover:text-white">
              Privacy Policy
            </a>
            <a href="/terms-of-service" className="hover:text-white">
              Terms of Service
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
