import { createFileRoute, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import { WalletLayout, WalletCoinSelect } from "@/components/wallet-layout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
    { title: "Withdraw Crypto — Basecola" },
    { name: "description", content: "Withdraw crypto from your confirmed Basecola balance." },
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
  const [confirmed, setConfirmed] = useState(false);
  const [retryingSameWithdrawal, setRetryingSameWithdrawal] = useState(false);
  const idempotencyKey = useRef<string | null>(null);
  const submitWithdrawal = useServerFn(requestCryptoWithdrawal);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!confirmed) {
      setError("Confirm the destination address and network before withdrawing.");
      return;
    }
    setBusy(true);
    setError("");
    setStatus("");
    try {
      const key = idempotencyKey.current ?? crypto.randomUUID();
      idempotencyKey.current = key;
      const result = await submitWithdrawal({
        data: {
          asset,
          network: CRYPTO_NETWORKS[asset],
          destinationAddress,
          destinationTag: asset === "XRP" && destinationTag.trim()
            ? Number(destinationTag)
            : null,
          amount: amount.trim(),
          idempotencyKey: key,
        },
      });
      if (result.status === "failed" || result.status === "cancelled") {
        setError(`Withdrawal ${result.withdrawalId} was not sent (status: ${result.status}). Check your transaction history before trying again.`);
      } else if (result.status === "confirmed") {
        setStatus(
          `Withdrawal confirmed.${result.networkFee ? ` Network fee: ${result.networkFee} ${asset}${result.networkFeeUsd ? ` (~$${result.networkFeeUsd})` : ""}.` : ""} Reference: ${result.withdrawalId}.`,
        );
      } else {
        setStatus(
          result.status === "broadcast" && result.transactionHash
            ? `Withdrawal broadcast.${result.networkFee ? ` Network fee: ${result.networkFee} ${asset}${result.networkFeeUsd ? ` (~$${result.networkFeeUsd})` : ""}.` : ""} Transaction: ${result.transactionHash}`
            : `Withdrawal is being processed or reconciled (status: ${result.status}).${result.networkFee ? ` Network fee: ${result.networkFee} ${asset}${result.networkFeeUsd ? ` (~$${result.networkFeeUsd})` : ""}.` : ""} Do not submit it again. Reference: ${result.withdrawalId}.`,
        );
      }
      setDestinationAddress("");
      setDestinationTag("");
      setAmount("");
      idempotencyKey.current = null;
      setRetryingSameWithdrawal(false);
    } catch (withdrawalError) {
      setError(withdrawalError instanceof Error ? withdrawalError.message : "Could not complete the withdrawal.");
      setRetryingSameWithdrawal(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <WalletLayout
      title="Withdraw Crypto"
      notice="Withdrawals are sent after server-side validation and network-fee checks. Crypto transfers are irreversible; verify the destination address and network. A private transaction record is kept for account history and reconciliation."
    >
      <form className="space-y-5" onSubmit={submit}>
        <fieldset disabled={busy || retryingSameWithdrawal} className="space-y-5">
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
            <p className="mt-2 text-xs text-muted-foreground">The network fee is calculated at submission and must be within the configured fee cap. The exact fee is shown with the withdrawal status.</p>
          </div>
          <div className="flex items-start gap-3">
            <Checkbox
              id="withdrawal-confirmation"
              checked={confirmed}
              onCheckedChange={(checked) => setConfirmed(checked === true)}
              aria-required="true"
            />
            <Label htmlFor="withdrawal-confirmation" className="text-sm leading-5">
              I verified the destination address and network, and understand this transfer cannot be reversed.
            </Label>
          </div>
        </fieldset>
        <Button type="submit" className="h-12 w-full" disabled={busy || !confirmed}>
          {busy ? "Sending withdrawal…" : retryingSameWithdrawal ? "Retry same withdrawal" : "Withdraw now"}<ArrowUpRight />
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
