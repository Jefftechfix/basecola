import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Copy, ExternalLink, RefreshCw, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CryptoAssetIcon } from "@/components/brand";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  discoverAdminCompanyTreasuryWallets,
  listAdminCompanyTreasuryWallets,
  refreshAdminCompanyTreasuryWallet,
  syncAdminCompanyTreasuryWallets,
  type AdminCompanyTreasuryWalletRow,
} from "@/lib/admin.functions";
import { COMPANY_TREASURY_ADDRESSES } from "@/lib/company-treasury-addresses";

function explorerUrl(network: string, address: string): string | null {
  const encoded = encodeURIComponent(address);
  switch (network) {
    case "bitcoin-mainnet":
      return `https://mempool.space/address/${encoded}`;
    case "ethereum-mainnet":
      return `https://etherscan.io/address/${encoded}`;
    case "solana-mainnet":
      return `https://solscan.io/account/${encoded}`;
    case "xrpl-mainnet":
      return `https://livenet.xrpl.org/accounts/${encoded}`;
    default:
      return null;
  }
}

function dateTime(value: string): string {
  return new Date(value).toLocaleString();
}

function networkAssetSymbol(network: string): string {
  switch (network) {
    case "bitcoin-mainnet":
      return "BTC";
    case "ethereum-mainnet":
      return "ETH";
    case "solana-mainnet":
      return "SOL";
    case "xrpl-mainnet":
      return "XRP";
    default:
      return network;
  }
}

