import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { notifyVerificationDecision } from "@/lib/verification-email";
import { isSignupRange, summarizeSignups, type SignupRange } from "@/lib/signup-analytics";
import {
  ADMIN_PERIODS,
  summarizeAdminDashboard,
  summarizePlatformRevenue,
  summarizeAdminUsers,
  type AdminDashboardSummary,
  type AdminPeriodId,
  type DashboardTransaction,
} from "@/lib/admin-dashboard-data";

type AuthCtx = { supabase: { from: (t: "user_roles") => any }; userId: string };

async function assertAdmin(context: AuthCtx) {
  const { data } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Admin access required.");
}

async function admin() {
  return (await import("@/integrations/supabase/client.server")).supabaseAdmin;
}

export const getAdminProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as AuthCtx);
    const { data, error } = await context.supabase
      .from("profiles")
      .select("full_name, email, phone, country, created_at")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw new Error(`Could not load admin profile: ${error.message}`);

    const claimedEmail = (context.claims as { email?: unknown }).email;
    return {
      id: context.userId,
      name: data?.full_name?.trim() || "Admin",
      email: data?.email || (typeof claimedEmail === "string" ? claimedEmail : ""),
      phone: data?.phone,
      country: data?.country,
      createdAt: data?.created_at,
    };
  });

export const getAdminDashboardSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { periodId: string }) => {
    if (!ADMIN_PERIODS.some((period) => period.id === input.periodId)) {
      throw new Error("Choose a valid dashboard reporting period.");
    }
    return { periodId: input.periodId as AdminPeriodId };
  })
  .handler(async ({ data, context }): Promise<AdminDashboardSummary> => {
    await assertAdmin(context as AuthCtx);
    const db = await admin();
    const now = new Date();
    const period = ADMIN_PERIODS.find((item) => item.id === data.periodId);
    if (!period) throw new Error("Choose a valid dashboard reporting period.");

    const today = new Date(now);
    today.setUTCHours(0, 0, 0, 0);
    const currentStart = today.getTime() - (period.days - 1) * 24 * 60 * 60 * 1000;
    const previousStart = currentStart - period.days * 24 * 60 * 60 * 1000;
    const currentStartIso = new Date(currentStart).toISOString();
    const previousStartIso = new Date(previousStart).toISOString();
    const todayIso = today.toISOString();

    const [
      { count: totalUsers, error: totalUsersError },
      { count: joinedToday, error: joinedTodayError },
      { data: revenueRows, error: revenueError },
    ] = await Promise.all([
      db.from("profiles").select("id", { count: "exact", head: true }),
      db
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .gte("created_at", todayIso)
        .lte("created_at", now.toISOString()),
      db.rpc("admin_platform_revenue_summary", {
        _period_start: currentStartIso,
        _period_end: now.toISOString(),
      }),
    ]);
    if (totalUsersError || joinedTodayError) {
      throw new Error(
        totalUsersError?.message ??
          joinedTodayError?.message ??
          "Could not load dashboard user totals.",
      );
    }
    if (revenueError) {
      throw new Error(`Could not load platform revenue: ${revenueError.message}`);
    }
    const revenue = summarizePlatformRevenue(revenueRows ?? []);

    const latestVerificationByUser = new Map<string, string>();
    for (let offset = 0; ; offset += 500) {
      const { data: verifications, error } = await db
        .from("account_verifications")
        .select("user_id, status, updated_at")
        .order("updated_at", { ascending: false })
        .range(offset, offset + 499);
      if (error) throw new Error(`Could not load verification totals: ${error.message}`);
      for (const verification of verifications ?? []) {
        if (!latestVerificationByUser.has(verification.user_id)) {
          latestVerificationByUser.set(verification.user_id, verification.status);
        }
      }
      if (!verifications || verifications.length < 500) break;
    }
    const transactions: DashboardTransaction[] = [];
    for (let offset = 0; ; offset += 500) {
      const { data: rows, error } = await db
        .from("transactions")
        .select("id, user_id, kind, coin, crypto_amount, usd_amount, fee_usd, status, created_at")
        .gte("created_at", previousStartIso)
        .lte("created_at", now.toISOString())
        .order("created_at", { ascending: true })
        .range(offset, offset + 499);
      if (error) throw new Error(`Could not load dashboard transactions: ${error.message}`);
      transactions.push(...(rows ?? []));
      if (!rows || rows.length < 500) break;
    }

    const summaryPeriod = summarizeAdminDashboard(
      transactions,
      data.periodId,
      now,
      new Map(),
    );
    const recentUserIds = [
      ...new Set(
        summaryPeriod.recentTransactions
          .map((transaction) => transactions.find((row) => row.id === transaction.id)?.user_id)
          .filter((userId): userId is string => Boolean(userId)),
      ),
    ];
    let userNames = new Map<string, string>();
    if (recentUserIds.length > 0) {
      const { data: profiles, error } = await db
        .from("profiles")
        .select("id, full_name, email")
        .in("id", recentUserIds);
      if (error) throw new Error(`Could not load recent transaction users: ${error.message}`);
      userNames = new Map(
        (profiles ?? []).map((profile) => [
          profile.id,
          profile.full_name?.trim() || profile.email || profile.id.slice(0, 8),
        ]),
      );
    }
    const periodSummary = summarizeAdminDashboard(
      transactions,
      data.periodId,
      now,
      userNames,
    );
    return {
      period: {
        transactions: periodSummary.transactions,
        volume: periodSummary.volume,
        fees: periodSummary.fees,
        transactionChange: periodSummary.transactionChange,
        volumeChange: periodSummary.volumeChange,
        feeChange: periodSummary.feeChange,
        points: periodSummary.points,
      },
      revenue,
      users: summarizeAdminUsers(
        totalUsers ?? 0,
        [...latestVerificationByUser.values()],
        joinedToday ?? 0,
      ),
      recentTransactions: periodSummary.recentTransactions,
    };
  });

export const listAdminSignupAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { range: SignupRange }) => {
    if (!isSignupRange(input.range)) throw new Error("Choose a valid signup reporting range.");
    return { range: input.range };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context as AuthCtx);
    const db = await admin();
    const { data: rows, error } = await db.from("profiles").select("country, created_at");
    if (error) throw new Error("Could not load signup analytics.");
    return summarizeSignups(rows ?? [], data.range, new Date());
  });

export type AdminAssetNetworkRow = {
  asset: string;
  network: string;
  display_name: string;
  minimum_deposit: number;
  required_confirmations: number;
  enabled: boolean;
  updated_at: string;
};

