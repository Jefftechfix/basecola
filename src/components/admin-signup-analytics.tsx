import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Download, Globe2, MapPin, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listAdminSignupAnalytics } from "@/lib/admin.functions";
import { SIGNUP_RANGES, signupCsv, signupShareLabel, type SignupRange } from "@/lib/signup-analytics";

const day = (value: string) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

function useSignupAnalytics(range: SignupRange) {
  const fetchAnalytics = useServerFn(listAdminSignupAnalytics);
  return useQuery({
    queryKey: ["admin-signup-analytics", range],
    queryFn: () => fetchAnalytics({ data: { range } }),
  });
}

function Bar({ share }: { share: number }) {
  return <div className="h-2 w-full overflow-hidden rounded-full bg-[#f0eefe]" role="presentation">
    <div className="h-full rounded-full bg-[#6d4dff]" style={{ width: `${Math.max(share * 100, 2)}%` }} />
  </div>;
}

function Kpi({ label, value, note }: { label: string; value: string; note?: string }) {
  return <article className="rounded-3xl bg-white p-4 shadow-sm">
    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
    <p className="mt-2 truncate text-2xl font-extrabold">{value}</p>
    {note && <p className="mt-1 truncate text-xs text-muted-foreground">{note}</p>}
  </article>;
}

export function LiveSignupAnalytics() {
  const [range, setRange] = useState<SignupRange>("all");
  const { data, isPending, error } = useSignupAnalytics(range);
  const countries = data?.countries ?? [];
  const total = data?.total ?? 0;
  const top = countries[0];
  const max = top?.signups ?? 0;

  function exportCsv() {
    if (!data || !countries.length) return;
    const blob = new Blob([signupCsv(data)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `basecola-signups-by-country-${data.range}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return <section className="space-y-4">
    <div className="flex flex-wrap items-center gap-3">
      <h2 className="mr-auto flex items-center gap-2 text-lg font-bold"><Globe2 className="h-5 w-5 text-[#6d4dff]" />Signups by country</h2>
      <div className="flex flex-wrap rounded-full bg-white p-1 text-sm shadow-sm" role="group" aria-label="Reporting range">
        {SIGNUP_RANGES.map(item => <button key={item.id} type="button" aria-pressed={range === item.id}
          className={`rounded-full px-3 py-1 font-semibold ${range === item.id ? "bg-[#6d4dff] text-white" : "text-muted-foreground"}`}
          onClick={() => setRange(item.id)}>{item.label}</button>)}
      </div>
      <Button variant="outline" size="sm" className="h-10 rounded-xl" disabled={!countries.length} onClick={exportCsv}>
        <Download className="h-4 w-4" />Export CSV
      </Button>
    </div>

    {error && <p role="alert" className="text-sm text-destructive">{(error as Error).message}</p>}

    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Kpi label="Signups" value={total.toLocaleString("en-US")} note={data?.since ? `Since ${day(data.since)}` : "All recorded members"} />
      <Kpi label="Countries reached" value={countries.filter(c => !c.untracked).length.toLocaleString("en-US")} note={countries.some(c => c.untracked) ? `${countries.find(c => c.untracked)!.signups} without a country` : "Every signup has a country"} />
      <Kpi label="Top country" value={top?.country ?? "—"} note={top ? `${top.signups.toLocaleString("en-US")} signup${top.signups === 1 ? "" : "s"}` : "No signups in this range"} />
      <Kpi label="Top country share" value={top ? signupShareLabel(top.share) : "0%"} note={top ? `Last signup ${day(top.lastSignup)}` : "—"} />
    </div>

    <div className="rounded-3xl bg-white p-5 shadow-sm">
      {isPending && <p className="text-sm text-muted-foreground">Loading signup analytics…</p>}
      {!isPending && !error && !countries.length && <p className="text-sm text-muted-foreground">No signups recorded in this period yet.</p>}
      {!isPending && countries.length > 0 && <>
        <p className="text-sm text-muted-foreground">Ranked by number of member signups {data?.since ? `since ${day(data.since)}` : "for all recorded members"}.</p>
        <ul className="mt-4 max-h-[520px] space-y-4 overflow-y-auto pr-1">
          {countries.map((country, index) => <li key={country.country}>
            <div className="flex items-baseline gap-3 text-sm">
              <span className="w-6 shrink-0 font-bold text-muted-foreground">{index + 1}</span>
              <span className={`min-w-0 flex-1 truncate font-semibold ${country.untracked ? "text-muted-foreground" : ""}`}>{country.country}</span>
              <span className="shrink-0 font-bold">{country.signups.toLocaleString("en-US")}</span>
              <span className="w-14 shrink-0 text-right font-semibold text-[#6d4dff]">{signupShareLabel(country.share)}</span>
            </div>
            <div className="mt-1.5 flex items-center gap-3">
              <span className="w-6 shrink-0" />
              <div className="flex-1"><Bar share={max ? country.signups / max : 0} /></div>
            </div>
            <p className="mt-1 flex items-center gap-1 pl-9 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />First {day(country.firstSignup)} · Last {day(country.lastSignup)}</p>
          </li>)}
        </ul>
      </>}
    </div>
  </section>;
}

export function SignupCountryCard({ onViewAll }: { onViewAll: () => void }) {
  const { data, isPending, error } = useSignupAnalytics("all");
  const countries = (data?.countries ?? []).slice(0, 5);
  const max = countries[0]?.signups ?? 0;

  return <section className="rounded-3xl bg-white p-5 shadow-sm">
    <div className="flex items-center gap-2">
      <h2 className="flex items-center gap-2 font-bold"><Globe2 className="h-4 w-4 text-[#6d4dff]" />Signups by Country</h2>
      <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">Live</span>
    </div>
    {isPending && <p className="mt-4 text-sm text-muted-foreground">Loading…</p>}
    {error && <p role="alert" className="mt-4 text-sm text-destructive">{(error as Error).message}</p>}
    {!isPending && !error && !countries.length && <p className="mt-4 text-sm text-muted-foreground">No member signups recorded yet.</p>}
    {!isPending && countries.length > 0 && <ul className="mt-4 space-y-3 text-sm">
      {countries.map(country => <li key={country.country}>
        <div className="flex items-baseline gap-2">
          <span className={`min-w-0 flex-1 truncate font-semibold ${country.untracked ? "text-muted-foreground" : ""}`}>{country.country}</span>
          <span className="shrink-0 font-bold">{country.signups.toLocaleString("en-US")}</span>
          <span className="w-12 shrink-0 text-right font-semibold text-[#6d4dff]">{signupShareLabel(country.share)}</span>
        </div>
        <div className="mt-1"><Bar share={max ? country.signups / max : 0} /></div>
      </li>)}
    </ul>}
    <Button type="button" variant="outline" className="mt-5 h-11 w-full rounded-xl border-[#6d4dff] text-[#6d4dff]" onClick={onViewAll}>
      <UserPlus className="h-4 w-4" />View all countries
    </Button>
  </section>;
}
