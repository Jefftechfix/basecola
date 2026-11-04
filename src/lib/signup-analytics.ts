export type SignupRow = { country: string | null; created_at: string };

export type SignupRange = "all" | "24h" | "7d" | "30d";

export type CountrySignup = {
  country: string;
  signups: number;
  share: number;
  firstSignup: string;
  lastSignup: string;
  untracked: boolean;
};

export type SignupAnalytics = {
  range: SignupRange;
  since: string | null;
  total: number;
  countries: CountrySignup[];
};

export const UNTRACKED_COUNTRY = "Not provided";

export const SIGNUP_RANGES: readonly { id: SignupRange; label: string }[] = [
  { id: "all", label: "All time" },
  { id: "24h", label: "Last 24 hours" },
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
];

const RANGE_MILLISECONDS: Record<Exclude<SignupRange, "all">, number> = {
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
};

export function isSignupRange(value: unknown): value is SignupRange {
  return value === "all" || value === "24h" || value === "7d" || value === "30d";
}

export function rangeStart(range: SignupRange, now: Date): string | null {
  if (range === "all") return null;
  const start = new Date(now.getTime() - RANGE_MILLISECONDS[range]);
  return Number.isNaN(start.getTime()) ? null : start.toISOString();
}

function normalizeCountry(value: string | null | undefined) {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function pickLabel(counts: Map<string, number>) {
  let label = UNTRACKED_COUNTRY;
  let best = 0;
  for (const [candidate, count] of counts) {
    if (count > best) {
      best = count;
      label = candidate;
    }
  }
  return label;
}

export function summarizeSignups(rows: readonly SignupRow[], range: SignupRange, now: Date): SignupAnalytics {
  const since = rangeStart(range, now);
  const cutoff = since ? new Date(since).getTime() : null;
  const groups = new Map<string, { labels: Map<string, number>; signups: number; first: number; last: number }>();
  let total = 0;

  for (const row of rows) {
    const at = new Date(row.created_at).getTime();
    if (Number.isNaN(at)) continue;
    if (cutoff !== null && at < cutoff) continue;

    const raw = normalizeCountry(row.country);
    const key = raw.toLowerCase() || "untracked";
    let group = groups.get(key);
    if (!group) {
      group = { labels: new Map(), signups: 0, first: at, last: at };
      groups.set(key, group);
    }
    group.signups += 1;
    group.first = Math.min(group.first, at);
    group.last = Math.max(group.last, at);
    const label = raw || UNTRACKED_COUNTRY;
    group.labels.set(label, (group.labels.get(label) ?? 0) + 1);
    total += 1;
  }

  const countries: CountrySignup[] = [...groups.entries()].map(([key, group]) => ({
    country: pickLabel(group.labels),
    signups: group.signups,
    share: total > 0 ? group.signups / total : 0,
    firstSignup: new Date(group.first).toISOString(),
    lastSignup: new Date(group.last).toISOString(),
    untracked: key === "untracked",
  }));

  countries.sort((a, b) => {
    if (b.signups !== a.signups) return b.signups - a.signups;
    if (a.untracked !== b.untracked) return a.untracked ? 1 : -1;
    return a.country.localeCompare(b.country);
  });

  return { range, since, total, countries };
}

export function signupShareLabel(share: number) {
  if (!Number.isFinite(share)) return "0%";
  return `${(share * 100).toFixed(share > 0 && share < 0.001 ? 2 : 1)}%`;
}

function csvCell(value: string | number) {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function signupCsv(analytics: SignupAnalytics) {
  const header = ["Country", "Signups", "Share %", "First signup", "Last signup"];
  const lines = [header.map(csvCell).join(",")];
  for (const country of analytics.countries) {
    lines.push([
      country.country,
      country.signups,
      (country.share * 100).toFixed(1),
      country.firstSignup,
      country.lastSignup,
    ].map(csvCell).join(","));
  }
  return `${lines.join("\n")}\n`;
}