export const listAdminAssetNetworks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminAssetNetworkRow[]> => {
    await assertAdmin(context as AuthCtx);
    const db = await admin();
    const { data, error } = await db
      .from("platform_asset_networks")
      .select(
        "asset, network, display_name, minimum_deposit, required_confirmations, enabled, updated_at",
      )
      .order("asset", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const updateAdminAssetNetwork = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      asset: string;
      network: string;
      minimumDeposit: number;
      requiredConfirmations: number;
      enabled: boolean;
      note: string;
    }) => {
      const minimumDeposit = Number(d.minimumDeposit);
      const note = d.note.trim().slice(0, 500);
      if (
        !/^[A-Z0-9]{2,12}$/.test(d.asset) ||
        !["bitcoin-testnet", "ethereum-sepolia", "solana-devnet", "xrpl-testnet"].includes(
          d.network,
        ) ||
        !Number.isFinite(minimumDeposit) ||
        minimumDeposit < 0 ||
        minimumDeposit > 1_000_000_000 ||
        !Number.isInteger(d.requiredConfirmations) ||
        d.requiredConfirmations < 1 ||
        d.requiredConfirmations > 100_000 ||
        typeof d.enabled !== "boolean" ||
        !note
      ) {
        throw new Error("Enter valid asset settings and a reason for the change.");
      }
      return {
        asset: d.asset,
        network: d.network,
        minimumDeposit,
        requiredConfirmations: d.requiredConfirmations,
        enabled: d.enabled,
        note,
      };
    },
  )
  .handler(async ({ data, context }) => {
    const ctx = context as AuthCtx;
    await assertAdmin(ctx);
    const db = await admin();
    const { error } = await db.rpc("admin_update_asset_network", {
      _asset: data.asset,
      _network: data.network,
      _admin_id: ctx.userId,
      _minimum_deposit: data.minimumDeposit,
      _required_confirmations: data.requiredConfirmations,
      _enabled: data.enabled,
      _note: data.note,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export type AdminWalletAccountRow = {
  id: string;
  user_id: string;
  network: string;
  address: string | null;
  destination_tag: number | null;
  status: string;
  created_at: string;
  user: { full_name: string | null; email: string | null };
  provisioning_status: string;
  last_deposit_at: string | null;
};

export const listAdminWalletAccounts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminWalletAccountRow[]> => {
    await assertAdmin(context as AuthCtx);
    const db = await admin();
    const [
      { data: accounts, error },
      { data: profiles, error: profilesError },
      { data: jobs, error: jobsError },
      { data: deposits, error: depositsError },
    ] = await Promise.all([
      db
        .from("wallet_accounts")
        .select("id, user_id, network, address, destination_tag, status, created_at")
        .order("created_at", { ascending: false })
        .limit(2000),
      db.from("profiles").select("id, full_name, email").limit(2000),
      db
        .from("custody_provisioning_jobs")
        .select("user_id, network, status, updated_at")
        .order("updated_at", { ascending: false })
        .limit(4000),
      db
        .from("deposit_observations")
        .select("wallet_account_id, observed_at")
        .order("observed_at", { ascending: false })
        .limit(4000),
    ]);
    if (error || profilesError || jobsError || depositsError)
      throw new Error(
        error?.message ??
          profilesError?.message ??
          jobsError?.message ??
          depositsError?.message ??
          "Could not load wallet accounts.",
      );
    const users = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
    const jobStatus = new Map<string, string>();
    for (const job of jobs ?? []) {
      const key = `${job.user_id}:${job.network}`;
      if (!jobStatus.has(key)) jobStatus.set(key, job.status);
    }
    const lastDeposit = new Map<string, string>();
    for (const deposit of deposits ?? [])
      if (deposit.wallet_account_id && !lastDeposit.has(deposit.wallet_account_id))
        lastDeposit.set(deposit.wallet_account_id, deposit.observed_at);
    return (accounts ?? []).map((account) => ({
      ...account,
      user: {
        full_name: users.get(account.user_id)?.full_name ?? null,
        email: users.get(account.user_id)?.email ?? null,
      },
      provisioning_status: jobStatus.get(`${account.user_id}:${account.network}`) ?? "unknown",
      last_deposit_at: lastDeposit.get(account.id) ?? null,
    }));
  });

export type AdminTreasuryOperationRow = {
  id: string;
  operation_type: string;
  asset: string;
  network: string;
  amount: number;
  from_location: string;
  to_location: string;
  destination_address: string | null;
  reason: string;
  status: string;
  requested_by: string | null;
  requested_at: string;
};

export type AdminTreasuryBalanceRow = {
  wallet_account_id: string;
  label: string;
  network: string;
  address: string;
  wallet_type: string;
  wallet_status: string;
  asset: string;
  balance: number;
  amount_usd: number | null;
  block_number: number | null;
  block_hash: string | null;
  observed_at: string;
};

export type AdminCompanyTreasuryWalletRow = {
  id: string;
  label: string;
  turnkey_created_at: string | null;
  turnkey_wallet_id: string | null;
  network: string;
  address: string;
  wallet_type: string;
  status: string;
  created_at: string;
  balances: {
    asset: string;
    balance: number;
    amount_usd: number | null;
    block_number: number | null;
    observed_at: string;
  }[];
};

export const listAdminCompanyTreasuryWallets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminCompanyTreasuryWalletRow[]> => {
    await assertAdmin(context as AuthCtx);
    const db = await admin();
    const [{ data: wallets, error: walletError }, { data: observations, error: observationError }] =
      await Promise.all([
        db
          .from("treasury_wallet_accounts")
          .select(
            "id, label, turnkey_wallet_id, turnkey_created_at, network, address, wallet_type, status, created_at",
          )
          .not("turnkey_wallet_id", "is", null)
          .order("created_at", { ascending: true })
          .limit(100),
        db
          .from("treasury_latest_balance_observations")
          .select("wallet_account_id, asset, balance, amount_usd, block_number, observed_at")
          .order("observed_at", { ascending: false })
          .limit(500),
      ]);
    if (walletError || observationError) {
      throw new Error(
        walletError?.message ??
          observationError?.message ??
          "Could not load company treasury wallets.",
      );
    }

    const balancesByWallet = new Map<string, AdminCompanyTreasuryWalletRow["balances"]>();
    for (const observation of observations ?? []) {
      if (!observation.wallet_account_id || !observation.asset || !observation.observed_at) continue;
      const current = balancesByWallet.get(observation.wallet_account_id) ?? [];
      current.push({
        asset: observation.asset,
        balance: Number(observation.balance),
        amount_usd: observation.amount_usd == null ? null : Number(observation.amount_usd),
        block_number: observation.block_number,
        observed_at: observation.observed_at,
      });
      balancesByWallet.set(observation.wallet_account_id, current);
    }

    return (wallets ?? []).map((wallet) => ({
      ...wallet,
      balances: balancesByWallet.get(wallet.id) ?? [],
    }));
  });

async function invokeCompanyTreasuryEdgeFunction(body: Record<string, unknown>) {
  const request = await import("@tanstack/react-start/server").then(({ getRequest }) =>
    getRequest(),
  );
  const authorization = request.headers.get("authorization");
  const supabaseUrl = process.env["SUPABASE_URL"];
  const publishableKey =
    process.env["SUPABASE_PUBLISHABLE_KEY"] || process.env["SUPABASE_ANON_KEY"];
  if (!authorization || !supabaseUrl || !publishableKey) {
    throw new Error("Treasury service is not configured on the application server.");
  }

  const response = await fetch(
    `${supabaseUrl.replace(/\/+$/, "")}/functions/v1/company-treasury-admin`,
    {
      method: "POST",
      headers: {
        authorization,
        apikey: publishableKey,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    },
  );
  const payload: unknown = await response.json().catch(() => null);
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("The treasury service returned an invalid response.");
  }
  const result = payload as Record<string, unknown>;
  if (!response.ok) {
    throw new Error(
      typeof result.error === "string" ? result.error : "The treasury service request failed.",
    );
  }
  return result;
}

export const discoverAdminCompanyTreasuryWallets = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(
    async ({ context }): Promise<{ walletId: string; walletName: string; createdAt: string }[]> => {
      await assertAdmin(context as AuthCtx);
      const result = await invokeCompanyTreasuryEdgeFunction({ action: "discover" });
      if (!Array.isArray(result.wallets)) {
        throw new Error("The treasury service returned an invalid discovery result.");
      }
      return result.wallets as {
        walletId: string;
        walletName: string;
        createdAt: string;
      }[];
    },
  );

export const syncAdminCompanyTreasuryWallets = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { walletIds: string[] }) => {
    if (
      !Array.isArray(data.walletIds) ||
      data.walletIds.length !== 4 ||
      data.walletIds.some((id) => typeof id !== "string" || !id.trim()) ||
      new Set(data.walletIds.map((id) => id.trim())).size !== 4
    ) {
      throw new Error("Select exactly four unique existing Turnkey wallets.");
    }
    return { walletIds: data.walletIds.map((id) => id.trim()) };
  })
  .handler(
    async ({
      data,
      context,
    }): Promise<{
      synchronized: number;
      wallets: {
        walletId: string;
        walletName: string;
        createdAt: string;
        network: string;
        address: string;
      }[];
    }> => {
      await assertAdmin(context as AuthCtx);
      const result = await invokeCompanyTreasuryEdgeFunction({
        action: "sync",
        walletIds: data.walletIds,
      });
      if (typeof result.synchronized !== "number" || !Array.isArray(result.wallets)) {
        throw new Error("The treasury service returned an invalid synchronization result.");
      }
      return {
        synchronized: result.synchronized,
        wallets: result.wallets as {
          walletId: string;
          walletName: string;
          createdAt: string;
          network: string;
          address: string;
        }[],
      };
    },
  );

