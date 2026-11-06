import { createFileRoute, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import { WalletLayout, WalletCoinSelect } from "@/components/wallet-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { requestCryptoWithdrawal } from "@/lib/crypto-withdrawal.functions";
import { CRYPTO_NETWORKS, type CryptoAsset } from "@/lib/crypto/networks";

export const Route = createFileRoute("/crypto-withdrawal")({
  beforeLoad: async () => {
    if (typeof document === "undefined") return;
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/login", replace: true });
  },
  head: () => ({ meta: [
    { title: "Crypto Withdrawal — Basecola" },
    { name: "description", content: "Request a crypto withdrawal from your confirmed Basecola crypto balance." },
  ] }),
  component: CryptoWithdrawalPage,
});

function CryptoWithdrawalPage() {
  const [asset, setAsset] = useState<CryptoAsset>("BTC");
  const [destinationAddress, setDestinationAddress] = useState("");
  const [destinationTag, setDestinationTag] = useState("");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const submitWithdrawal = useServerFn(requestCryptoWithdrawal);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setStatus("");
    try {
      const result = await submitWithdrawal({
        data: {
          asset,
          network: CRYPTO_NETWORKS[asset],
          destinationAddress,
          destinationTag: asset === "XRP" && destinationTag.trim()
            ? Number(destinationTag)
            : null,
          amount: amount.trim(),
          idempotencyKey: crypto.randomUUID(),
        },
      });
      if (!result) throw new Error("Withdrawal request was not recorded.");
      setStatus("Withdrawal request recorded and funds reserved. No blockchain transaction has been signed or broadcast yet.");
      setDestinationAddress("");
      setDestinationTag("");
      setAmount("");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not submit withdrawal request.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <WalletLayout
      title="Crypto Withdrawal"
      notice="Withdrawal requests are automatically approved under your configured policy and reserve confirmed crypto balance. This app does not yet sign or broadcast withdrawals; funds remain reserved until execution/reconciliation is deployed."
    >
      <form className="space-y-5" onSubmit={submit}>
        <WalletCoinSelect
          symbol={asset}
          onChange={(symbol) => {
            setAsset(symbol as CryptoAsset);
            setError("");
          }}
        />
        <div className="space-y-2">
          <Label htmlFor="withdrawal-address">Destination address</Label>
          <Input
            id="withdrawal-address"
            autoComplete="off"
            value={destinationAddress}
            onChange={(event) => setDestinationAddress(event.target.value)}
            placeholder="Paste the destination address"
            className="h-12 bg-card font-mono text-sm"
          />
        </div>
        {asset === "XRP" && (
          <div className="space-y-2">
            <Label htmlFor="withdrawal-tag">Destination tag (optional)</Label>
            <Input
              id="withdrawal-tag"
              inputMode="numeric"
              value={destinationTag}
              onChange={(event) => setDestinationTag(event.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="Enter if required by the recipient"
              className="h-12 bg-card"
            />
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="withdrawal-amount">Amount ({asset})</Label>
          <Input
            id="withdrawal-amount"
            inputMode="decimal"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="0.00"
            className="h-12 bg-card"
          />
        </div>
        <div className="rounded-xl border bg-muted/50 p-4 text-sm">
          <p>Network: <span className="font-semibold">{CRYPTO_NETWORKS[asset]}</span></p>
          <p className="mt-1">Limit: <span className="font-semibold">$5,000 per withdrawal and rolling 24 hours</span></p>
          <p className="mt-2 text-xs text-muted-foreground">The USD limit uses the admin-configured sell price. A network fee quote will be applied when transaction execution is implemented.</p>
        </div>
        <Button type="submit" className="h-12 w-full" disabled={busy}>
          {busy ? "Submitting request…" : "Request withdrawal"}<ArrowUpRight />
        </Button>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {status && (
          <p role="status" className="flex items-start gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="h-5 w-5 shrink-0 text-primary" />{status}
          </p>
        )}
      </form>
    </WalletLayout>
  );
}
