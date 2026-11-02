import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { listRecords, type RecordKind } from "@/lib/wallet-records";

const TITLES: Record<RecordKind, string> = { fundings: "Your funding history", receives: "Your receive requests", sends: "Your sent transfers" };

function line(kind: RecordKind, r: Record<string, unknown>) {
  if (kind === "fundings") return `$${Number(r.amount).toFixed(2)} · ${String(r.payment_method)}`;
  if (kind === "receives") return `${r.amount != null ? `${r.amount} ` : ""}${String(r.coin)} · ${String(r.network)}`;
  return `${r.amount} ${String(r.coin)} → ${String(r.to_address).slice(0, 14)}…`;
}

export function WalletRecords({ kind }: { kind: RecordKind }) {
  const { data, isPending, error } = useQuery({ queryKey: ["wallet-records", kind], queryFn: () => listRecords(kind) });
  return <section className="mt-8">
    <h2 className="mb-3 text-lg font-bold">{TITLES[kind]}</h2>
    {isPending ? <p className="text-sm text-muted-foreground">Loading…</p>
      : error ? <p role="alert" className="text-sm text-destructive">{error.message}</p>
      : data === null ? <p className="text-sm text-muted-foreground"><Link to="/login" className="font-bold text-primary">Log in</Link> to save and view your records.</p>
      : <><ul className="divide-y rounded-2xl bg-card shadow-soft">{data.length ? data.map(r => <li key={String(r.id)} className="flex items-center justify-between gap-3 p-4 text-sm">
          <div className="min-w-0"><p className="truncate font-semibold">{line(kind, r)}</p><p className="text-xs text-muted-foreground">{new Date(String(r.created_at)).toLocaleString()}</p></div>
          <span className="shrink-0 rounded-full bg-accent px-2.5 py-1 text-xs font-bold capitalize">{String(r.status)}</span>
        </li>) : <li className="p-4 text-sm text-muted-foreground">No records yet.</li>}</ul><p className="mt-3 text-xs text-muted-foreground">Status stays pending until an admin updates it. You cannot mark your own record completed.</p></>}
  </section>;
}