export const refreshAdminCompanyTreasuryWallet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { walletAccountId: string }) => {
    if (!/^[0-9a-f-]{36}$/i.test(data.walletAccountId)) {
      throw new Error("Invalid company treasury wallet.");
    }
    return { walletAccountId: data.walletAccountId };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context as AuthCtx);
    const result = await invokeCompanyTreasuryEdgeFunction({
      action: "refresh",
      walletAccountId: data.walletAccountId,
    });
    if (!Array.isArray(result.balances)) {
      throw new Error("The treasury service returned an invalid balance result.");
    }
    return result.balances as {
      asset: string;
      balance: string;
      blockNumber: number | null;
      observedAt: string;
    }[];
  });

export const listAdminTreasuryBalances = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminTreasuryBalanceRow[]> => {
    await assertAdmin(context as AuthCtx);
    const db = await admin();
    const [{ data: wallets, error: walletError }, { data: snapshots, error: snapshotError }] =
      await Promise.all([
        db
          .from("treasury_wallet_accounts")
          .select("id, label, network, address, wallet_type, status")
          .order("network", { ascending: true })
          .limit(2000),
        db
          .from("treasury_latest_balance_observations")
          .select(
            "wallet_account_id, asset, balance, amount_usd, block_number, block_hash, observed_at",
          )
          .order("observed_at", { ascending: false })
          .limit(5000),
      ]);
    if (walletError || snapshotError)
      throw new Error(
        walletError?.message ??
          snapshotError?.message ??
          "Could not load treasury balance observations.",
      );
    const accounts = new Map((wallets ?? []).map((wallet) => [wallet.id, wallet]));
    return (snapshots ?? []).flatMap((snapshot) => {
      if (!snapshot.wallet_account_id || !snapshot.asset || !snapshot.observed_at) return [];
      const wallet = accounts.get(snapshot.wallet_account_id);
      if (!wallet) return [];
      return [
        {
          wallet_account_id: wallet.id,
          label: wallet.label,
          network: wallet.network,
          address: wallet.address,
          wallet_type: wallet.wallet_type,
          wallet_status: wallet.status,
          asset: snapshot.asset,
          balance: Number(snapshot.balance),
          amount_usd: snapshot.amount_usd == null ? null : Number(snapshot.amount_usd),
          block_number: snapshot.block_number,
          block_hash: snapshot.block_hash,
          observed_at: snapshot.observed_at,
        },
      ];
    });
  });

export const listAdminTreasuryOperationRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminTreasuryOperationRow[]> => {
    await assertAdmin(context as AuthCtx);
    const db = await admin();
    const { data, error } = await db
      .from("treasury_operation_requests")
      .select("*")
      .order("requested_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const requestAdminTreasuryOperation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      operationType: "transfer" | "top_up" | "withdraw" | "rebalance";
      asset: string;
      network: string;
      amount: number;
      fromLocation: string;
      toLocation: string;
      destinationAddress?: string;
      reason: string;
    }) => {
      const amount = Number(d.amount);
      const destinationAddress = (d.destinationAddress ?? "").trim();
      const reason = d.reason.trim().slice(0, 500);
      const fromLocation = d.fromLocation.trim().slice(0, 120);
      const toLocation = d.toLocation.trim().slice(0, 120);
      if (
        !["transfer", "top_up", "withdraw", "rebalance"].includes(d.operationType) ||
        !/^[A-Z0-9]{2,12}$/.test(d.asset) ||
        !["bitcoin-testnet", "ethereum-sepolia", "solana-devnet", "xrpl-testnet"].includes(
          d.network,
        ) ||
        !Number.isFinite(amount) ||
        amount <= 0 ||
        amount > 1_000_000_000 ||
        !fromLocation ||
        !toLocation ||
        fromLocation === toLocation ||
        !reason ||
        (d.operationType === "withdraw" && !destinationAddress)
      ) {
        throw new Error(
          "Enter valid operation details and a reason. Withdrawals require a destination address.",
        );
      }
      return {
        operationType: d.operationType,
        asset: d.asset,
        network: d.network,
        amount,
        fromLocation,
        toLocation,
        destinationAddress: destinationAddress || null,
        reason,
      };
    },
  )
  .handler(async ({ data, context }) => {
    const ctx = context as AuthCtx;
    await assertAdmin(ctx);
    const db = await admin();
    const { data: asset, error: assetError } = await db
      .from("platform_asset_networks")
      .select("enabled")
      .eq("asset", data.asset)
      .eq("network", data.network)
      .maybeSingle();
    if (assetError || !asset?.enabled)
      throw new Error(assetError?.message ?? "This asset/network is not enabled.");
    const { data: request, error } = await db
      .from("treasury_operation_requests")
      .insert({
        operation_type: data.operationType,
        asset: data.asset,
        network: data.network,
        amount: data.amount,
        from_location: data.fromLocation,
        to_location: data.toLocation,
        destination_address: data.destinationAddress,
        reason: data.reason,
        requested_by: ctx.userId,
        status: "requested",
      })
      .select("id, status")
      .single();
    if (error || !request) throw new Error(error?.message ?? "Could not create treasury request.");
    return request;
  });

export const cancelAdminTreasuryOperation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => {
    if (!/^[0-9a-f-]{36}$/i.test(d.id)) throw new Error("Invalid request.");
    return { id: d.id };
  })
  .handler(async ({ data, context }) => {
    const ctx = context as AuthCtx;
    await assertAdmin(ctx);
    const db = await admin();
    const { data: row, error } = await db
      .from("treasury_operation_requests")
      .update({
        status: "cancelled",
        cancelled_by: ctx.userId,
        cancelled_at: new Date().toISOString(),
      })
      .eq("id", data.id)
      .eq("status", "requested")
      .select("id")
      .maybeSingle();
    if (error || !row)
      throw new Error(error?.message ?? "Request is not pending or was already cancelled.");
    return { ok: true };
  });

export type AdminUserRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  created_at: string;
  account_status: string;
  admin_note: string | null;
  kyc: string;
};

export const listAdminUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminUserRow[]> => {
    await assertAdmin(context as AuthCtx);
    const db = await admin();
    const [{ data: profiles, error }, { data: mgmt }, { data: verifs }] = await Promise.all([
      db
        .from("profiles")
        .select("id, full_name, email, phone, country, created_at")
        .order("created_at", { ascending: false })
        .limit(500),
      db.from("admin_user_management").select("user_id, account_status, admin_note"),
      db
        .from("account_verifications")
        .select("user_id, status, created_at")
        .order("created_at", { ascending: false }),
    ]);
    if (error) throw new Error(error.message);
    const kyc = new Map<string, string>();
    for (const v of verifs ?? []) if (!kyc.has(v.user_id)) kyc.set(v.user_id, v.status);
    const m = new Map((mgmt ?? []).map((r) => [r.user_id, r]));
    return (profiles ?? []).map((p) => ({
      ...p,
      account_status: m.get(p.id)?.account_status ?? "active",
      admin_note: m.get(p.id)?.admin_note ?? null,
      kyc: kyc.get(p.id) ?? "none",
    }));
  });

export type AdminTradeOrderRow = {
  id: string;
  user_id: string;
  type: "Buy" | "Sell";
  coin: string;
  network: string;
  crypto_amount: number;
  usd_amount: number;
  fee_usd: number;
  price_usd: number;
  settlement_usd: number;
  status: string;
  tx_hash: string | null;
  created_at: string;
  user: { full_name: string | null; email: string | null };
};

