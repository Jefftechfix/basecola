import { describe, expect, it } from "vitest";
import { adminMoney } from "@/lib/admin-demo";
import {
  ADMIN_PERIODS,
  summarizeAdminDashboard,
  summarizePlatformRevenue,
  summarizeAdminUsers,
  type DashboardTransaction,
} from "@/lib/admin-dashboard-data";

const now = new Date("2026-11-06T12:00:00.000Z");
const rows: DashboardTransaction[] = [
  {
    id: "current-completed",
    user_id: "user-1",
    kind: "buy",
    coin: "BTC",
    crypto_amount: "0.01",
    usd_amount: "120.00",
    fee_usd: "2.00",
    status: "completed",
    created_at: "2026-11-06T10:00:00.000Z",
  },
  {
    id: "current-pending",
    user_id: "user-2",
    kind: "funding",
    coin: null,
    crypto_amount: null,
    usd_amount: "99.00",
    fee_usd: "9.00",
    status: "pending",
    created_at: "2026-11-05T10:00:00.000Z",
  },
  {
    id: "previous-completed",
    user_id: "user-3",
    kind: "sell",
    coin: "ETH",
    crypto_amount: "0.5",
    usd_amount: "100.00",
    fee_usd: "1.00",
    status: "completed",
    created_at: "2026-10-30T10:00:00.000Z",
  },
];

describe("admin dashboard metrics", () => {
  it("uses real reporting period lengths without embedded sample metrics", () => {
    for (const period of ADMIN_PERIODS) {
      expect(period.days).toBeGreaterThan(0);
    }
  });

  it("aggregates completed volume and fees separately from pending transaction counts", () => {
    const summary = summarizeAdminDashboard(rows, "week", now, new Map([["user-1", "Admin User"]]));
    expect(summary.transactions).toBe(2);
    expect(summary.volume).toBe(120);
    expect(summary.fees).toBe(2);
    expect(summary.transactionChange).toBe(100);
    expect(summary.volumeChange).toBe(20);
    expect(summary.feeChange).toBe(100);
    expect(summary.points).toHaveLength(7);
    expect(summary.recentTransactions[0].user).toBe("Admin User");
    expect(summary.recentTransactions[0].id).toBe("current-completed");
  });

  it("returns no percentage when there is no previous activity to compare", () => {
    const summary = summarizeAdminDashboard(rows.slice(0, 1), "today", now, new Map());
    expect(summary.transactionChange).toBeNull();
    expect(summary.volumeChange).toBeNull();
    expect(summary.feeChange).toBeNull();
  });

  it("reports mutually exclusive verification statuses and unsubmitted users", () => {
    expect(
      summarizeAdminUsers(6, ["approved", "pending", "rejected"], 2),
    ).toEqual({
      total: 6,
      verified: 1,
      pending: 1,
      rejected: 1,
      notSubmitted: 3,
      joinedToday: 2,
    });
  });

  it("ignores invalid totals and non-string verification states without crashing", () => {
    expect(summarizeAdminUsers(2, ["approved", null as never, "pending"], Number.NaN)).toEqual({
      total: 2,
      verified: 1,
      pending: 1,
      rejected: 0,
      notSubmitted: 0,
      joinedToday: 0,
    });
  });

  it("summarizes lifetime and selected-period fees by revenue source", () => {
    expect(
      summarizePlatformRevenue([
        { transaction_kind: "funding", lifetime_revenue: 0, period_revenue: 0 },
        { transaction_kind: "send", lifetime_revenue: "0", period_revenue: "0" },
        { transaction_kind: "buy", lifetime_revenue: "18.25", period_revenue: "4.25" },
        { transaction_kind: "sell", lifetime_revenue: 9, period_revenue: 2 },
      ]),
    ).toEqual({
      lifetimeTotal: 27.25,
      periodTotal: 6.25,
      byKind: [
        { kind: "funding", lifetime: 0, period: 0 },
        { kind: "send", lifetime: 0, period: 0 },
        { kind: "buy", lifetime: 18.25, period: 4.25 },
        { kind: "sell", lifetime: 9, period: 2 },
      ],
    });
  });

  it("formats missing money values without crashing", () => {
    expect(adminMoney(undefined)).toBe("$0");
    expect(adminMoney(null, 2)).toBe("$0.00");
  });
});