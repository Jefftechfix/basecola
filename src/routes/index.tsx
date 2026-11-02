import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Bell, Menu, ShieldCheck, Zap, Globe, Layers, BarChart3, Wallet, Eye, Plus, Minus, Send, Download, Home, Repeat, User, Coins } from "lucide-react";
import { Logo, COINS, CoinIcon, Change } from "@/components/brand";
import coins from "@/assets/coins.png";

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
  { icon: ShieldCheck, t: "Secure & Regulated" },
  { icon: Zap, t: "Fast Transactions" },
  { icon: Globe, t: "Global Access" },
  { icon: Layers, t: "Multiple Assets" },
];
const why = [
  { icon: ShieldCheck, t: "Powerful & Secure", d: "Industry-leading security to keep your assets safe." },
  { icon: BarChart3, t: "Low Fees", d: "Trade, buy, and sell crypto with competitive fees." },
  { icon: Layers, t: "Multiple Assets", d: "Access a wide range of cryptocurrencies." },
  { icon: Wallet, t: "Earn & Grow", d: "Earn rewards and grow your holdings with ease." },
];

function PhoneMock() {
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
          <span className="ml-auto text-right font-bold">{c.price}<br /><span className="text-[10px]"><Change v={c.change} /></span></span>
        </div>
      ))}
      <div className="mt-3 flex justify-around border-t pt-2 text-[10px] text-muted-foreground">
        <Home className="h-4 w-4 text-primary" /><Repeat className="h-4 w-4" /><Wallet className="h-4 w-4" /><User className="h-4 w-4" />
      </div>
    </div>
  );
}

function Index() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Logo />
        <nav className="hidden gap-8 text-sm font-medium text-muted-foreground md:flex">
          <a href="#markets">Markets</a><a href="#why">Why Basecola</a>
        </nav>
        <div className="flex items-center gap-4">
          <Link to="/login" className="hidden text-sm font-semibold text-primary md:block">Log In</Link>
          <Link to="/signup" className="hidden rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground md:block">Sign Up</Link>
          <Bell className="h-6 w-6 md:hidden" /><Menu className="h-6 w-6 md:hidden" />
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-60 top-[520px] md:top-40 h-[600px] w-[900px] -rotate-12 rounded-[50%] bg-gradient-wave" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 pb-16 pt-4 md:grid-cols-2">
          <div className="text-center md:text-left">
            <span className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-1.5 text-sm font-semibold"><ShieldCheck className="h-4 w-4 text-primary" />Trusted Crypto Platform</span>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight md:text-6xl">Buy, sell, and manage crypto with <span className="text-primary">Basecola</span></h1>
            <p className="mt-4 text-lg text-muted-foreground">A secure and easy way to buy, sell, trade, and store cryptocurrency. Join millions of users worldwide on Basecola.</p>
            <Link to="/signup" className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-primary px-10 py-4 font-semibold text-primary-foreground shadow-soft">Get Started <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <PhoneMock />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5">
        <div className="grid grid-cols-4 divide-x py-8">
          {features.map(({ icon: I, t }) => (
            <div key={t} className="flex flex-col items-center gap-2 px-2 text-center text-sm font-semibold"><I className="h-8 w-8 text-primary" />{t}</div>
          ))}
        </div>
        <div id="markets" className="rounded-3xl border bg-card p-2 shadow-soft">
          {COINS.map((c) => (
            <div key={c.sym} className="grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-3 px-3 py-3 text-sm sm:grid-cols-[auto_1fr_1fr_1fr_1fr]">
              <CoinIcon coin={c} size="h-8 w-8" />
              <span className="font-semibold">{c.name}</span>
              <span className="text-muted-foreground">{c.sym}</span>
              <span className="text-right font-bold">{c.price}</span>
              <span className="text-right font-semibold"><Change v={c.change} /></span>
            </div>
          ))}
        </div>
      </section>

      <section id="why" className="mx-auto max-w-6xl px-5 py-16 text-center">
        <h2 className="text-3xl font-extrabold md:text-4xl">Why choose <span className="text-primary">Basecola</span>?</h2>
        <p className="mt-2 text-muted-foreground">A trusted, secure, and user-friendly platform for all your crypto needs.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {why.map(({ icon: I, t, d }) => (
            <div key={t} className="flex items-start gap-4 rounded-2xl border bg-card p-5 text-left">
              <I className="h-8 w-8 shrink-0 text-primary" /><div><h3 className="font-bold">{t}</h3><p className="text-sm text-muted-foreground">{d}</p></div>
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
          {[["Company", ["About Us", "Careers", "Blog", "Press", "Contact"]], ["Products", ["Buy & Sell", "Trade", "Assets", "Earn", "Security"]], ["Support", ["Help Center", "FAQs", "Fees", "Status", "Report an Issue"]]].map(([h, ls]: any) => (
            <div key={h}><p className="font-bold">{h}</p><ul className="mt-3 space-y-2 text-sm opacity-70">{ls.map((l: string) => <li key={l}>{l}</li>)}</ul></div>
          ))}
        </div>
        <div className="mx-auto flex max-w-6xl justify-between border-t border-navy-foreground/15 px-5 py-5 text-xs opacity-70"><span>© 2026 Basecola. All rights reserved.</span><span>Privacy Policy | Terms of Service</span></div>
      </footer>
    </div>
  );
}
