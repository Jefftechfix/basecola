import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AdminDashboard } from "@/components/admin-dashboard";
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

  it("renders the dashboard with its default reporting period", () => {
    render(<AdminDashboard onSection={() => {}} periodId="week" />);
    expect(screen.getAllByText("$1,284,560,320")).toHaveLength(2);
    expect(screen.getByText("Transaction Volume")).toBeInTheDocument();
  });
});