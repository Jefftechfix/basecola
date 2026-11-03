import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowDownLeft, ArrowUpRight, Download, FileText } from "lucide-react";
import { AccountShell } from "@/components/account-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { money, statementPeriod } from "@/lib/account-demo";
import { loadAccountProfile } from "@/lib/account-profile";
import { loadWalletBalance } from "@/lib/wallet-balance";
import { supabase } from "@/integrations/supabase/client";

type StatementTransaction = {
  id: string;
  kind: string;
  direction: string;
  coin: string | null;
  crypto_amount: number | null;
  usd_amount: number;
  fee_usd: number;
  status: string;
  reference: string | null;
  created_at: string;
};

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character] ?? character,
  );
}

async function loadLogoDataUrl() {
  try {
    const response = await fetch("/logo.png");
    if (!response.ok) return "";
    const blob = await response.blob();
    return await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
      reader.onerror = () => resolve("");
      reader.readAsDataURL(blob);
    });
  } catch {
    return "";
  }
}

async function loadStatementTransactions() {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data, error } = await supabase
    .from("transactions")
    .select(
      "id, kind, direction, coin, crypto_amount, usd_amount, fee_usd, status, reference, created_at",
    )
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error) throw new Error(error.message);
  return data as StatementTransaction[];
}

export const Route = createFileRoute("/statements")({
  head: () => ({
    meta: [
      { title: "Statement of Account — Basecola" },
      { name: "description", content: "Review and download your Basecola statement of account." },
      { property: "og:title", content: "Statement of Account — Basecola" },
      { property: "og:description", content: "Download your Basecola account statement." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: StatementsPage,
});

function StatementsPage() {
  const { data: profile } = useQuery({
    queryKey: ["account-profile"],
    queryFn: loadAccountProfile,
  });
  const { data: balance } = useQuery({ queryKey: ["wallet-balance"], queryFn: loadWalletBalance });
  const {
    data: transactions,
    isPending,
    error,
  } = useQuery({
    queryKey: ["statement-transactions"],
    queryFn: loadStatementTransactions,
  });
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [notice, setNotice] = useState("");
  const [downloading, setDownloading] = useState(false);
  const period = statementPeriod(from, to);
  const rangeError =
    from || to
      ? !period
        ? "Choose a start date and an end date."
        : from > to
          ? "Choose an end date on or after the start date."
          : ""
      : "";
  const holder = profile?.name || "Account holder";
  const email = profile?.email || "";
  const total = balance?.total ?? 0;
  const fromTime = from ? new Date(`${from}T00:00:00`).getTime() : Number.NEGATIVE_INFINITY;
  const toTime = to ? new Date(`${to}T23:59:59.999`).getTime() : Number.POSITIVE_INFINITY;
  const rows = (transactions ?? []).filter((item) => {
    const time = new Date(item.created_at).getTime();
    return time >= fromTime && time <= toTime;
  });
  const incoming = rows
    .filter((item) => item.direction === "credit")
    .reduce((sum, item) => sum + Number(item.usd_amount), 0);
  const outgoing = rows
    .filter((item) => item.direction === "debit")
    .reduce((sum, item) => sum + Number(item.usd_amount), 0);
  const fees = rows.reduce((sum, item) => sum + Number(item.fee_usd), 0);
  const generated = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date());

  async function downloadStatement() {
    if (rangeError || isPending || error || transactions === null || downloading) return;
    setDownloading(true);
    setNotice("");
    const logo = await loadLogoDataUrl();
    const tableRows = rows
      .map((item) => {
        const description = `${item.kind.charAt(0).toUpperCase()}${item.kind.slice(1)}${item.coin ? ` ${item.coin}` : ""}`;
        const amount =
          item.crypto_amount != null
            ? `${item.crypto_amount} ${item.coin ?? ""}`.trim()
            : money(Number(item.usd_amount));
        return `<tr><td>${escapeHtml(new Date(item.created_at).toLocaleString())}</td><td>${escapeHtml(description)}${item.reference ? `<small>${escapeHtml(item.reference)}</small>` : ""}</td><td>${escapeHtml(amount)}</td><td>${escapeHtml(money(Number(item.fee_usd)))}</td><td>${escapeHtml(item.status)}</td></tr>`;
      })
      .join("");
    const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Basecola statement - ${escapeHtml(period || "All activity")}</title><style>
      :root{font-family:Arial,Helvetica,sans-serif;color:#20213a;background:#f5f5fb;font-synthesis:none}*{box-sizing:border-box}body{margin:0;padding:40px 18px}.sheet{max-width:900px;margin:0 auto;padding:52px;background:#fff;border:1px solid #e6e5f0;border-radius:12px;box-shadow:0 12px 35px #25204a12}.top{display:flex;justify-content:space-between;align-items:flex-start;gap:24px;padding-bottom:24px;border-bottom:1px solid #e7e6ef}.brand{display:flex;align-items:center;gap:14px}.brand img{width:auto;height:56px;object-fit:contain}.kicker{color:#77758d;font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase}.period{text-align:right}.period strong{display:block;margin-top:8px}.client{display:flex;justify-content:space-between;gap:24px;padding:24px 0;border-bottom:1px solid #e7e6ef}.client h1{margin:8px 0 4px;font-size:22px}.balance{text-align:right}.balance strong{display:block;margin-top:8px;color:#6045d8;font-size:24px}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;padding:22px 0;border-bottom:1px solid #e7e6ef}.stats span{display:block;color:#77758d;font-size:12px}.stats strong{display:block;margin-top:6px;font-size:16px}.section-title{margin:26px 0 12px}.section-title h2{margin:5px 0;font-size:18px}table{width:100%;border-collapse:collapse;font-size:13px}th{text-align:left;color:#77758d;background:#f5f4fa;font-size:11px;text-transform:uppercase;letter-spacing:.5px}th,td{padding:12px 10px;border-bottom:1px solid #e9e8ef}td small{display:block;margin-top:4px;color:#77758d}.empty{text-align:center;color:#77758d;padding:30px}footer{margin-top:30px;padding-top:16px;border-top:1px solid #e7e6ef;color:#77758d;font-size:11px;line-height:1.6}footer strong{display:block;margin-top:14px;color:#20213a}@media(max-width:640px){body{padding:12px}.sheet{padding:24px 16px}.top,.client{flex-direction:column}.period,.balance{text-align:left}.stats{grid-template-columns:repeat(2,1fr);gap:16px}table{font-size:11px}th,td{padding:9px 5px}}@media print{body{padding:0;background:#fff}.sheet{max-width:none;padding:26px;border:0;border-radius:0;box-shadow:none}@page{size:A4;margin:14mm}}
      </style></head><body><main class="sheet"><header class="top"><div class="brand">${logo ? `<img src="${logo}" alt="Basecola">` : "<strong style='font-size:25px;color:#6045d8'>Basecola</strong>"}<div><div class="kicker">Account services</div><strong>Official account statement</strong></div></div><div class="period"><div class="kicker">Statement period</div><strong>${escapeHtml(period || "All activity")}</strong><small>Generated ${escapeHtml(generated)}</small></div></header><section class="client"><div><div class="kicker">Prepared for</div><h1>${escapeHtml(holder)}</h1><div>${escapeHtml(email || "No email on file")}</div></div><div class="balance"><div class="kicker">Current wallet balance</div><strong>${escapeHtml(money(total))}</strong></div></section><section class="stats"><div><span>Transactions</span><strong>${rows.length}</strong></div><div><span>Money in</span><strong>${escapeHtml(money(incoming))}</strong></div><div><span>Money out</span><strong>${escapeHtml(money(outgoing))}</strong></div><div><span>Fees</span><strong>${escapeHtml(money(fees))}</strong></div></section><section><div class="section-title"><div class="kicker">Account activity</div><h2>Transaction history</h2></div><table><thead><tr><th>Date</th><th>Description</th><th>Amount</th><th>Fee</th><th>Status</th></tr></thead><tbody>${tableRows || `<tr><td class="empty" colspan="5">No transactions in this statement period.</td></tr>`}</tbody></table></section><footer>This statement summarizes activity recorded in your Basecola account for the period shown. Amounts and balances are displayed in USD unless noted.<strong>Basecola · Statement of account · ${escapeHtml(generated)}</strong></footer></main></body></html>`;
    const file = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = `basecola-statement-${from || "all"}-to-${to || "all"}.html`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setDownloading(false);
    setNotice("Branded statement downloaded. Open it in a browser to print or save as PDF.");
  }

  function printStatement() {
    if (rangeError || isPending || error || transactions === null) return;
    setNotice("Choose Save as PDF or a printer in your browser’s print dialog.");
    window.setTimeout(() => window.print(), 50);
  }

  return (
    <AccountShell active="/profile" title="Statements" className="statement-page">
      <div className="statement-controls">
        <Button asChild variant="link" className="mb-4 h-auto px-0">
          <Link to="/profile">
            <ArrowLeft />
            Back to profile
          </Link>
        </Button>
        <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-accent text-primary">
              <FileText className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-bold">Create a statement</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Choose a period, review your activity, then save or print as PDF.
              </p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="statement-from">From</Label>
              <Input
                id="statement-from"
                type="date"
                value={from}
                max={to || undefined}
                onChange={(event) => {
                  setFrom(event.target.value);
                  setNotice("");
                }}
                className="h-11 bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="statement-to">To</Label>
              <Input
                id="statement-to"
                type="date"
                value={to}
                min={from || undefined}
                onChange={(event) => {
                  setTo(event.target.value);
                  setNotice("");
                }}
                className="h-11 bg-background"
              />
            </div>
          </div>
          {rangeError && (
            <p role="alert" className="mt-3 text-sm text-destructive">
              {rangeError}
            </p>
          )}
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              className="h-11 flex-1"
              onClick={printStatement}
              disabled={!!rangeError || isPending || !!error || transactions === null}
            >
              <Download />
              Download statement PDF
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-11 flex-1"
              onClick={downloadStatement}
              disabled={
                !!rangeError || isPending || !!error || transactions === null || downloading
              }
            >
              <FileText />
              {downloading ? "Preparing copy…" : "Download HTML copy"}
            </Button>
          </div>
          {notice && (
            <p role="status" className="mt-3 text-sm text-muted-foreground">
              {notice}
            </p>
          )}
        </section>
      </div>

      <div className="statement-preview mt-6 rounded-xl border bg-card px-5 py-6 shadow-sm sm:px-8 sm:py-8">
        <header className="flex flex-wrap items-start justify-between gap-5 border-b pb-6">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Basecola" className="h-12 w-auto object-contain" />
            <div className="border-l pl-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Account services
              </p>
              <p className="mt-1 text-sm font-bold">Official account statement</p>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Statement period
            </p>
            <p className="mt-1 font-bold">{period || "All activity"}</p>
            <p className="mt-1 text-xs text-muted-foreground">Generated {generated}</p>
          </div>
        </header>

        <section className="grid gap-5 border-b py-6 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Prepared for
            </p>
            <h2 className="mt-1 text-xl font-extrabold">{holder}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{email || "No email on file"}</p>
          </div>
          <div className="sm:text-right">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Current wallet balance
            </p>
            <p className="mt-1 text-2xl font-extrabold text-primary">{money(total)}</p>
          </div>
        </section>

        <section
          aria-label="Statement totals"
          className="grid grid-cols-2 gap-3 border-b py-5 sm:grid-cols-4"
        >
          <Summary label="Transactions" value={String(rows.length)} />
          <Summary label="Money in" value={money(incoming)} tone="success" />
          <Summary label="Money out" value={money(outgoing)} tone="primary" />
          <Summary label="Fees" value={money(fees)} />
        </section>

        <section className="pt-6">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Account activity
              </p>
              <h3 className="mt-1 text-lg font-bold">Transaction history</h3>
            </div>
            <span className="text-sm text-muted-foreground">
              {rows.length} {rows.length === 1 ? "entry" : "entries"}
            </span>
          </div>
          {isPending ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Loading account activity…
            </p>
          ) : error ? (
            <p role="alert" className="py-8 text-center text-sm text-destructive">
              {error.message}
            </p>
          ) : transactions === null ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Log in to generate your statement.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-155 border-collapse text-left text-sm">
                <thead>
                  <tr className="border-y bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                    {["Date", "Description", "Amount", "Fee", "Status"].map((heading) => (
                      <th key={heading} className="px-3 py-3 font-semibold first:pl-2 last:pr-2">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {rows.map((item) => {
                    const credit = item.direction === "credit";
                    const title = `${item.kind.charAt(0).toUpperCase()}${item.kind.slice(1)}${item.coin ? ` ${item.coin}` : ""}`;
                    return (
                      <tr key={item.id}>
                        <td className="whitespace-nowrap px-3 py-3.5 pl-2 text-muted-foreground">
                          {new Date(item.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-3 py-3.5">
                          <span className="flex items-center gap-2 font-semibold">
                            <span
                              className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${credit ? "bg-green-soft text-success" : "bg-pink-soft text-pink"}`}
                            >
                              {credit ? (
                                <ArrowDownLeft className="h-4 w-4" />
                              ) : (
                                <ArrowUpRight className="h-4 w-4" />
                              )}
                            </span>
                            {title}
                          </span>
                          {item.reference && (
                            <span className="mt-1 block pl-9 text-xs text-muted-foreground">
                              {item.reference}
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3.5 font-semibold">
                          {item.crypto_amount != null
                            ? `${item.crypto_amount} ${item.coin ?? ""}`
                            : money(Number(item.usd_amount))}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3.5 text-muted-foreground">
                          {money(Number(item.fee_usd))}
                        </td>
                        <td className="px-3 py-3.5 pr-2">
                          <span className="inline-flex rounded-full bg-accent px-2.5 py-1 text-xs font-semibold capitalize text-accent-foreground">
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {rows.length === 0 && (
                <p className="border-b py-10 text-center text-sm text-muted-foreground">
                  No transactions in this statement period.
                </p>
              )}
            </div>
          )}
        </section>

        <footer className="mt-7 border-t pt-4 text-xs leading-relaxed text-muted-foreground">
          <p>
            This statement summarizes activity recorded in your Basecola account for the period
            shown. Amounts and balances are displayed in USD unless noted.
          </p>
          <p className="mt-2">
            For questions about an entry, contact Basecola support and include the transaction
            reference.
          </p>
          <p className="mt-4 font-semibold text-foreground">
            Basecola · Statement of account · {generated}
          </p>
        </footer>
      </div>
    </AccountShell>
  );
}

function Summary({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "success" | "primary";
}) {
  const valueColor =
    tone === "success" ? "text-success" : tone === "primary" ? "text-primary" : "text-foreground";
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className={`mt-1 truncate text-base font-bold ${valueColor}`}>{value}</p>
    </div>
  );
}