export const listAdminTradeOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminTradeOrderRow[]> => {
    await assertAdmin(context as AuthCtx);
    const db = await admin();
    const [
      { data: buys, error: buyError },
      { data: sells, error: sellError },
      { data: profiles, error: profileError },
    ] = await Promise.all([
      db
        .from("crypto_buys")
        .select(
          "id, user_id, coin, network, crypto_amount, usd_amount, fee_usd, total_usd, price_usd, status, tx_hash, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(1000),
      db
        .from("crypto_sells")
        .select(
          "id, user_id, coin, network, crypto_amount, usd_amount, fee_usd, payout_usd, price_usd, status, tx_hash, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(1000),
      db.from("profiles").select("id, full_name, email").limit(2000),
    ]);
    if (buyError || sellError || profileError)
      throw new Error(
        buyError?.message ??
          sellError?.message ??
          profileError?.message ??
          "Could not load buy/sell orders.",
      );
    const users = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
    const orders: Omit<AdminTradeOrderRow, "user">[] = [
      ...(buys ?? []).map((row) => ({
        id: row.id,
        user_id: row.user_id,
        type: "Buy" as const,
        coin: row.coin,
        network: row.network,
        crypto_amount: Number(row.crypto_amount),
        usd_amount: Number(row.usd_amount),
        fee_usd: Number(row.fee_usd),
        price_usd: Number(row.price_usd),
        settlement_usd: Number(row.total_usd),
        status: row.status,
        tx_hash: row.tx_hash,
        created_at: row.created_at,
      })),
      ...(sells ?? []).map((row) => ({
        id: row.id,
        user_id: row.user_id,
        type: "Sell" as const,
        coin: row.coin,
        network: row.network,
        crypto_amount: Number(row.crypto_amount),
        usd_amount: Number(row.usd_amount),
        fee_usd: Number(row.fee_usd),
        price_usd: Number(row.price_usd),
        settlement_usd: Number(row.payout_usd),
        status: row.status,
        tx_hash: row.tx_hash,
        created_at: row.created_at,
      })),
    ];
    return orders
      .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
      .map((order) => ({
        ...order,
        user: {
          full_name: users.get(order.user_id)?.full_name ?? null,
          email: users.get(order.user_id)?.email ?? null,
        },
      }));
  });

export type AdminTradeSettingRow = {
  coin: string;
  network: string;
  buy_price_usd: number;
  sell_price_usd: number;
  minimum_crypto_amount: number;
  maximum_crypto_amount: number;
  buy_enabled: boolean;
  sell_enabled: boolean;
  updated_at: string;
};

export const listAdminTradeSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminTradeSettingRow[]> => {
    await assertAdmin(context as AuthCtx);
    const db = await admin();
    const { data, error } = await db
      .from("trade_asset_settings")
      .select(
        "coin, network, buy_price_usd, sell_price_usd, minimum_crypto_amount, maximum_crypto_amount, buy_enabled, sell_enabled, updated_at",
      )
      .order("coin", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export type AdminTradeSettingsAuditRow = {
  id: string;
  coin: string;
  network: string;
  admin_id: string | null;
  admin_name: string | null;
  previous_buy_price_usd: number;
  next_buy_price_usd: number;
  previous_sell_price_usd: number;
  next_sell_price_usd: number;
  previous_minimum_crypto_amount: number;
  next_minimum_crypto_amount: number;
  previous_maximum_crypto_amount: number;
  next_maximum_crypto_amount: number;
  previous_buy_enabled: boolean;
  next_buy_enabled: boolean;
  previous_sell_enabled: boolean;
  next_sell_enabled: boolean;
  note: string;
  created_at: string;
};

export const listAdminTradeSettingsAudit = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminTradeSettingsAuditRow[]> => {
    await assertAdmin(context as AuthCtx);
    const db = await admin();
    const [{ data: audit, error }, { data: profiles, error: profileError }] = await Promise.all([
      db
        .from("admin_trade_settings_audit")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500),
      db.from("profiles").select("id, full_name, email").limit(1000),
    ]);
    if (error || profileError)
      throw new Error(
        error?.message ?? profileError?.message ?? "Could not load trade settings history.",
      );
    const names = new Map(
      (profiles ?? []).map((profile) => [
        profile.id,
        profile.full_name || profile.email || profile.id,
      ]),
    );
    return (audit ?? []).map((row) => ({
      ...row,
      admin_name: row.admin_id ? (names.get(row.admin_id) ?? null) : null,
      previous_buy_price_usd: Number(row.previous_buy_price_usd),
      next_buy_price_usd: Number(row.next_buy_price_usd),
      previous_sell_price_usd: Number(row.previous_sell_price_usd),
      next_sell_price_usd: Number(row.next_sell_price_usd),
      previous_minimum_crypto_amount: Number(row.previous_minimum_crypto_amount),
      next_minimum_crypto_amount: Number(row.next_minimum_crypto_amount),
      previous_maximum_crypto_amount: Number(row.previous_maximum_crypto_amount),
      next_maximum_crypto_amount: Number(row.next_maximum_crypto_amount),
    }));
  });

export const updateAdminTradeSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      coin: string;
      network: string;
      buyPrice: number;
      sellPrice: number;
      minimumCrypto: number;
      maximumCrypto: number;
      buyEnabled: boolean;
      sellEnabled: boolean;
      note: string;
    }) => {
      const buyPrice = Number(d.buyPrice);
      const sellPrice = Number(d.sellPrice);
      const minimumCrypto = Number(d.minimumCrypto);
      const maximumCrypto = Number(d.maximumCrypto);
      const note = d.note.trim().slice(0, 500);
      if (
        !/^[A-Z0-9]{2,12}$/.test(d.coin) ||
        !["Bitcoin", "Ethereum", "Ethereum (ERC-20)", "Solana", "XRP Ledger"].includes(d.network) ||
        ![buyPrice, sellPrice].every(
          (value) => Number.isFinite(value) && value > 0 && value <= 1_000_000_000,
        ) ||
        ![minimumCrypto, maximumCrypto].every(
          (value) => Number.isFinite(value) && value > 0 && value <= 1_000_000_000,
        ) ||
        minimumCrypto > maximumCrypto ||
        typeof d.buyEnabled !== "boolean" ||
        typeof d.sellEnabled !== "boolean" ||
        !note
      ) {
        throw new Error("Enter valid prices, order limits, trading switches, and a reason.");
      }
      return {
        coin: d.coin,
        network: d.network,
        buyPrice,
        sellPrice,
        minimumCrypto,
        maximumCrypto,
        buyEnabled: d.buyEnabled,
        sellEnabled: d.sellEnabled,
        note,
      };
    },
  )
  .handler(async ({ data, context }) => {
    const ctx = context as AuthCtx;
    await assertAdmin(ctx);
    const db = await admin();
    const { error } = await db.rpc("admin_update_trade_asset_settings", {
      _coin: data.coin,
      _network: data.network,
      _admin_id: ctx.userId,
      _buy_price_usd: data.buyPrice,
      _sell_price_usd: data.sellPrice,
      _minimum_crypto_amount: data.minimumCrypto,
      _maximum_crypto_amount: data.maximumCrypto,
      _buy_enabled: data.buyEnabled,
      _sell_enabled: data.sellEnabled,
      _note: data.note,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export type AdminTransactionRow = {
  id: string;
  user_id: string;
  kind: string;
  direction: string;
  coin: string | null;
  network: string | null;
  crypto_amount: number | null;
  usd_amount: number;
  fee_usd: number;
  price_usd: number;
  reference: string | null;
  counterparty: string | null;
  status: string;
  tx_hash: string | null;
  note: string | null;
  created_at: string;
  user: { full_name: string | null; email: string | null };
};

export const listAdminTransactions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminTransactionRow[]> => {
    await assertAdmin(context as AuthCtx);
    const db = await admin();
    const [{ data: transactions, error }, { data: profiles, error: profileError }] =
      await Promise.all([
        db
          .from("transactions")
          .select(
            "id, user_id, kind, direction, coin, network, crypto_amount, usd_amount, fee_usd, price_usd, reference, counterparty, status, tx_hash, note, created_at",
          )
          .order("created_at", { ascending: false })
          .limit(1000),
        db.from("profiles").select("id, full_name, email").limit(2000),
      ]);
    if (error || profileError)
      throw new Error(error?.message ?? profileError?.message ?? "Could not load transactions.");
    const users = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
    return (transactions ?? []).map((transaction) => ({
      ...transaction,
      user: {
        full_name: users.get(transaction.user_id)?.full_name ?? null,
        email: users.get(transaction.user_id)?.email ?? null,
      },
    }));
  });

export type AdminDepositRow = {
  id: string;
  user_id: string | null;
  wallet_account_id: string | null;
  network: string;
  asset: string;
  tx_hash: string;
  event_index: number;
  deposit_address: string;
  destination_tag: number | null;
  crypto_amount: number;
  amount_usd: number | null;
  block_number: number | null;
  block_hash: string | null;
  confirmations: number;
  required_confirmations: number;
  below_minimum: boolean;
  status: "pending" | "confirmed" | "failed";
  failure_reason: string | null;
  observed_at: string;
  confirmed_at: string | null;
  user: { full_name: string | null; email: string | null } | null;
};

export const listAdminDeposits = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminDepositRow[]> => {
    await assertAdmin(context as AuthCtx);
    const db = await admin();
    const [{ data: deposits, error }, { data: profiles, error: profileError }] = await Promise.all([
      db
        .from("deposit_observations")
        .select(
          "id, user_id, wallet_account_id, network, asset, tx_hash, event_index, deposit_address, destination_tag, crypto_amount, amount_usd, block_number, block_hash, confirmations, required_confirmations, below_minimum, status, failure_reason, observed_at, confirmed_at",
        )
        .order("observed_at", { ascending: false })
        .limit(2000),
      db.from("profiles").select("id, full_name, email").limit(2000),
    ]);
    if (error || profileError)
      throw new Error(
        error?.message ?? profileError?.message ?? "Could not load deposit observations.",
      );
    const users = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
    const rows = deposits ?? [];
    if (rows.some((deposit) => !["pending", "confirmed", "failed"].includes(deposit.status)))
      throw new Error("A deposit record has an unsupported status.");
    return rows.map((deposit) => ({
      ...deposit,
      status: deposit.status as AdminDepositRow["status"],
      user: deposit.user_id
        ? {
            full_name: users.get(deposit.user_id)?.full_name ?? null,
            email: users.get(deposit.user_id)?.email ?? null,
          }
        : null,
    }));
  });

export const setAdminUserStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; status: "active" | "suspended"; note?: string }) => {
    if (!/^[0-9a-f-]{36}$/i.test(d.userId) || !["active", "suspended"].includes(d.status))
      throw new Error("Invalid input.");
    return { userId: d.userId, status: d.status, note: (d.note ?? "").slice(0, 500) || null };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context as AuthCtx);
    const db = await admin();
    const { data: current } = await db
      .from("admin_user_management")
      .select("account_status")
      .eq("user_id", data.userId)
      .maybeSingle();
    if (current?.account_status === "deleted")
      throw new Error("This user was deleted and cannot be reactivated here.");
    const { error: authError } = await db.auth.admin.updateUserById(data.userId, {
      ban_duration: data.status === "suspended" ? "876000h" : "none",
    });
    if (authError) throw new Error(authError.message);
    const { error } = await db.from("admin_user_management").upsert({
      user_id: data.userId,
      account_status: data.status,
      admin_note: data.note,
      updated_by: (context as AuthCtx).userId,
    });
    if (error) {
      await db.auth.admin.updateUserById(data.userId, {
        ban_duration: data.status === "suspended" ? "none" : "876000h",
      });
      throw new Error(error.message);
    }
    return { ok: true };
  });

