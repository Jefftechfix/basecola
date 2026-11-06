import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Eye, EyeOff, PlusCircle, Download, ArrowUp, ArrowRight, Bitcoin, RefreshCw, BarChart3, Copy, Check } from "lucide-react";
import { Logo, COINS, CoinIcon, Change } from "@/components/brand";
import { NotificationBell } from "@/components/notification-bell";
import coins from "@/assets/coins.png";
import { AccountNav } from "@/components/account-shell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { accountFirstName, accountInitials, loadAccountProfile } from "@/lib/account-profile";
import { money } from "@/lib/account-demo";
import { loadWalletBalance } from "@/lib/wallet-balance";
import { ASSET_NAMES, CRYPTO_ASSETS, CRYPTO_NETWORKS } from "@/lib/crypto/networks";
import { ensureCustomerCryptoWallets } from "@/lib/crypto-provisioning.functions";

export const Route = createFileRoute("/dashboard")({
  ssr: false,
  beforeLoad: async () => {
    if (typeof document === "undefined") return;
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/login", replace: true });
  },
  pendingComponent: CheckingAccount,
  pendingMs: 0,
  head: () => ({
    meta: [
      { title: "Dashboard — Basecola" },
      { name: "description", content: "Your Basecola balance, quick actions, and live market overview." },
      { property: "og:title", content: "Dashboard — Basecola" },
      { property: "og:description", content: "Your Basecola crypto dashboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

function CheckingAccount() {
  return <p className="grid min-h-screen place-items-center text-sm text-muted-foreground">Checking your account</p>;
}

function Spark({ up, seed }: { up: boolean; seed: number }) {
  const pts = Array.from({ length: 12 }, (_, i) => {
    const y = 20 + Math.sin(i * 1.3 + seed) * 6 + (up ? -i * 1.4 : i * 0.6);
    return `${i * 8},${y}`;
  }).join(" ");
  return <svg viewBox="0 0 88 40" className={`h-8 w-24 ${up ? "text-success" : "text-destructive"}`}><polyline points={pts} fill="none" stroke="currentColor" strokeWidth="2" /></svg>;
}

function Dashboard() {
  const nav = useNavigate();
  const [hide, setHide] = useState(false);
  const [copyStatus, setCopyStatus] = useState<{ asset: string; copied: boolean } | null>(null);
  const { data: profile, isPending, isError, error: profileError } = useQuery({ queryKey: ["account-profile"], queryFn: loadAccountProfile });
  const { data: balance, isPending: balancePending, error: balanceError } = useQuery({ queryKey: ["wallet-balance"], queryFn: loadWalletBalance });
  const provisionWallets = useServerFn(ensureCustomerCryptoWallets);
  const { data: cryptoWallets, isPending: cryptoWalletsPending, error: cryptoWalletsError } = useQuery({
    queryKey: ["crypto-wallets"],
    queryFn: () => provisionWallets(),
  });
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") nav({ to: "/login", replace: true });
    });
    return () => subscription.unsubscribe();
  }, [nav]);
  useEffect(() => {
    if (!isPending && !isError && !profile) nav({ to: "/login", replace: true });
  }, [isError, isPending, nav, profile]);
  if (isError) return <p role="alert" className="grid min-h-screen place-items-center px-6 text-center text-sm text-destructive">{profileError.message}</p>;
  if (isPending || !profile) return <CheckingAccount />;
  const greeting = accountFirstName(profile);
  const initials = accountInitials(profile);
  const dayChange = balance?.dayChange ?? 0;
  const actions = [
    { i: Bitcoin, t: "Buy", d: "Buy crypto instantly", bg: "bg-accent", c: "text-primary", to: "/buy" },
    { i: RefreshCw, t: "Sell", d: "Sell crypto to cash", bg: "bg-pink-soft", c: "text-pink", to: "/sell" },
    { i: BarChart3, t: "Invest", d: "Grow your crypto", bg: "bg-green-soft", c: "text-success" },
  ] as const;
  return (
    <div className="min-h-screen pb-28">
      <div className="mx-auto max-w-3xl px-5 pt-5">
        <div className="flex items-center justify-between"><Logo /><NotificationBell /></div>
        <div className="mt-5 flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-accent font-bold text-primary">{initials}</span>
          <div>
            <p className="text-xl font-bold">Hello, {greeting}</p>
          </div>
        </div>

        <div className="relative mt-5 overflow-hidden rounded-3xl bg-gradient-primary p-6 text-primary-foreground shadow-soft">
          <img src={coins} alt="" width={1024} height={768} className="absolute -right-6 -top-6 w-28 opacity-90 sm:w-48" />
          <p className="flex items-center gap-2 text-sm opacity-90">Wallet balance <button onClick={() => setHide(!hide)} aria-label="Toggle balance">{hide ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></p>
          <p className="mt-1 text-4xl font-extrabold">{hide ? "••••••" : balancePending ? "…" : money(balance?.total ?? 0)}</p>
          <p className={`mt-1 font-semibold ${dayChange < 0 ? "text-destructive" : "text-success"}`}>{balanceError ? balanceError.message : balancePending || balance == null ? "Loading balance" : `${dayChange > 0 ? "▲" : dayChange < 0 ? "▼" : ""} ${money(Math.abs(dayChange))} (24h)`}</p>
          <div className="relative mt-5 grid grid-cols-3 gap-2 text-sm font-semibold">
            <Button asChild variant="secondary" className="h-12 gap-1.5 rounded-lg bg-card px-2 text-foreground"><Link to="/fund-wallet"><PlusCircle className="text-primary" />Fund</Link></Button>
            <Button asChild variant="ghost" className="h-12 gap-1.5 rounded-lg bg-primary-foreground/25 px-2 text-primary-foreground hover:bg-primary-foreground/35 hover:text-primary-foreground"><Link to="/receive"><Download />Receive</Link></Button>
            <Button asChild variant="ghost" className="h-12 gap-1.5 rounded-lg bg-primary-foreground/25 px-2 text-primary-foreground hover:bg-primary-foreground/35 hover:text-primary-foreground"><Link to="/send"><ArrowUp />Send</Link></Button>
          </div>
        </div>

        <Head t="Quick Actions" l="View All" />
        <div className="grid grid-cols-3 gap-3">
          {actions.map(action => {
            const body = <><span className="flex items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-full bg-card"><action.i className={`h-5 w-5 ${action.c}`} /></span><b>{action.t}</b></span><p className="mt-2 text-xs text-muted-foreground">{action.d}</p></>;
            return "to" in action ? <Link key={action.t} to={action.to} className={`${action.bg} rounded-2xl p-3 text-left`}>{body}</Link> : <button key={action.t} className={`${action.bg} rounded-2xl p-3 text-left`}>{body}</button>;
          })}
        </div>

        <section className="mt-7 rounded-2xl border bg-card p-4">
          <h2 className="text-xl font-extrabold">Crypto deposit wallets</h2>
          <p className="mt-1 text-sm text-muted-foreground">Send only the listed asset on its matching network.</p>
          {cryptoWalletsPending && <p className="mt-4 text-sm text-muted-foreground">Checking wallet setup…</p>}
          {cryptoWalletsError && <p role="alert" className="mt-4 text-sm text-destructive">{cryptoWalletsError.message}</p>}
          {!cryptoWalletsPending && !cryptoWalletsError && (
            <div className="mt-3 divide-y">
              {CRYPTO_ASSETS.map((asset) => {
                const wallet = cryptoWallets?.find((item) => item.network === CRYPTO_NETWORKS[asset]);
                const address = wallet?.status === "active" ? wallet.address : null;
                const active = Boolean(address);
                return (
                  <div key={asset} className="py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold">{ASSET_NAMES[asset]} ({asset})</p>
                        <p className="text-xs text-muted-foreground">{CRYPTO_NETWORKS[asset]}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {active ? "Ready" : wallet?.status === "monitoring_not_ready" ? "Unavailable" : "Setup pending"}
                      </span>
                    </div>
                    {active && address && (
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          readOnly
                          value={address}
                          aria-label={`${asset} deposit address`}
                          onFocus={(event) => event.currentTarget.select()}
                          className="min-w-0 flex-1 rounded-lg bg-muted px-2 py-2 font-mono text-xs"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          aria-label={`Copy ${asset} deposit address`}
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(address);
                              setCopyStatus({ asset, copied: true });
                            } catch {
                              setCopyStatus({ asset, copied: false });
                            }
                          }}
                        >
                          {copyStatus?.asset === asset && copyStatus.copied ? <Check /> : <Copy />}
                        </Button>
                      </div>
                    )}
                    {asset === "XRP" && wallet?.destination_tag !== null && wallet?.destination_tag !== undefined && (
                      <p className="mt-2 text-xs">Destination tag: <code>{wallet.destination_tag}</code></p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {copyStatus && (
            <p role="status" className="mt-2 text-xs text-muted-foreground">
              {copyStatus.copied
                ? `${copyStatus.asset} address copied.`
                : `Copy unavailable. Focus and select the ${copyStatus.asset} address to copy it manually.`}
            </p>
          )}
          <p className="mt-3 text-xs text-muted-foreground">ETH and ERC-20 USDT use the same Ethereum address. The demo Receive screen remains separate from live deposit addresses.</p>
          <Button asChild variant="outline" className="mt-4 w-full">
            <Link to="/crypto-withdrawal">Request crypto withdrawal</Link>
          </Button>
        </section>

        <Head t="Market" l="See All" />
        <div className="divide-y rounded-2xl border bg-card px-4">
          {COINS.map((c, i) => (
            <div key={c.sym} className="flex items-center gap-3 py-3">
              <CoinIcon coin={c} size="h-11 w-11 text-lg" />
              <div className="w-20"><p className="font-bold">{c.name}</p><p className="text-sm text-muted-foreground">{c.sym}</p></div>
              <div className="flex flex-1 justify-center"><Spark up={c.change > 0} seed={i} /></div>
              <div className="text-right"><p className="font-bold">{c.price}</p><p className="text-sm"><Change v={c.change} /></p></div>
            </div>
          ))}
        </div>
      </div>

      <AccountNav active="/dashboard" />
    </div>
  );
}

function Head({ t, l }: { t: string; l: string }) {
  return <div className="mb-3 mt-7 flex items-center justify-between"><h2 className="text-xl font-extrabold">{t}</h2><span className="flex items-center gap-1 text-sm font-semibold text-primary">{l}<ArrowRight className="h-4 w-4" /></span></div>;
}
