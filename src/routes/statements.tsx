import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Download } from "lucide-react";
import { AccountShell } from "@/components/account-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { money, statementPeriod } from "@/lib/account-demo";
import { loadAccountProfile } from "@/lib/account-profile";
import { loadWalletBalance } from "@/lib/wallet-balance";

export const Route = createFileRoute("/statements")({
  head: () => ({ meta: [
    { title: "Statement of Account — Basecola" }, { name: "description", content: "Review and download a Basecola demo statement of account." },
    { property: "og:title", content: "Statement of Account — Basecola" }, { property: "og:description", content: "Download a sample Basecola account statement." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: StatementsPage,
});

function StatementsPage() {
  const { data: profile } = useQuery({ queryKey: ["account-profile"], queryFn: loadAccountProfile });
  const { data: balance } = useQuery({ queryKey: ["wallet-balance"], queryFn: loadWalletBalance });
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [notice, setNotice] = useState("");
  const period = statementPeriod(from, to);
  const rangeError = from || to ? !period ? "Choose a start date and an end date." : from > to ? "Choose an end date on or after the start date." : "" : "";
  const holder = profile?.name || "Your account";
  const email = profile?.email || "";
  const total = balance?.total ?? 0;

  function download() {
    if (rangeError) return;
    const file = new Blob([[
      "Basecola statement of account",
      `Account holder: ${holder}`,
      `Email: ${email || "Not signed in"}`,
      `Period: ${period || "All activity"}`,
      `Wallet balance: ${money(total)}`,
      "",
      "No activity in this account.",
    ].join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = `basecola-statement-${from || "all"}-to-${to || "all"}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    setNotice(`Statement downloaded${period ? ` for ${period}` : ""}.`);
  }

  return <AccountShell active="/profile" title="Statements">
    <Button asChild variant="link" className="mb-4 h-auto px-0"><Link to="/profile"><ArrowLeft />Back to profile</Link></Button>
    <section className="rounded-3xl bg-gradient-primary p-6 text-primary-foreground shadow-soft">
      <p className="text-sm text-primary-foreground/80">Statement of account</p>
      <p className="mt-2 text-2xl font-extrabold">{holder}</p>
      <p className="mt-1 text-sm text-primary-foreground/80">{email || "Sign in to see this account"}</p>
      <p className="mt-4 text-sm text-primary-foreground/80">Wallet balance</p>
      <p className="text-3xl font-extrabold">{money(total)}</p>
      <p className="mt-2 text-sm text-primary-foreground/80">{period || "Choose a date range"}</p>
    </section>
    <section className="mt-4 rounded-3xl bg-card p-5 shadow-soft">
      <h2 className="font-bold">Statement dates</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="statement-from">From</Label>
          <Input id="statement-from" type="date" value={from} max={to || undefined} onChange={e => { setFrom(e.target.value); setNotice(""); }} className="h-12 bg-background" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="statement-to">To</Label>
          <Input id="statement-to" type="date" value={to} min={from || undefined} onChange={e => { setTo(e.target.value); setNotice(""); }} className="h-12 bg-background" />
        </div>
      </div>
      {rangeError && <p role="alert" className="mt-3 text-sm text-destructive">{rangeError}</p>}
    </section>
    <section className="mt-4 rounded-3xl bg-card p-5 shadow-soft">
      <div className="flex items-center justify-between gap-3"><h2 className="font-bold">Activity</h2><span className="text-sm text-muted-foreground">0 items</span></div>
      <p className="py-8 text-center text-sm text-muted-foreground">{rangeError ? "Choose a valid date range to see activity." : "No activity in this account."}</p>
      <Button type="button" className="mt-4 h-12 w-full" onClick={download} disabled={!!rangeError}><Download />Download statement</Button>
      {notice && <p role="status" className="mt-3 text-sm text-muted-foreground">{notice}</p>}
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">This statement lists activity saved to the signed-in account.</p>
    </section>
  </AccountShell>;
}