export const getAdminUserDetails = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string }) => {
    if (!/^[0-9a-f-]{36}$/i.test(d.userId)) throw new Error("Invalid user.");
    return { userId: d.userId };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context as AuthCtx);
    const db = await admin();
    const [
      profileResult,
      authResult,
      managementResult,
      verificationResult,
      transactionResult,
      fundingResult,
      walletResult,
      buyResult,
      sellResult,
      balanceResult,
    ] = await Promise.all([
      db.from("profiles").select("*").eq("id", data.userId).maybeSingle(),
      db.auth.admin.getUserById(data.userId),
      db
        .from("admin_user_management")
        .select("account_status, admin_note, updated_at, updated_by")
        .eq("user_id", data.userId)
        .maybeSingle(),
      db
        .from("account_verifications")
        .select("id, address, id_document_type, ssn_last4, status, reviewer_note, created_at")
        .eq("user_id", data.userId)
        .order("created_at", { ascending: false }),
      db
        .from("transactions")
        .select(
          "id, kind, direction, coin, network, crypto_amount, usd_amount, fee_usd, reference, counterparty, status, note, created_at",
        )
        .eq("user_id", data.userId)
        .order("created_at", { ascending: false })
        .limit(100),
      db
        .from("wallet_fundings")
        .select("id, amount, currency, payment_method, reference, status, created_at")
        .eq("user_id", data.userId)
        .order("created_at", { ascending: false })
        .limit(100),
      db
        .from("wallet_accounts")
        .select("network, address, destination_tag, status")
        .eq("user_id", data.userId),
      db
        .from("crypto_buys")
        .select(
          "id, coin, network, crypto_amount, usd_amount, fee_usd, total_usd, status, created_at",
        )
        .eq("user_id", data.userId)
        .order("created_at", { ascending: false })
        .limit(100),
      db
        .from("crypto_sells")
        .select(
          "id, coin, network, crypto_amount, usd_amount, fee_usd, payout_usd, status, created_at",
        )
        .eq("user_id", data.userId)
        .order("created_at", { ascending: false })
        .limit(100),
      db.rpc("admin_get_user_balance", {
        _target_user_id: data.userId,
        _admin_id: (context as AuthCtx).userId,
      }),
    ]);
    if (profileResult.error || !profileResult.data)
      throw new Error(profileResult.error?.message ?? "User not found.");
    for (const result of [
      verificationResult,
      transactionResult,
      fundingResult,
      walletResult,
      buyResult,
      sellResult,
    ]) {
      if (result.error) throw new Error(result.error.message);
    }
    const transactions = transactionResult.data ?? [];
    if (balanceResult.error) throw new Error(balanceResult.error.message);
    const authUser = authResult.data.user;
    return {
      profile: profileResult.data,
      auth: authUser
        ? {
            created_at: authUser.created_at,
            last_sign_in_at: authUser.last_sign_in_at,
            banned_until: authUser.banned_until,
          }
        : null,
      management: managementResult.data ?? {
        account_status: "active",
        admin_note: null,
        updated_at: null,
        updated_by: null,
      },
      balance_usd: Number(balanceResult.data ?? 0),
      verifications: verificationResult.data ?? [],
      transactions,
      fundings: fundingResult.data ?? [],
      wallet_accounts: walletResult.data ?? [],
      buys: buyResult.data ?? [],
      sells: sellResult.data ?? [],
    };
  });

