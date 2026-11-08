import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowDownToLine, BarChart3, RefreshCw, Users, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAdminDashboardSummary } from "@/lib/admin.functions";
import { ADMIN_PERIODS, type AdminPeriodId } from "@/lib/admin-dashboard-data";

type ReportTab = "overview" | "transactions" | "assets" | "users" | "revenue";

const REPORT_TABS: { id: ReportTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "transactions", label: "Transactions" },
  { id: "assets", label: "Assets" },
  { id: "users", label: "Users" },
  { id: "revenue", label: "Revenue" },
];

function csvCell(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function downloadReport(
  summary: NonNullable<ReturnType<typeof useAdminReportSummary>["data"]>,
  periodLabel: string,
) {
  const rows: (string | number)[][] = [
    ["Section", "Metric", "Count", "Period value USD", "Secondary value USD", "Status", "Date"],
    ["Report", "Generated at", "", "", "", periodLabel, new Date().toISOString()],
    ["Summary", "Transactions", summary.period.transactions, "", "", "", ""],
    ["Summary", "Completed volume", "", summary.period.volume, "", "", ""],
    ["Summary", "Fees", "", "", summary.period.fees, "", ""],
    ["Users", "Total users", summary.users.total, "", "", "", ""],
    ["Users", "Verified", summary.users.verified, "", "", "", ""],
    ["Users", "Pending verification", summary.users.pending, "", "", "", ""],
    ["Users", "Rejected verification", summary.users.rejected, "", "", "", ""],
    ["Users", "Not submitted", summary.users.notSubmitted, "", "", "", ""],
    ["Users", "Joined today", summary.users.joinedToday, "", "", "", ""],
    ...summary.period.points.map((point) => [
      "Daily activity",
      "Transactions",
      point.transactions,
      point.volume,
      "",
      "",
      point.label,
    ]),
    ...summary.period.byAsset.map((asset) => [
      "Asset",
      asset.asset,
      asset.transactions,
      asset.volume,
      asset.fees,
      "",
      "",
    ]),
    ...summary.period.byStatus.map((status) => [
      "Transaction status",
      status.status,
      status.transactions,
      "",
      "",
      status.status,
      "",
    ]),
    ...summary.revenue.byKind.map((revenue) => [
      "Revenue source",
      revenue.kind,
      "",
      revenue.period,
      revenue.lifetime,
      "",
      "",
    ]),
  ];
  const content = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `basecola-admin-report-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

function useAdminReportSummary(periodId: AdminPeriodId) {
  const loadSummary = useServerFn(getAdminDashboardSummary);
  return useQuery({
    queryKey: ["admin-dashboard-summary", periodId],
    queryFn: () => loadSummary({ data: { periodId } }),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

function Stat({ label, value, note, icon: Icon }: {
  label: string;
  value: string;
  note: string;
  icon: typeof Wallet;
}) {
  return (
    <article className="rounded-3xl bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <p className="mt-2 text-2xl font-extrabold">{value}</p>
      <p className="mt-2 text-xs text-muted-foreground">{note}</p>
    </article>
  );
}

export function AdminReportsManagement({ periodId }: { periodId: AdminPeriodId }) {
  const [tab, setTab] = useState<ReportTab>("overview");
  const summaryQuery = useAdminReportSummary(periodId);
  const summary = summaryQuery.data;
  const period = ADMIN_PERIODS.find((item) => item.id === periodId) ?? ADMIN_PERIODS[0];
  const money = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(value);

  const exportCsv = () => {
    if (summary) downloadReport(summary, period.label);
  };

  return (
    <section className="space-y-4">
      {summaryQuery.error && (
        <p role="alert" className="rounded-2xl bg-white p-4 text-sm text-destructive">
          Could not load reports: {summaryQuery.error.message}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Transaction volume"
          value={summary ? money(summary.period.volume) : "—"}
          note={summary ? `${period.label} · completed transactions` : "Loading live data…"}
          icon={Wallet}
        />
        <Stat
          label="Transactions"
          value={summary ? summary.period.transactions.toLocaleString() : "—"}
          note={summary ? period.label : "Loading live data…"}
          icon={RefreshCw}
        />
        <Stat
          label="Platform fees"
          value={summary ? money(summary.period.fees) : "—"}
          note={summary ? `${period.label} · completed transactions` : "Loading live data…"}
          icon={BarChart3}
        />
        <Stat
          label="Registered users"
          value={summary ? summary.users.total.toLocaleString() : "—"}
          note={summary ? `${summary.users.joinedToday.toLocaleString()} joined today` : "Loading live data…"}
          icon={Users}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-1 flex-wrap gap-2" role="tablist" aria-label="Admin reports">
          {REPORT_TABS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === id ? "bg-[#6d4dff] text-white" : "bg-white text-muted-foreground"}`}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => void summaryQuery.refetch()}
          disabled={summaryQuery.isFetching}
        >
          <RefreshCw className={`h-4 w-4 ${summaryQuery.isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
        <Button type="button" onClick={exportCsv} disabled={!summary}>
          <ArrowDownToLine className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {summaryQuery.isPending && (
        <p className="rounded-2xl bg-white p-5 text-sm text-muted-foreground">
          Loading live analytics…
        </p>
      )}
      {!summaryQuery.isPending && summary && (
        <>
          {(tab === "overview" || tab === "transactions") && (
            <section className="rounded-3xl bg-white p-5 shadow-sm">
              <h2 className="font-bold">Daily transaction activity · {period.label}</h2>
              <div className="mt-4 grid min-h-44 grid-cols-7 items-end gap-2 sm:grid-cols-[repeat(30,minmax(0,1fr))]">
                {summary.period.points.map((point) => {
                  const max = Math.max(...summary.period.points.map((item) => item.volume), 1);
                  const height = Math.max((point.volume / max) * 100, point.volume > 0 ? 4 : 0);
                  return (
                    <div key={point.label} className="group flex h-full flex-col justify-end gap-2">
                      <div
                        className="w-full rounded-t bg-primary"
                        style={{ height: `${height}%` }}
                        title={`${point.label}: ${money(point.volume)} · ${point.transactions} transactions`}
                        aria-label={`${point.label}: ${money(point.volume)}, ${point.transactions} transactions`}
                      />
                      <span className="truncate text-center text-[10px] text-muted-foreground">
                        {point.label}
                      </span>
                    </div>
                  );
                })}
              </div>
              {!summary.period.transactions && (
                <p className="mt-3 text-sm text-muted-foreground">No transactions in this reporting period.</p>
              )}
            </section>
          )}

          {(tab === "overview" || tab === "assets") && (
            <section className="overflow-x-auto rounded-3xl bg-white p-5 shadow-sm">
              <h2 className="font-bold">Asset activity · volume and fees include completed transactions only</h2>
              <table className="mt-3 w-full min-w-[560px] text-left text-sm">
                <thead className="text-xs text-muted-foreground">
                  <tr><th className="p-2">Asset</th><th className="p-2">Transactions</th><th className="p-2">Volume (USD)</th><th className="p-2">Fees (USD)</th></tr>
                </thead>
                <tbody>
                  {summary.period.byAsset.map((asset) => (
                    <tr key={asset.asset} className="border-t">
                      <td className="p-2 font-semibold">{asset.asset}</td>
                      <td className="p-2">{asset.transactions.toLocaleString()}</td>
                      <td className="p-2">{money(asset.volume)}</td>
                      <td className="p-2">{money(asset.fees)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!summary.period.byAsset.length && (
                <p className="py-4 text-sm text-muted-foreground">No asset activity in this reporting period.</p>
              )}
            </section>
          )}

          {(tab === "overview" || tab === "transactions") && (
            <section className="rounded-3xl bg-white p-5 shadow-sm">
              <h2 className="font-bold">Transaction statuses · {period.label}</h2>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                {summary.period.byStatus.map((status) => (
                  <li key={status.status} className="flex items-center justify-between rounded-xl bg-muted/50 p-3 text-sm">
                    <span className="capitalize">{status.status}</span>
                    <span className="font-bold">{status.transactions.toLocaleString()}</span>
                  </li>
                ))}
              </ul>
              {!summary.period.byStatus.length && (
                <p className="mt-3 text-sm text-muted-foreground">No transaction statuses to report.</p>
              )}
            </section>
          )}

          {(tab === "overview" || tab === "users") && (
            <section className="rounded-3xl bg-white p-5 shadow-sm">
              <h2 className="font-bold">User and verification totals</h2>
              <dl className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                {[
                  ["Total users", summary.users.total],
                  ["Verified", summary.users.verified],
                  ["Pending", summary.users.pending],
                  ["Rejected", summary.users.rejected],
                  ["Not submitted", summary.users.notSubmitted],
                ].map(([label, count]) => (
                  <div key={String(label)} className="rounded-xl bg-muted/50 p-3">
                    <dt className="text-xs text-muted-foreground">{label}</dt>
                    <dd className="mt-1 text-lg font-bold">{Number(count).toLocaleString()}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {(tab === "overview" || tab === "revenue") && (
            <section className="overflow-x-auto rounded-3xl bg-white p-5 shadow-sm">
              <h2 className="font-bold">Revenue by source</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Revenue amounts come from the platform revenue summary. Completed transaction fees are shown separately above.
              </p>
              <table className="mt-3 w-full min-w-[480px] text-left text-sm">
                <thead className="text-xs text-muted-foreground">
                  <tr><th className="p-2">Source</th><th className="p-2">Period revenue (USD)</th><th className="p-2">Lifetime revenue (USD)</th></tr>
                </thead>
                <tbody>
                  {summary.revenue.byKind.map((row) => (
                    <tr key={row.kind} className="border-t">
                      <td className="p-2 font-semibold capitalize">{row.kind}</td>
                      <td className="p-2">{money(row.period)}</td>
                      <td className="p-2">{money(row.lifetime)}</td>
                    </tr>
                  ))}
                  <tr className="border-t font-bold">
                    <td className="p-2">Total</td>
                    <td className="p-2">{money(summary.revenue.periodTotal)}</td>
                    <td className="p-2">{money(summary.revenue.lifetimeTotal)}</td>
                  </tr>
                </tbody>
              </table>
            </section>
          )}
        </>
      )}
      <p className="text-xs text-muted-foreground">
        Reports use live platform records and the date range selected in the admin header. Transaction volume and fees include completed transactions only.
      </p>
    </section>
  );
}
