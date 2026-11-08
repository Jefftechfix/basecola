export const ADMIN_PERIODS = [
  { id: "week", label: "Last 7 days", days: 7 },
  { id: "recent", label: "Last 4 days", days: 4 },
  { id: "today", label: "Today", days: 1 },
  { id: "month", label: "Last 30 days", days: 30 },
] as const;

export type AdminPeriodId = (typeof ADMIN_PERIODS)[number]["id"];
export const ADMIN_REVENUE_KINDS = ["funding", "send", "buy", "sell"] as const;
export type AdminRevenueKind = (typeof ADMIN_REVENUE_KINDS)[number];

export type AdminPlatformRevenueRow = {
  transaction_kind: string;
  lifetime_revenue: number | string;
  period_revenue: number | string;
};

export type AdminPlatformRevenue = {
  lifetimeTotal: number;
  periodTotal: number;
  byKind: {
    kind: AdminRevenueKind;
    lifetime: number;
    period: number;
  }[];
};

export type DashboardTransaction = {
  id: string;
  user_id: string;
  kind: string;
  coin: string | null;
  crypto_amount: number | string | null;
  usd_amount: number | string;
  fee_usd: number | string;
  status: string;
  created_at: string;
};

export type AdminDashboardPoint = {
  label: string;
  volume: number;
  transactions: number;
};

export type AdminDashboardAssetBreakdown = {
  asset: string;
  transactions: number;
  volume: number;
  fees: number;
};

export type AdminDashboardStatusBreakdown = {
  status: string;
  transactions: number;
};

export type AdminDashboardRecentTransaction = {
  id: string;
  user: string;
  type: string;
  asset: string;
  amount: string;
  value: number;
  status: string;
  date: string;
};

export type AdminDashboardSummary = {
  period: {
    transactions: number;
    volume: number;
    fees: number;
    transactionChange: number | null;
    volumeChange: number | null;
    feeChange: number | null;
    points: AdminDashboardPoint[];
    byAsset: AdminDashboardAssetBreakdown[];
    byStatus: AdminDashboardStatusBreakdown[];
  };
  revenue: AdminPlatformRevenue;
  users: {
    total: number;
    verified: number;
    pending: number;
    rejected: number;
    notSubmitted: number;
    joinedToday: number;
  };
  recentTransactions: AdminDashboardRecentTransaction[];
};

function amount(value: number | string | null): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

export function summarizePlatformRevenue(
  rows: readonly AdminPlatformRevenueRow[],
): AdminPlatformRevenue {
  const expectedKinds = new Set<string>(ADMIN_REVENUE_KINDS);
  if (rows.some((row) => !expectedKinds.has(row.transaction_kind))) {
    throw new Error("Received an unsupported platform revenue source.");
  }
  const revenueByKind = new Map(rows.map((row) => [row.transaction_kind, row] as const));
  if (revenueByKind.size !== rows.length) {
    throw new Error("Received duplicate platform revenue totals.");
  }
  const byKind = ADMIN_REVENUE_KINDS.map((kind) => {
    const row = revenueByKind.get(kind);
    if (!row) throw new Error(`Missing platform revenue totals for ${kind}.`);
    const lifetime = Number(row.lifetime_revenue);
    const period = Number(row.period_revenue);
    if (!Number.isFinite(lifetime) || !Number.isFinite(period)) {
      throw new Error(`Invalid platform revenue totals for ${kind}.`);
    }
    return { kind, lifetime, period };
  });

  return {
    lifetimeTotal: byKind.reduce((total, row) => total + row.lifetime, 0),
    periodTotal: byKind.reduce((total, row) => total + row.period, 0),
    byKind,
  };
}

export function summarizeAdminUsers(
  totalUsers: number,
  latestVerificationStatuses: readonly string[],
  joinedToday: number,
) {
  const safeTotal = Number.isFinite(totalUsers) ? Math.max(0, Math.floor(totalUsers)) : 0;
  const safeJoinedToday = Number.isFinite(joinedToday) ? Math.max(0, Math.floor(joinedToday)) : 0;
  const statuses = Array.isArray(latestVerificationStatuses)
    ? latestVerificationStatuses.filter((status): status is string => typeof status === "string")
    : [];

  let remaining = safeTotal;
  const countStatus = (status: string) => statuses.filter((item) => item === status).length;
  const verified = Math.min(remaining, countStatus("approved"));
  remaining -= verified;
  const pending = Math.min(remaining, countStatus("pending"));
  remaining -= pending;
  const rejected = Math.min(remaining, countStatus("rejected"));
  remaining -= rejected;

  return {
    total: safeTotal,
    verified,
    pending,
    rejected,
    notSubmitted: remaining,
    joinedToday: safeJoinedToday,
  };
}

