"use client";

import { ArrowRight, ArrowLeftRight, BarChart3, Bell, ChartNoAxesCombined, CircleHelp, Coins, Download, Eye, Gift, Home, Layers, Menu, Minus, Plus, Repeat, Send, ShieldCheck, User, Wallet, WalletCards } from "lucide-react";
import { Logo, COINS, CoinIcon, Change } from "@/components/brand";
import coins from "@/assets/coins.png";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { LogIn, UserPlus } from "lucide-react";
import { MarketFeedLabel, marketPriceText, useAlchemyMarketPrices } from "@/components/market-prices";
import { MARKETING_NAV, marketingPagePath } from "@/lib/marketing-pages";
import { getImageSource } from "@/lib/image-source";

const features = [
  { icon: ShieldCheck, t: "Account security tools" },
  { icon: ChartNoAxesCombined, t: "Market information" },
  { icon: WalletCards, t: "Wallet overview" },
  { icon: Layers, t: "Crypto asset discovery" },
];
const services = [
  { icon: ArrowLeftRight, title: "Buy & sell", description: "Explore a guided flow for choosing an asset, entering an amount, and reviewing the order details.", label: "Explore Buy & Sell", href: "/products/buy-sell", status: "Preview flow", tone: "violet" },
  { icon: ChartNoAxesCombined, title: "Markets & assets", description: "Browse supported assets and market information. Prices can change and are not guaranteed execution quotes.", label: "View assets", href: "/assets", status: "Market information", tone: "blue" },
  { icon: WalletCards, title: "Wallet overview", description: "See how balances and activity come together in a wallet dashboard. Preview balances are not real funds.", label: "Explore wallet", href: "/wallet", status: "Account tools", tone: "teal" },
  { icon: Download, title: "Fund your wallet", description: "Review the wallet-funding experience and its available options before taking action.", label: "Funding options", href: "/fund-wallet", status: "Review details", tone: "amber" },
] as const;
const serviceTones = {
  violet: { card: "from-violet-50 via-white to-white border-violet-100 hover:border-violet-300", icon: "bg-violet-100 text-violet-700", badge: "text-violet-700", link: "text-violet-700" },
  blue: { card: "from-sky-50 via-white to-white border-sky-100 hover:border-sky-300", icon: "bg-sky-100 text-sky-700", badge: "text-sky-700", link: "text-sky-700" },
  teal: { card: "from-teal-50 via-white to-white border-teal-100 hover:border-teal-300", icon: "bg-teal-100 text-teal-700", badge: "text-teal-700", link: "text-teal-700" },
  amber: { card: "from-amber-50 via-white to-white border-amber-100 hover:border-amber-300", icon: "bg-amber-100 text-amber-700", badge: "text-amber-700", link: "text-amber-700" },
} as const;
const reasons = [
  { icon: Eye, title: "Clarity at every step", description: "See what an action does and review its details before continuing.", tone: "violet" },
  { icon: WalletCards, title: "Your tools, connected", description: "Explore assets, wallet tools, and account activity in one experience.", tone: "blue" },
  { icon: ChartNoAxesCombined, title: "Useful market context", description: "Browse crypto assets with a clear reminder that prices can change.", tone: "teal" },
  { icon: ShieldCheck, title: "Security in focus", description: "Find account protection settings and practical safety guidance.", tone: "amber" },
] as const;
const reasonTones = {
  violet: { card: "border-violet-100 bg-linear-to-br from-violet-50/80 to-white hover:border-violet-200", icon: "bg-violet-100 text-violet-700" },
  blue: { card: "border-sky-100 bg-linear-to-br from-sky-50/80 to-white hover:border-sky-200", icon: "bg-sky-100 text-sky-700" },
  teal: { card: "border-teal-100 bg-linear-to-br from-teal-50/80 to-white hover:border-teal-200", icon: "bg-teal-100 text-teal-700" },
  amber: { card: "border-amber-100 bg-linear-to-br from-amber-50/80 to-white hover:border-amber-200", icon: "bg-amber-100 text-amber-700" },
} as const;

