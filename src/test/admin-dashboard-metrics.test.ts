import { describe, expect, it } from "vitest";
import { ADMIN_PERIODS, adminMoney } from "@/lib/admin-demo";

describe("admin dashboard metrics", () => {
  it("provides complete metric data for every reporting period", () => {
    for (const period of ADMIN_PERIODS) {
      expect(Number.isFinite(period.volume)).toBe(true);
      expect(Number.isFinite(period.transactions)).toBe(true);
      expect(Number.isFinite(period.volumeChange)).toBe(true);
      expect(Number.isFinite(period.transactionChange)).toBe(true);
      expect(period.points.length).toBeGreaterThan(0);
    }
  });

  it("formats missing money values without crashing", () => {
    expect(adminMoney(undefined)).toBe("$0");
    expect(adminMoney(null, 2)).toBe("$0.00");
  });
});