function metricTotals(rows: readonly DashboardTransaction[]) {
  const completed = rows.filter((row) => row.status.toLowerCase() === "completed");
  return {
    transactions: rows.length,
    volume: completed.reduce((sum, row) => sum + amount(row.usd_amount), 0),
    fees: completed.reduce((sum, row) => sum + amount(row.fee_usd), 0),
  };
}

function dayKey(value: string): string {
  return new Date(value).toISOString().slice(0, 10);
}

function dayLabel(value: string): string {
  return new Date(`${value}T00:00:00.000Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function summarizeAdminDashboard(
  transactions: readonly DashboardTransaction[],
  periodId: AdminPeriodId,
  now: Date,
  recentUserNames: ReadonlyMap<string, string>,
): AdminDashboardSummary["period"] & {
  recentTransactions: AdminDashboardRecentTransaction[];
} {
  const period = ADMIN_PERIODS.find((item) => item.id === periodId);
  if (!period) throw new Error("Unsupported admin dashboard reporting period.");

  const end = now.getTime();
  const today = new Date(now);
  today.setUTCHours(0, 0, 0, 0);
  const currentStart = today.getTime() - (period.days - 1) * 24 * 60 * 60 * 1000;
  const previousStart = currentStart - period.days * 24 * 60 * 60 * 1000;
  const inPeriod = (row: DashboardTransaction, start: number, until: number) => {
    const timestamp = Date.parse(row.created_at);
    return timestamp >= start && timestamp < until;
  };

  const currentRows = transactions.filter((row) => inPeriod(row, currentStart, end));
  const previousRows = transactions.filter((row) =>
    inPeriod(row, previousStart, currentStart),
  );
  const current = metricTotals(currentRows);
  const previous = metricTotals(previousRows);
  const pointByDay = new Map<string, AdminDashboardPoint>();
  const assetTotals = new Map<string, AdminDashboardAssetBreakdown>();
  const statusTotals = new Map<string, number>();

  for (let offset = 0; offset < period.days; offset += 1) {
    const date = new Date(currentStart + offset * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    pointByDay.set(date, { label: dayLabel(date), volume: 0, transactions: 0 });
  }

  for (const row of currentRows) {
    const point = pointByDay.get(dayKey(row.created_at));
    if (point) point.transactions += 1;
    const status = row.status.trim().toLowerCase() || "unknown";
    statusTotals.set(status, (statusTotals.get(status) ?? 0) + 1);
    const asset = row.coin?.trim().toUpperCase() || "USD";
    const assetTotal = assetTotals.get(asset) ?? {
      asset,
      transactions: 0,
      volume: 0,
      fees: 0,
    };
    assetTotal.transactions += 1;
    if (status === "completed") {
      assetTotal.volume += amount(row.usd_amount);
      assetTotal.fees += amount(row.fee_usd);
    }
    assetTotals.set(asset, assetTotal);
    if (point && status === "completed") {
      point.volume += amount(row.usd_amount);
    }
  }

  const recentTransactions = [...currentRows]
    .sort((left, right) => Date.parse(right.created_at) - Date.parse(left.created_at))
    .slice(0, 5)
    .map((row) => {
      const cryptoAmount = amount(row.crypto_amount);
      return {
        id: row.id,
        user: recentUserNames.get(row.user_id) ?? row.user_id.slice(0, 8),
        type: row.kind.charAt(0).toUpperCase() + row.kind.slice(1),
        asset: row.coin ?? "—",
        amount: row.crypto_amount == null
          ? "—"
          : `${cryptoAmount.toLocaleString("en-US", { maximumFractionDigits: 8 })} ${row.coin ?? ""}`.trim(),
        value: amount(row.usd_amount),
        status: row.status,
        date: new Date(row.created_at).toLocaleString(),
      };
    });

  return {
    ...current,
    transactionChange: percentChange(current.transactions, previous.transactions),
    volumeChange: percentChange(current.volume, previous.volume),
    feeChange: percentChange(current.fees, previous.fees),
    points: [...pointByDay.values()],
    byAsset: [...assetTotals.values()].sort((left, right) => right.volume - left.volume),
    byStatus: [...statusTotals.entries()]
      .map(([status, transactions]) => ({ status, transactions }))
      .sort((left, right) => right.transactions - left.transactions),
    recentTransactions,
  };
}