export const adjustAdminUserBalance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: { userId: string; direction: "credit" | "debit"; amount: number; note: string }) => {
      const amount = Number(d.amount);
      const note = d.note.trim().slice(0, 500);
      if (
        !/^[0-9a-f-]{36}$/i.test(d.userId) ||
        !["credit", "debit"].includes(d.direction) ||
        !Number.isFinite(amount) ||
        amount < 0.01 ||
        amount > 1_000_000 ||
        Math.round(amount * 100) !== amount * 100 ||
        !note
      ) {
        throw new Error("Enter a valid user, amount, and adjustment reason.");
      }
      return { userId: d.userId, direction: d.direction, amount, note };
    },
  )
  .handler(async ({ data, context }) => {
    const ctx = context as AuthCtx;
    await assertAdmin(ctx);
    const db = await admin();
    const { data: adjustment, error } = await db.rpc("admin_adjust_user_balance", {
      _target_user_id: data.userId,
      _admin_id: ctx.userId,
      _direction: data.direction,
      _amount: data.amount,
      _note: data.note,
    });
    if (error) throw new Error(error.message);
    return adjustment;
  });

export const deleteAdminUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; confirmation: string }) => {
    if (!/^[0-9a-f-]{36}$/i.test(d.userId) || !d.confirmation.trim())
      throw new Error("Confirm the user email to continue.");
    return { userId: d.userId, confirmation: d.confirmation.trim().toLowerCase() };
  })
  .handler(async ({ data, context }) => {
    const ctx = context as AuthCtx;
    await assertAdmin(ctx);
    if (data.userId === ctx.userId) throw new Error("You cannot delete your own admin account.");
    const db = await admin();
    const [{ data: profile, error: profileError }, { data: roles, error: rolesError }] =
      await Promise.all([
        db.from("profiles").select("email").eq("id", data.userId).maybeSingle(),
        db.from("user_roles").select("role").eq("user_id", data.userId),
      ]);
    if (profileError || !profile?.email)
      throw new Error(profileError?.message ?? "User not found.");
    if (rolesError) throw new Error(rolesError.message);
    if ((roles ?? []).some((role) => role.role === "admin"))
      throw new Error("An admin account cannot be deleted from user management.");
    if (profile.email.trim().toLowerCase() !== data.confirmation)
      throw new Error("The confirmation email does not match.");
    const [{ data: balance, error: balanceError }, { count: pendingCount, error: pendingError }] =
      await Promise.all([
        db.rpc("admin_get_user_balance", { _target_user_id: data.userId, _admin_id: ctx.userId }),
        db
          .from("transactions")
          .select("id", { count: "exact", head: true })
          .eq("user_id", data.userId)
          .eq("status", "pending"),
      ]);
    if (balanceError || pendingError)
      throw new Error(
        balanceError?.message ?? pendingError?.message ?? "Could not verify account activity.",
      );
    if (Number(balance ?? 0) !== 0 || (pendingCount ?? 0) > 0)
      throw new Error(
        "Resolve this user's balance and pending transactions before disabling account access.",
      );

    const { error: banError } = await db.auth.admin.updateUserById(data.userId, {
      ban_duration: "876000h",
    });
    if (banError) throw new Error(banError.message);
    const { error } = await db.from("admin_user_management").upsert({
      user_id: data.userId,
      account_status: "deleted",
      admin_note: "Account access disabled by admin. Financial and custody records retained.",
      updated_by: ctx.userId,
    });
    if (error) {
      await db.auth.admin.updateUserById(data.userId, { ban_duration: "none" });
      throw new Error(error.message);
    }
    return { ok: true, recordsRetained: true };
  });

export type AdminDeletionRequest = {
  id: string;
  user_id: string;
  status: string;
  requested_at: string;
  profile: {
    full_name: string | null;
    email: string | null;
    phone: string | null;
    country: string | null;
  };
};

export const requestAccountDeletion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { confirmation: string }) => {
    if (d.confirmation.trim().toUpperCase() !== "DELETE")
      throw new Error("Type DELETE to confirm.");
    return { confirmation: "DELETE" };
  })
  .handler(async ({ context }) => {
    const userId = (context as AuthCtx).userId;
    const db = await admin();
    const { data: existing, error: existingError } = await db
      .from("account_deletion_requests")
      .select("id, status")
      .eq("user_id", userId)
      .in("status", ["pending", "reviewing", "approved"])
      .maybeSingle();
    if (existingError) throw new Error(existingError.message);
    if (existing) return { id: existing.id, status: existing.status };
    const { data, error } = await db
      .from("account_deletion_requests")
      .insert({ user_id: userId, status: "pending" })
      .select("id, status")
      .single();
    if (error || !data)
      throw new Error(error?.message ?? "Could not submit account deletion request.");
    return { id: data.id, status: data.status };
  });

export const listAccountDeletionRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminDeletionRequest[]> => {
    await assertAdmin(context as AuthCtx);
    const db = await admin();
    const [{ data: requests, error }, { data: profiles, error: profileError }] = await Promise.all([
      db
        .from("account_deletion_requests")
        .select("id, user_id, status, requested_at")
        .order("requested_at", { ascending: false })
        .limit(500),
      db.from("profiles").select("id, full_name, email, phone, country").limit(1000),
    ]);
    if (error || profileError)
      throw new Error(
        error?.message ?? profileError?.message ?? "Could not load deletion requests.",
      );
    const byId = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
    return (requests ?? []).map((request) => ({
      ...request,
      profile: {
        full_name: byId.get(request.user_id)?.full_name ?? null,
        email: byId.get(request.user_id)?.email ?? null,
        phone: byId.get(request.user_id)?.phone ?? null,
        country: byId.get(request.user_id)?.country ?? null,
      },
    }));
  });

