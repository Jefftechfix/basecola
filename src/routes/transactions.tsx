import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { syncStripeFundings } from "@/lib/stripe-funding";
import { Search, History } from "lucide-react";
import { AccountShell } from "@/components/account-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TransactionCoin } from "@/components/transaction-coin";
import { money } from "@/lib/account-demo";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/transactions")({
  head: () => ({
    meta: [
      { title: "Transactions — Basecola" },
      {
        name: "description",
        content: "Review your Basecola crypto transaction history and receipts.",
      },
      { property: "og:title", content: "Transactions — Basecola" },
      { property: "og:description", content: "Your Basecola crypto transaction history." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TransactionsPage,
});

async function listTransactions() {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(error.message);
  return data;
}

const KINDS = ["All", "Buy", "Sell", "Send", "Receive", "Funding"];

function TransactionsPage() {
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const { data, isPending, error } = useQuery({
    queryKey: ["transactions"],
    queryFn: listTransactions,
  });
  const qc = useQueryClient();
  useEffect(() => {
    syncStripeFundings().then((count) => {
      if (count > 0) {
        qc.invalidateQueries({ queryKey: ["transactions"] });
        qc.invalidateQueries({ queryKey: ["wallet-balance"] });
      }
    });
  }, [qc]);
  const rows = data ?? [];
  const filtered = rows.filter(
    (item) =>
      (filter === "All" || item.kind.toLowerCase() === filter.toLowerCase()) &&
      `${item.kind} ${item.coin ?? ""} ${item.counterparty ?? ""} ${item.reference ?? ""} ${item.status}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <AccountShell active="/transactions" title="Transactions">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          aria-label="Search transactions"
          className="h-10 bg-card pl-9"
          placeholder="Search coin, status or reference"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div role="group" aria-label="Transaction type" className="my-5 flex flex-wrap gap-2">
        {KINDS.map((type) => (
          <Button
            key={type}
            variant={filter === type ? "default" : "outline"}
            size="sm"
            aria-pressed={filter === type}
            onClick={() => setFilter(type)}
          >
            {type}
          </Button>
        ))}
      </div>
      <div className="mb-3 flex justify-between text-sm">
        <h2 className="font-bold">Recent activity</h2>
        <span className="text-muted-foreground">{filtered.length} transaction{filtered.length === 1 ? "" : "s"}</span>
      </div>
      {isPending ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Loading…</p>
      ) : error ? (
        <p role="alert" className="py-10 text-center text-sm text-destructive">
          {error.message}
        </p>
      ) : data === null ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          <Link to="/login" className="font-bold text-primary">
            Log in
          </Link>{" "}
          to view your activity.
        </p>
      ) : (
        <>
          <div className="divide-y border-y">
            {filtered.map((item) => {
              const incoming = item.direction === "credit";
              return (
                <Link
                  key={item.id}
                  to="/transactions/$transactionId"
                  params={{ transactionId: item.id }}
                  className="flex min-h-24 items-center gap-3 py-4 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <TransactionCoin symbol={item.coin ?? ""} incoming={incoming} />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold capitalize">
                      {item.kind} {item.coin ?? ""}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(item.created_at).toLocaleString()}
                    </p>
                    {item.counterparty && (
                      <p className="truncate text-xs text-muted-foreground">{item.counterparty}</p>
                    )}
                    {item.reference && (
                      <p className="truncate text-xs text-muted-foreground">{item.reference}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {item.crypto_amount != null
                        ? `${item.crypto_amount} ${item.coin ?? ""}`
                        : money(Number(item.usd_amount))}
                    </p>
                    <p className="my-1 text-xs text-muted-foreground">
                      Fee {money(Number(item.fee_usd))}
                    </p>
                    <span className="inline-flex rounded-md bg-accent px-2 py-1 text-xs font-medium capitalize">
                      {item.status}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
          {filtered.length === 0 && (
            <div className="py-16 text-center">
              <History className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <p className="font-semibold">
                {rows.length ? "No matching transactions" : "No activity yet"}
              </p>
              {rows.length > 0 && (
                <Button
                  variant="link"
                  onClick={() => {
                    setQuery("");
                    setFilter("All");
                  }}
                >
                  Reset filters
                </Button>
              )}
            </div>
          )}
        </>
      )}
    </AccountShell>
  );
}