export function AdminCompanyTreasuryWallets() {
  const discoverWallets = useServerFn(discoverAdminCompanyTreasuryWallets);
  const fetchWallets = useServerFn(listAdminCompanyTreasuryWallets);
  const syncWallets = useServerFn(syncAdminCompanyTreasuryWallets);
  const refreshWallet = useServerFn(refreshAdminCompanyTreasuryWallet);
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<AdminCompanyTreasuryWalletRow | null>(null);
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [discoveredWallets, setDiscoveredWallets] = useState<
    { walletId: string; walletName: string; createdAt: string }[]
  >([]);
  const [selectedWalletIds, setSelectedWalletIds] = useState<string[]>([]);
  const walletsQuery = useQuery({
    queryKey: ["admin-company-treasury-wallets"],
    queryFn: () => fetchWallets(),
  });
  const discoverMutation = useMutation({
    mutationFn: () => discoverWallets(),
    onSuccess: (wallets) => {
      setActionError("");
      setActionMessage(`Found ${wallets.length} wallets in the configured Turnkey organization.`);
      setDiscoveredWallets(wallets);
      setSelectedWalletIds([]);
    },
    onError: (error: Error) => {
      setActionMessage("");
      setActionError(error.message);
    },
  });
  const syncMutation = useMutation({
    mutationFn: (walletIds: string[]) => syncWallets({ data: { walletIds } }),
    onSuccess: async (result) => {
      setActionError("");
      setActionMessage(
        `Verified and synchronized ${result.synchronized} Turnkey wallets. Addresses matched the configured company treasury addresses.`,
      );
      setDiscoveredWallets([]);
      setSelectedWalletIds([]);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-company-treasury-wallets"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-treasury-balances"] }),
      ]);
    },
    onError: (error: Error) => {
      setActionMessage("");
      setActionError(error.message);
    },
  });
  const refreshMutation = useMutation({
    mutationFn: (walletAccountId: string) => refreshWallet({ data: { walletAccountId } }),
    onSuccess: async (balances, walletAccountId) => {
      setActionError("");
      setActionMessage(
        `Recorded ${balances.length} fresh ${balances.length === 1 ? "balance" : "balances"} from the blockchain provider.`,
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-company-treasury-wallets"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-treasury-balances"] }),
      ]);
      const current = queryClient.getQueryData<AdminCompanyTreasuryWalletRow[]>([
        "admin-company-treasury-wallets",
      ]);
      setSelected((wallet) =>
        wallet?.id === walletAccountId
          ? (current?.find((item) => item.id === walletAccountId) ?? wallet)
          : wallet,
      );
    },
    onError: (error: Error) => {
      setActionMessage("");
      setActionError(error.message);
    },
  });

  async function copyAddress(address: string) {
    try {
      await navigator.clipboard.writeText(address);
      setActionError("");
      setActionMessage("Wallet address copied.");
    } catch {
      setActionMessage("");
      setActionError("Could not copy the address. Select and copy it manually.");
    }
  }

  return (
    <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
      <header className="flex flex-wrap items-center gap-3">
        <div className="mr-auto">
          <h2 className="text-lg font-bold">Company Treasury Wallets</h2>
          <p className="text-sm text-muted-foreground">
            Existing Turnkey wallets only. Sync verifies the configured IDs against the Turnkey
            organization and requires exact matches with the configured company treasury addresses.
            No wallets are created.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={discoverMutation.isPending || syncMutation.isPending}
          onClick={() => discoverMutation.mutate()}
        >
          <RefreshCw className={`h-4 w-4 ${discoverMutation.isPending ? "animate-spin" : ""}`} />
          Discover Turnkey wallets
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={syncMutation.isPending || selectedWalletIds.length !== 4}
          onClick={() => syncMutation.mutate(selectedWalletIds)}
        >
          <Wallet className="h-4 w-4" />
          Sync selected ({selectedWalletIds.length}/4)
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={walletsQuery.isFetching}
          onClick={() => void walletsQuery.refetch()}
        >
          <RefreshCw className={`h-4 w-4 ${walletsQuery.isFetching ? "animate-spin" : ""}`} />
          Reload saved balances
        </Button>
      </header>

      {actionError && (
        <p role="alert" className="text-sm text-destructive">
          {actionError}
        </p>
      )}
      {actionMessage && (
        <p role="status" className="text-sm text-muted-foreground">
          {actionMessage}
        </p>
      )}
      {walletsQuery.error && (
        <p role="alert" className="text-sm text-destructive">
          {(walletsQuery.error as Error).message}
        </p>
      )}

      {discoveredWallets.length > 0 && (
        <fieldset className="space-y-3 rounded-xl border p-4">
          <legend className="px-2 text-sm font-semibold">
            Select the four existing company wallets
          </legend>
          <p className="text-sm text-muted-foreground">
            Select the BaseCola treasury wallets by their existing Turnkey names. Sync verifies
            their organization, public addresses against the expected values below, and that they
            cover four distinct supported networks. No wallets are created.
          </p>
          <dl className="grid gap-2 rounded-lg bg-muted/50 p-3 text-xs sm:grid-cols-2">
            {Object.entries(COMPANY_TREASURY_ADDRESSES).map(([network, address]) => (
              <div key={network}>
                <dt className="font-semibold">{network}</dt>
                <dd className="break-all font-mono">{address}</dd>
              </div>
            ))}
          </dl>
          <div className="max-h-72 space-y-2 overflow-y-auto">
            {discoveredWallets.map((wallet) => {
              const checked = selectedWalletIds.includes(wallet.walletId);
              return (
                <label
                  key={wallet.walletId}
                  className="flex cursor-pointer items-start gap-3 rounded-lg border p-3"
                >
                  <input
                    type="checkbox"
                    aria-label={`Select ${wallet.walletName}`}
                    checked={checked}
                    disabled={!checked && selectedWalletIds.length >= 4}
                    onChange={() => {
                      setSelectedWalletIds((current) =>
                        checked
                          ? current.filter((id) => id !== wallet.walletId)
                          : [...current, wallet.walletId],
                      );
                    }}
                  />
                  <span className="min-w-0">
                    <span className="block font-medium">{wallet.walletName}</span>
                    <span className="block break-all font-mono text-xs text-muted-foreground">
                      {wallet.walletId}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      Created {dateTime(wallet.createdAt)}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            {selectedWalletIds.length} of 4 selected. The sync is rejected unless there is exactly
            one wallet for each supported network.
          </p>
        </fieldset>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1050px] text-left text-sm">
          <thead className="text-xs text-muted-foreground">
            <tr>
              <th className="p-2">Wallet</th>
              <th className="p-2">Network</th>
              <th className="p-2">Public address</th>
              <th className="p-2">Turnkey wallet ID</th>
              <th className="p-2">Type / status</th>
              <th className="p-2">Latest balance</th>
              <th className="p-2">Created</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(walletsQuery.data ?? []).map((wallet) => {
              const explorer = explorerUrl(wallet.network, wallet.address);
              return (
                <tr key={wallet.id} className="border-t align-top">
                  <td className="p-2">
                    <span className="flex items-center gap-2 font-semibold">
                      <CryptoAssetIcon
                        symbol={networkAssetSymbol(wallet.network)}
                        name={wallet.network}
                      />
                      {wallet.label}
                    </span>
                  </td>
                  <td className="p-2">{wallet.network}</td>
                  <td className="p-2">
                    <span
                      className="block max-w-48 truncate font-mono text-xs"
                      title={wallet.address}
                    >
                      {wallet.address}
                    </span>
                  </td>
                  <td className="p-2 font-mono text-xs">{wallet.turnkey_wallet_id}</td>
                  <td className="p-2 capitalize">
                    {wallet.wallet_type} · {wallet.status === "active" ? "Active" : "Inactive"}
                  </td>
                  <td className="p-2">
                    {wallet.balances.length
                      ? wallet.balances.map((balance) => (
                          <div key={balance.asset} className="flex items-center gap-1">
                            <CryptoAssetIcon
                              symbol={balance.asset}
                              name={balance.asset}
                              size="h-4 w-4"
                            />
                            {balance.balance.toLocaleString(undefined, {
                              maximumFractionDigits: 18,
                            })}{" "}
                            {balance.asset}
                          </div>
                        ))
                      : "No balance observation"}
                  </td>
                  <td className="p-2">
                    {dateTime(wallet.turnkey_created_at ?? wallet.created_at)}
                  </td>
                  <td className="p-2">
                    <div className="flex flex-wrap gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setSelected(wallet)}
                      >
                        <Wallet className="h-4 w-4" />
                        Details
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => void copyAddress(wallet.address)}
                      >
                        <Copy className="h-4 w-4" />
                        Copy
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={refreshMutation.isPending}
                        onClick={() => refreshMutation.mutate(wallet.id)}
                      >
                        <RefreshCw
                          className={`h-4 w-4 ${refreshMutation.isPending ? "animate-spin" : ""}`}
                        />
                        Refresh
                      </Button>
                      {explorer && (
                        <>
                          <Button asChild type="button" size="sm" variant="outline">
                            <a href={explorer} target="_blank" rel="noreferrer">
                              <ExternalLink className="h-4 w-4" />
                              Explorer
                            </a>
                          </Button>
                          <Button asChild type="button" size="sm" variant="outline">
                            <a href={explorer} target="_blank" rel="noreferrer">
                              Transactions
                            </a>
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {walletsQuery.isPending && (
        <p className="text-sm text-muted-foreground">Loading company treasury wallets…</p>
      )}
      {!walletsQuery.isPending && !walletsQuery.error && !(walletsQuery.data ?? []).length && (
        <div className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">
          No Turnkey treasury wallets have been synchronized. Discover wallets in the configured
          Turnkey organization, select the four existing company wallets, and sync them.
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Balances show the latest trusted monitor observations. Reloading reads saved observations;
        it does not query a blockchain provider.
      </p>

      <Dialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent className="max-w-2xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.label}</DialogTitle>
                <DialogDescription>
                  Company treasury wallet details from the synchronized Turnkey record.
                </DialogDescription>
              </DialogHeader>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Network</dt>
                  <dd>{selected.network}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Wallet type</dt>
                  <dd>{selected.wallet_type}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Status</dt>
                  <dd>{selected.status === "active" ? "Active" : "Inactive"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Created</dt>
                  <dd>{dateTime(selected.turnkey_created_at ?? selected.created_at)}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground">Turnkey wallet ID</dt>
                  <dd className="break-all font-mono">{selected.turnkey_wallet_id}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground">Public address</dt>
                  <dd className="break-all font-mono">{selected.address}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground">Latest recorded balances</dt>
                  <dd>
                    {selected.balances.length
                      ? selected.balances.map((balance) => (
                          <p key={balance.asset}>
                            {balance.balance.toLocaleString(undefined, {
                              maximumFractionDigits: 18,
                            })}{" "}
                            {balance.asset}
                            {" · "}
                            {dateTime(balance.observed_at)}
                          </p>
                        ))
                      : "No balance observation recorded."}
                  </dd>
                </div>
              </dl>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