export const exportAccountDataForDeletionRequest = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { requestId: string }) => {
    if (!/^[0-9a-f-]{36}$/i.test(d.requestId)) throw new Error("Invalid request.");
    return { requestId: d.requestId };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context as AuthCtx);
    const db = await admin();
    const { data: request, error: requestError } = await db
      .from("account_deletion_requests")
      .select("id, user_id, status, requested_at")
      .eq("id", data.requestId)
      .maybeSingle();
    if (requestError || !request) throw new Error("Deletion request not found.");
    const userId = request.user_id;
    const tables = [
      ["profile", "profiles", "id"],
      ["verifications", "account_verifications", "user_id"],
      ["verification_reviews", "admin_verification_reviews", "user_id"],
      ["transactions", "transactions", "user_id"],
      ["fundings", "wallet_fundings", "user_id"],
      ["receives", "crypto_receives", "user_id"],
      ["sends", "crypto_sends", "user_id"],
      ["buys", "crypto_buys", "user_id"],
      ["sells", "crypto_sells", "user_id"],
      ["wallet_accounts", "wallet_accounts", "user_id"],
    ] as const;
    const entries = await Promise.all(
      tables.map(async ([key, table, column]) => {
        const { data: rows, error } = await (db as any).from(table).select("*").eq(column, userId);
        if (error) throw new Error(`Could not export ${key}: ${error.message}`);
        return [key, rows ?? []] as const;
      }),
    );
    const { data: referrals, error: referralError } = await db
      .from("admin_referrals")
      .select("*")
      .or(`referrer_id.eq.${userId},referred_id.eq.${userId}`);
    if (referralError) throw new Error(`Could not export referrals: ${referralError.message}`);
    return {
      exported_at: new Date().toISOString(),
      deletion_request: {
        id: request.id,
        status: request.status,
        requested_at: request.requested_at,
      },
      account: { ...Object.fromEntries(entries), referrals: referrals ?? [] },
    };
  });

export type AdminVerificationRow = {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  country: string;
  address: string;
  id_document_type: string;
  ssn_last4: string | null;
  status: string;
  reviewer_note: string | null;
  created_at: string;
};

export const listAdminVerifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminVerificationRow[]> => {
    await assertAdmin(context as AuthCtx);
    const db = await admin();
    const { data, error } = await db
      .from("account_verifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const reviewVerification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; decision: "approved" | "rejected"; note?: string }) => {
    if (!/^[0-9a-f-]{36}$/i.test(d.id) || !["approved", "rejected"].includes(d.decision))
      throw new Error("Invalid input.");
    const note = (d.note ?? "").trim().slice(0, 500);
    if (d.decision === "rejected" && !note)
      throw new Error("Give the member a reason for the rejection.");
    return { id: d.id, decision: d.decision, note: note || null };
  })
  .handler(async ({ data, context }) => {
    const ctx = context as AuthCtx;
    await assertAdmin(ctx);
    const db = await admin();
    const { data: row, error } = await db
      .from("account_verifications")
      .update({ status: data.decision, reviewer_note: data.note })
      .eq("id", data.id)
      .select("*")
      .single();
    if (error || !row) throw new Error(error?.message ?? "Verification not found.");
    let emailStatus = "not_sent";
    try {
      emailStatus = await notifyVerificationDecision({
        id: row.id,
        email: row.email,
        name: row.full_name,
        decision: data.decision,
        note: data.note,
      });
    } catch (e) {
      console.error("Verification email failed:", e);
      emailStatus = "failed";
    }
    await db.from("admin_verification_reviews").insert({
      verification_id: row.id,
      user_id: row.user_id,
      reviewer_id: ctx.userId,
      decision: data.decision,
      note: data.note,
      email_status: emailStatus,
    });
    return { status: row.status, emailStatus };
  });

export type AdminReferralRow = {
  id: string;
  referral_code: string;
  reward_usd: number;
  status: string;
  admin_note: string | null;
  created_at: string;
  referrer: { id: string; name: string | null; email: string | null };
  referred: { id: string; name: string | null; email: string | null };
};

export const listAdminReferrals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(
    async ({
      context,
    }): Promise<{
      referrals: AdminReferralRow[];
      codes: {
        id: string;
        name: string | null;
        email: string | null;
        code: string | null;
        count: number;
      }[];
    }> => {
      await assertAdmin(context as AuthCtx);
      const db = await admin();
      const [{ data: refs, error }, { data: profiles }] = await Promise.all([
        db
          .from("admin_referrals")
          .select(
            "id, referrer_id, referred_id, referral_code, reward_usd, status, admin_note, created_at",
          )
          .order("created_at", { ascending: false })
          .limit(500),
        db.from("profiles").select("id, full_name, email, my_referral_code").limit(1000),
      ]);
      if (error) throw new Error(error.message);
      const p = new Map((profiles ?? []).map((r) => [r.id, r]));
      const who = (id: string) => ({
        id,
        name: p.get(id)?.full_name ?? null,
        email: p.get(id)?.email ?? null,
      });
      const counts = new Map<string, number>();
      for (const r of refs ?? []) counts.set(r.referrer_id, (counts.get(r.referrer_id) ?? 0) + 1);
      return {
        referrals: (refs ?? []).map((r) => ({
          id: r.id,
          referral_code: r.referral_code,
          reward_usd: Number(r.reward_usd),
          status: r.status,
          admin_note: r.admin_note,
          created_at: r.created_at,
          referrer: who(r.referrer_id),
          referred: who(r.referred_id),
        })),
        codes: (profiles ?? [])
          .map((r) => ({
            id: r.id,
            name: r.full_name,
            email: r.email,
            code: r.my_referral_code,
            count: counts.get(r.id) ?? 0,
          }))
          .sort((a, b) => b.count - a.count),
      };
    },
  );

export const updateAdminReferral = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; status: "approved" | "rejected" | "paid"; note?: string }) => {
    if (!/^[0-9a-f-]{36}$/i.test(d.id) || !["approved", "rejected", "paid"].includes(d.status))
      throw new Error("Invalid input.");
    return { id: d.id, status: d.status, note: (d.note ?? "").slice(0, 500) || null };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context as AuthCtx);
    const db = await admin();
    const { data: row, error: e1 } = await db
      .from("admin_referrals")
      .select("id, referrer_id, reward_usd, status")
      .eq("id", data.id)
      .maybeSingle();
    if (e1 || !row) throw new Error("Referral not found.");
    if (row.status === "paid") throw new Error("This reward was already paid.");
    if (data.status === "paid" && row.status !== "approved")
      throw new Error("Approve the referral before paying the reward.");
    const { data: updated, error } = await db
      .from("admin_referrals")
      .update({
        status: data.status,
        admin_note: data.note,
        reviewed_by: (context as AuthCtx).userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", data.id)
      .eq("status", row.status)
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!updated) throw new Error("Referral changed meanwhile. Refresh and try again.");
    if (data.status === "paid") {
      const { error: txError } = await db.from("transactions").insert({
        user_id: row.referrer_id,
        kind: "receive",
        direction: "credit",
        usd_amount: row.reward_usd,
        status: "completed",
        reference: `REF-${row.id.slice(0, 8).toUpperCase()}`,
        counterparty: "Basecola referral reward",
        note: "Referral reward",
      });
      if (txError) throw new Error(txError.message);
    }
    return { ok: true };
  });