function PhoneMock({ quotes }: { quotes: ReturnType<typeof useAlchemyMarketPrices>["data"] }) {
  return (
    <div className="mx-auto w-75 rounded-[2.75rem] border-10 border-navy bg-card p-4 shadow-phone">
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
        <ul className="mt-2 space-y-1">{FEATURE_LINKS.map(f => <li key={f.label}><a href={f.href} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-accent"><f.icon className="h-4 w-4 text-primary" />{f.label}</a></li>)}</ul></div>
      <div className="mt-auto space-y-3">
        <a href="/login" className="flex w-full items-center justify-center gap-2 rounded-2xl border border-primary py-3 font-semibold text-primary"><LogIn className="h-4 w-4" />Log In</a>
        <a href="/signup" className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3 font-semibold text-primary-foreground"><UserPlus className="h-4 w-4" />Sign Up</a>
      </div>
    </SheetContent>
  </Sheet>;
}

export function LandingPage() {
  const { data: quotes } = useAlchemyMarketPrices();
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Logo />
        <nav className="hidden gap-8 text-sm font-medium text-muted-foreground md:flex">
          <a href="#markets">Markets</a><a href="#services">Services</a><a href="#why">Why Basecola</a>
        </nav>
        <div className="flex items-center gap-4">
          <a href="/login" className="hidden text-sm font-semibold text-primary md:block">Log In</a>
          <a href="/signup" className="hidden rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground md:block">Sign Up</a>
          <Bell className="h-6 w-6 md:hidden" /><MobileMenu />
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-60 top-130 md:top-40 h-150 w-225 -rotate-12 rounded-[50%] bg-gradient-wave" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 pb-16 pt-4 md:grid-cols-2">
          <div className="text-center md:text-left">
            <span className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-1.5 text-sm font-semibold"><ShieldCheck className="h-4 w-4 text-primary" />Crypto tools, with clarity</span>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight md:text-6xl">Buy, sell, and manage crypto with <span className="text-primary">Basecola</span></h1>
            <p className="mt-4 text-lg text-muted-foreground">Explore crypto markets, account tools, and guided buy and sell experiences—all in one place. Clear information helps you understand each step.</p>
            <a href="/signup" className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-primary px-10 py-4 font-semibold text-primary-foreground shadow-soft">Get Started <ArrowRight className="h-4 w-4" /></a>
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
        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {services.map(({ icon: Icon, title, description, label, href, status, tone }) => (
            <a key={title} href={href} className={`group flex h-full min-h-64 flex-col rounded-3xl border bg-linear-to-br p-5 text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${serviceTones[tone].card}`}>
              <div className="flex items-center justify-between gap-3">
                <span className={`grid h-12 w-12 place-items-center rounded-2xl shadow-sm ring-1 ring-white/80 ${serviceTones[tone].icon}`}><Icon className="h-6 w-6" aria-hidden="true" /></span>
                <span className={`rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold shadow-sm ${serviceTones[tone].badge}`}>{status}</span>
              </div>
              <h3 className="mt-4 text-lg font-bold">{title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
              <span className={`mt-5 inline-flex items-center gap-2 text-sm font-bold ${serviceTones[tone].link}`}>{label}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
            </a>
          ))}
        </div>
      </section>

      <section id="why" className="mx-auto max-w-6xl px-5 py-16 text-center">
        <p className="text-sm font-bold uppercase tracking-wider text-primary">The Basecola difference</p>
        <h2 className="mt-2 text-3xl font-extrabold md:text-4xl">Why choose <span className="text-primary">Basecola</span>?</h2>
        <p className="mt-2 text-muted-foreground">A clearer, more considered way to explore crypto tools.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {reasons.map(({ icon: I, title, description, tone }) => (
            <div key={title} className={`flex items-start gap-4 rounded-2xl border bg-card p-5 text-left transition-colors ${reasonTones[tone].card}`}>
              <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${reasonTones[tone].icon}`}><I className="h-5 w-5" /></span>
              <div><h3 className="font-bold">{title}</h3><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p></div>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-4 rounded-3xl bg-gradient-primary p-8 text-left text-primary-foreground sm:flex-row">
          <h3 className="text-2xl font-bold">Start your crypto journey<br />with Basecola today.</h3>
          <div className="flex items-center gap-4">
            <img src={getImageSource(coins)} alt="" loading="lazy" width={1024} height={768} className="hidden w-32 sm:block" />
            <a href="/signup" className="inline-flex items-center gap-2 rounded-xl bg-card px-6 py-3 font-semibold text-primary">Get Started <ArrowRight className="h-4 w-4" /></a>
          </div>
        </div>
      </section>

      <footer className="bg-navy text-navy-foreground">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 md:grid-cols-4">
          <div>
            <Logo tone="light" />
            <p className="mt-3 text-sm opacity-70">A secure and easy way to buy, sell, trade, and store cryptocurrency worldwide.</p>
            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/60">Social platforms</p>
              <ul aria-label="Basecola social media" className="mt-3 flex items-center gap-2">
                <li><SocialBrand name="Instagram" color="#FF0069" path="M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077" /></li>
                <li><SocialBrand name="Facebook" color="#0866FF" path="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z" /></li>
                <li><SocialBrand name="X" color="#FFFFFF" path="M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z" /></li>
                <li><SocialBrand name="WhatsApp" color="#25D366" path="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></li>
              </ul>
            </div>
          </div>
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
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 border-t border-navy-foreground/15 px-5 py-5 text-xs opacity-70">
          <span>© 2026 Basecola. All rights reserved.</span>
          <nav aria-label="Legal" className="flex items-center gap-4">
            <a href="/privacy-policy" className="transition hover:opacity-100">Privacy Policy</a>
            <a href="/terms-of-service" className="transition hover:opacity-100">Terms of Service</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}

function SocialBrand({ name, color, path }: { name: string; color: string; path: string }) {
  return (
    <span
      title={name}
      className="grid h-10 w-10 place-items-center rounded-full bg-white/10 ring-1 ring-white/15"
    >
      <svg
        role="img"
        aria-label={name}
        viewBox="0 0 24 24"
        className="h-4.5 w-4.5"
        fill={color}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d={path} />
      </svg>
    </span>
  );
}
