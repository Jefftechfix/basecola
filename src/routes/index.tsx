import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ArrowLeftRight, BarChart3, Bell, ChartNoAxesCombined, CircleHelp, Coins, Download, Eye, Gift, Home, Layers, Menu, Minus, Plus, Repeat, Send, ShieldCheck, User, Wallet, WalletCards } from "lucide-react";
import { Logo, COINS, CoinIcon, Change } from "@/components/brand";
import coins from "@/assets/coins.png";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { LogIn, UserPlus } from "lucide-react";
import { MarketFeedLabel, marketPriceText, useAlchemyMarketPrices } from "@/components/market-prices";
import { MARKETING_NAV, marketingPagePath } from "@/lib/marketing-pages";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Basecola — Buy, sell & manage crypto" },
      { name: "description", content: "A secure and easy way to buy, sell, trade, and store cryptocurrency on Basecola." },
      { property: "og:title", content: "Basecola — Buy, sell & manage crypto" },
      { property: "og:description", content: "A secure and easy way to buy, sell, trade, and store cryptocurrency." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const features = [
  { icon: ShieldCheck, t: "Account security tools" },
  { icon: ChartNoAxesCombined, t: "Market information" },
  { icon: WalletCards, t: "Wallet overview" },
  { icon: Layers, t: "Crypto asset discovery" },
];
const services = [
  { icon: ArrowLeftRight, title: "Buy & sell", description: "Explore a guided flow for choosing an asset, entering an amount, and reviewing the order details.", label: "Explore Buy & Sell", href: "/products/buy-sell", status: "Preview flow" },
  { icon: ChartNoAxesCombined, title: "Markets & assets", description: "Browse supported assets and market information. Prices can change and are not guaranteed execution quotes.", label: "View assets", href: "/assets", status: "Market information" },
  { icon: WalletCards, title: "Wallet overview", description: "See how balances and activity come together in a wallet dashboard. Preview balances are not real funds.", label: "Explore wallet", href: "/wallet", status: "Account tools" },
  { icon: Download, title: "Fund your wallet", description: "Review the wallet-funding experience and its available options before taking action.", label: "Funding options", href: "/fund-wallet", status: "Review details" },
  { icon: Send, title: "Send & receive", description: "Learn the steps for transfer flows. Always verify the asset, network, and destination; demo identifiers are not deposit addresses.", label: "Transfer guidance", href: "/receive", status: "Check network" },
  { icon: ShieldCheck, title: "Account security", description: "Review available password, PIN, and two-factor authentication settings for your account.", label: "Security options", href: "/security", status: "Protect your account" },
  { icon: Coins, title: "Earn information", description: "Understand how crypto reward products can work and the risks to review. No yield or return is promised here.", label: "Learn about Earn", href: "/products/earn", status: "Learn first" },
  { icon: Gift, title: "Referral rewards", description: "See how the referral experience works in this environment; preview rewards are not paid out.", label: "Referral details", href: "/referral", status: "Preview feature" },
  { icon: CircleHelp, title: "Help & support", description: "Find answers about accounts, assets, and the demonstration experience, or review support options.", label: "Visit Help Center", href: "/help", status: "We're here to help" },
];

function PhoneMock({ quotes }: { quotes: ReturnType<typeof useAlchemyMarketPrices>["data"] }) {
  return (
    <div className="mx-auto w-[300px] rounded-[2.75rem] border-[10px] border-navy bg-card p-4 shadow-phone">
      <div className="flex items-center justify-between"><Logo size="sm" /><Bell className="h-4 w-4" /></div>
      <p className="mt-4 flex items-center gap-1 text-xs text-muted-foreground">Total Balance <Eye className="h-3 w-3" /></p>
      <p className="text-2xl font-extrabold">$12,480.21</p>
      <p className="text-xs font-semibold"><Change v={4.32} /> (24h)</p>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {[[Plus, "Buy"], [Minus, "Sell"], [Send, "Send"], [Download, "Receive"]].map(([I, l]: any) => (
          <div key={l} className="flex flex-col items-center gap-1 rounded-xl border p-2 text-[10px] font-medium"><I className="h-4 w-4 text-primary" />{l}</div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between rounded-xl bg-gradient-primary p-3 text-primary-foreground">
        <div><p className="text-sm font-bold">Earn up to 8% APY</p><p className="text-[11px] opacity-80">on your crypto</p></div>
        <Coins className="h-7 w-7" />
      </div>
      <div className="mt-3 flex justify-between text-xs font-bold"><span>My Assets</span><span className="text-primary">See All</span></div>
      {COINS.slice(0, 3).map((c) => (
        <div key={c.sym} className="mt-2 flex items-center gap-2 text-xs">
          <CoinIcon coin={c} size="h-6 w-6 text-xs" />
          <span className="font-semibold">{c.name}</span><span className="text-[10px] text-muted-foreground">{c.sym}</span>
          <span className="ml-auto text-right font-bold">{marketPriceText(quotes, c.sym, c.price)}<br /><span className="text-[10px] text-muted-foreground">USD</span></span>
        </div>
      ))}
      <div className="mt-3 flex justify-around border-t pt-2 text-[10px] text-muted-foreground">
        <Home className="h-4 w-4 text-primary" /><Repeat className="h-4 w-4" /><Wallet className="h-4 w-4" /><User className="h-4 w-4" />
      </div>
    </div>
  );
}

const MENU = [
  { href: "#markets", label: "Markets", icon: BarChart3 },
  { href: "#services", label: "Services", icon: Wallet },
  { href: "#why", label: "Why Basecola", icon: ShieldCheck },
] as const;
const FEATURE_LINKS = [
  { label: "Buy & sell crypto", icon: ArrowLeftRight, href: "/buy" },
  { label: "Send & receive", icon: Send, href: "/receive" },
  { label: "Fund your wallet", icon: Wallet, href: "/fund-wallet" },
  { label: "Referral rewards", icon: Gift, href: "/referral" },
] as const;

function MobileMenu() {
  return <Sheet>
    <SheetTrigger aria-label="Open menu" className="md:hidden"><Menu className="h-6 w-6" /></SheetTrigger>
    <SheetContent side="right" className="flex w-80 flex-col gap-6">
      <SheetTitle className="sr-only">Menu</SheetTitle>
      <Logo />
      <nav className="space-y-1">{MENU.map(m => <a key={m.href} href={m.href} className="flex items-center gap-3 rounded-xl px-3 py-3 font-semibold hover:bg-accent"><m.icon className="h-5 w-5 text-primary" />{m.label}</a>)}</nav>
      <div><p className="px-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">Features</p>
        <ul className="mt-2 space-y-1">{FEATURE_LINKS.map(f => <li key={f.label}><Link to={f.href} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-accent"><f.icon className="h-4 w-4 text-primary" />{f.label}</Link></li>)}</ul></div>
      <div className="mt-auto space-y-3">
        <Link to="/login" className="flex w-full items-center justify-center gap-2 rounded-2xl border border-primary py-3 font-semibold text-primary"><LogIn className="h-4 w-4" />Log In</Link>
        <Link to="/signup" className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3 font-semibold text-primary-foreground"><UserPlus className="h-4 w-4" />Sign Up</Link>
      </div>
    </SheetContent>
  </Sheet>;
}

function Index() {
  const { data: quotes } = useAlchemyMarketPrices();
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Logo />
        <nav className="hidden gap-8 text-sm font-medium text-muted-foreground md:flex">
          <a href="#markets">Markets</a><a href="#services">Services</a><a href="#why">Why Basecola</a>
        </nav>
        <div className="flex items-center gap-4">
          <Link to="/login" className="hidden text-sm font-semibold text-primary md:block">Log In</Link>
          <Link to="/signup" className="hidden rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground md:block">Sign Up</Link>
          <Bell className="h-6 w-6 md:hidden" /><MobileMenu />
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-60 top-[520px] md:top-40 h-[600px] w-[900px] -rotate-12 rounded-[50%] bg-gradient-wave" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 pb-16 pt-4 md:grid-cols-2">
          <div className="text-center md:text-left">
            <span className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-1.5 text-sm font-semibold"><ShieldCheck className="h-4 w-4 text-primary" />Crypto tools, with clarity</span>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight md:text-6xl">Buy, sell, and manage crypto with <span className="text-primary">Basecola</span></h1>
            <p className="mt-4 text-lg text-muted-foreground">Explore crypto markets, account tools, and guided buy and sell experiences—all in one place. Clear information helps you understand each step.</p>
            <Link to="/signup" className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-primary px-10 py-4 font-semibold text-primary-foreground shadow-soft">Get Started <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <PhoneMock quotes={quotes} />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5">
        <div className="grid grid-cols-4 divide-x py-8">
          {features.map(({ icon: I, t }) => (
            <div key={t} className="flex flex-col items-center gap-2 px-2 text-center text-sm font-semibold"><I className="h-8 w-8 text-primary" />{t}</div>
          ))}
        </div>
        <div id="markets" className="mb-3 flex items-center justify-between"><h2 className="text-xl font-extrabold">Crypto market</h2><MarketFeedLabel quotes={quotes} /></div>
        <div className="rounded-3xl border bg-card p-2 shadow-soft">
          {COINS.map((c) => (
            <div key={c.sym} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-3 py-3 text-sm">
              <CoinIcon coin={c} size="h-8 w-8" />
              <span className="font-semibold">{c.name}</span>
              <span className="text-right"><span className="block font-bold">{marketPriceText(quotes, c.sym, c.price)}</span><span className="text-xs text-muted-foreground">{c.sym} · USD</span></span>
            </div>
          ))}
        </div>
      </section>

      <section id="services" className="mx-auto max-w-6xl scroll-mt-8 px-5 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold uppercase tracking-wider text-primary">Explore Basecola</p>
          <h2 className="mt-2 text-3xl font-extrabold md:text-4xl">Tools for your crypto journey</h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">Explore the services available in the Basecola experience. Some actions use demonstration data or are not connected to a live financial service.</p>
        </div>
        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map(({ icon: Icon, title, description, label, href, status }) => (
            <a key={title} href={href} className="group flex h-full flex-col rounded-3xl border bg-card p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <div className="flex items-center justify-between gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent text-primary"><Icon className="h-6 w-6" aria-hidden="true" /></span>
                <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">{status}</span>
              </div>
              <h3 className="mt-4 text-lg font-bold">{title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-primary">{label}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
            </a>
          ))}
        </div>
      </section>

      <section id="why" className="mx-auto max-w-6xl px-5 py-16 text-center">
        <h2 className="text-3xl font-extrabold md:text-4xl">Why choose <span className="text-primary">Basecola</span>?</h2>
        <p className="mt-2 text-muted-foreground">A clear starting point for exploring crypto and account tools.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {[
            { icon: ShieldCheck, title: "Security controls", description: "Find account protection settings and guidance in one place." },
            { icon: BarChart3, title: "Market context", description: "Review asset and price information while remembering that quotes can change." },
            { icon: Layers, title: "Connected experiences", description: "Move between assets, wallet tools, and support from a consistent interface." },
            { icon: CircleHelp, title: "Helpful guidance", description: "Get clear explanations of preview features, transaction steps, and important risks." },
          ].map(({ icon: I, title, description }) => (
            <div key={title} className="flex items-start gap-4 rounded-2xl border bg-card p-5 text-left">
              <I className="h-8 w-8 shrink-0 text-primary" /><div><h3 className="font-bold">{title}</h3><p className="text-sm text-muted-foreground">{description}</p></div>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-4 rounded-3xl bg-gradient-primary p-8 text-left text-primary-foreground sm:flex-row">
          <h3 className="text-2xl font-bold">Start your crypto journey<br />with Basecola today.</h3>
          <div className="flex items-center gap-4">
            <img src={coins} alt="" loading="lazy" width={1024} height={768} className="hidden w-32 sm:block" />
            <Link to="/signup" className="inline-flex items-center gap-2 rounded-xl bg-card px-6 py-3 font-semibold text-primary">Get Started <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>

      <footer className="bg-navy text-navy-foreground">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 md:grid-cols-4">
          <div><Logo tone="light" /><p className="mt-3 text-sm opacity-70">A secure and easy way to buy, sell, trade, and store cryptocurrency worldwide.</p></div>
          {MARKETING_NAV.map((group) => (
            <div key={group.category}>
              <p className="font-bold">{group.category}</p>
              <ul className="mt-3 space-y-2 text-sm opacity-70">
                {group.items.map((item) => (
                  <li key={item.slug}><a className="transition hover:opacity-100" href={marketingPagePath(group.category, item.slug)}>{item.label}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mx-auto flex max-w-6xl justify-between border-t border-navy-foreground/15 px-5 py-5 text-xs opacity-70"><span>© 2026 Basecola. All rights reserved.</span><span>Privacy Policy | Terms of Service</span></div>
      </footer>
    </div>
  );
}
