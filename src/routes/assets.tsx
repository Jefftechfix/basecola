import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, Wallet } from "lucide-react";
import { AccountShell } from "@/components/account-shell";
import { Button } from "@/components/ui/button";
import { money } from "@/lib/account-demo";
import coins from "@/assets/coins.png";

export const Route = createFileRoute("/assets")({
  head: () => ({ meta: [
    { title: "My Assets — Basecola" },
    { name: "description", content: "View your Basecola cryptocurrency holdings and portfolio balances." },
    { property: "og:title", content: "My Assets — Basecola" },
    { property: "og:description", content: "Your cryptocurrency holdings and portfolio overview on Basecola." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: AssetsPage,
});

function AssetsPage() {
  const [hidden, setHidden] = useState(false);
  return <AccountShell active="/assets" title="My Assets">
    <section aria-label="Portfolio balance" className="relative overflow-hidden rounded-2xl bg-gradient-primary px-5 py-6 text-primary-foreground shadow-soft sm:px-7">
      <img src={coins} alt="" className="pointer-events-none absolute right-3 top-4 hidden w-32 rounded-lg sm:block" />
      <div className="relative sm:pr-36">
        <div className="flex items-center gap-2 text-sm">Total Asset Balance<Button variant="ghost" size="icon" className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground" aria-label={hidden ? "Show balances" : "Hide balances"} onClick={() => setHidden(!hidden)}>{hidden ? <EyeOff /> : <Eye />}</Button></div>
        <p className="mt-2 text-4xl font-extrabold">{hidden ? "••••••" : money(0)}</p>
        <p className="mt-2 text-sm text-primary-foreground/80">USD portfolio value</p>
      </div>
    </section>
    <div className="mb-4 mt-8 flex items-center justify-between"><h2 className="text-xl font-bold">Your holdings</h2><span className="text-sm text-muted-foreground">0 assets</span></div>
    <div className="py-12 text-center"><Wallet className="mx-auto mb-3 h-8 w-8 text-muted-foreground" /><p className="font-semibold">No assets in this account yet</p></div>
  </AccountShell>;
}