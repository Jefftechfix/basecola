import { describe, expect, it } from "vitest";
import { rangeStart, signupCsv, summarizeSignups } from "@/lib/signup-analytics";

const NOW = new Date("2026-11-04T12:00:00.000Z");

const ROWS = [
  { country: "Nigeria", created_at: "2026-11-04T09:00:00.000Z" },
  { country: "nigeria", created_at: "2026-11-03T09:00:00.000Z" },
  { country: " Nigeria ", created_at: "2026-11-01T09:00:00.000Z" },
  { country: "United States", created_at: "2026-11-02T09:00:00.000Z" },
  { country: null, created_at: "2026-10-20T09:00:00.000Z" },
  { country: "", created_at: "2026-08-01T09:00:00.000Z" },
];

describe("summarizeSignups", () => {
  it("ranks countries by signup count with share and first/last dates", () => {
    const result = summarizeSignups(ROWS, "all", NOW);
    expect(result.total).toBe(6);
    expect(result.countries.map(c => c.country)).toEqual(["Nigeria", "Not provided", "United States"]);
    expect(result.countries[0].signups).toBe(3);
    expect(result.countries[0].share).toBeCloseTo(0.5, 6);
    expect(result.countries[0].firstSignup).toBe("2026-11-01T09:00:00.000Z");
    expect(result.countries[0].lastSignup).toBe("2026-11-04T09:00:00.000Z");
    const unitedStates = result.countries.find(c => c.country === "United States");
    expect(unitedStates?.signups).toBe(1);
    expect(unitedStates?.share).toBeCloseTo(1 / 6, 6);
  });

  it("groups case and whitespace variants under the most common spelling", () => {
    const result = summarizeSignups(ROWS, "all", NOW);
    const nigeria = result.countries.find(c => c.country.toLowerCase() === "nigeria");
    expect(nigeria?.signups).toBe(3);
    expect(result.countries.filter(c => c.country.toLowerCase() === "nigeria")).toHaveLength(1);
  });

  it("counts missing countries together as Not provided", () => {
    const result = summarizeSignups(ROWS, "all", NOW);
    const missing = result.countries.find(c => c.untracked);
    expect(missing?.country).toBe("Not provided");
    expect(missing?.signups).toBe(2);
  });

  it("excludes signups outside the selected range", () => {
    const week = summarizeSignups(ROWS, "7d", NOW);
    expect(week.since).toBe("2026-10-28T12:00:00.000Z");
    expect(week.total).toBe(4);
    expect(week.countries.find(c => c.country === "Nigeria")?.signups).toBe(3);
    expect(week.countries.some(c => c.country === "Not provided")).toBe(false);

    const day = summarizeSignups(ROWS, "24h", NOW);
    expect(day.total).toBe(1);
    expect(day.countries[0].country).toBe("Nigeria");
    expect(day.countries[0].share).toBe(1);
  });

  it("returns an empty ranking when no signups fall in the range", () => {
    const result = summarizeSignups([], "30d", NOW);
    expect(result.total).toBe(0);
    expect(result.countries).toEqual([]);
  });

  it("ignores rows with an unreadable date", () => {
    const result = summarizeSignups([{ country: "Ghana", created_at: "not a date" }, ...ROWS], "all", NOW);
    expect(result.total).toBe(6);
    expect(result.countries.some(c => c.country === "Ghana")).toBe(false);
  });
});

describe("rangeStart", () => {
  it("has no lower bound for all time", () => {
    expect(rangeStart("all", NOW)).toBeNull();
  });

  it("subtracts the range length from now", () => {
    expect(rangeStart("30d", NOW)).toBe("2026-10-05T12:00:00.000Z");
  });
});

describe("signupCsv", () => {
  it("writes one row per country and quotes names containing commas", () => {
    const csv = signupCsv(summarizeSignups(
      [
        { country: "Korea, South", created_at: "2026-11-04T09:00:00.000Z" },
        { country: "Korea, South", created_at: "2026-11-02T09:00:00.000Z" },
        { country: "Ghana", created_at: "2026-11-03T09:00:00.000Z" },
      ],
      "all",
      NOW,
    ));
    const lines = csv.trim().split("\n");
    expect(lines[0]).toBe("Country,Signups,Share %,First signup,Last signup");
    expect(lines[1]).toBe('"Korea, South",2,66.7,2026-11-02T09:00:00.000Z,2026-11-04T09:00:00.000Z');
    expect(lines[2]).toBe("Ghana,1,33.3,2026-11-03T09:00:00.000Z,2026-11-03T09:00:00.000Z");
  });
});
