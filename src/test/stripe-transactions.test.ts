import { describe, expect, it } from "vitest";
import {
  stripeFundingTransactionRow,
  syncStripeFundingTransaction,
} from "@/lib/stripe-transactions";

describe("stripeFundingTransactionRow", () => {
  it("records a Stripe card payment as a credit funding", () => {
    const row = stripeFundingTransactionRow({
      userId: "user-1",
      sessionId: "cs_test_abc123",
      amountUsd: 50,
      status: "completed",
      paymentMethod: "Stripe · visa ending 4242",
    });
    expect(row).toEqual({
      user_id: "user-1",
      kind: "funding",
      direction: "credit",
      usd_amount: 50,
      fee_usd: 0,
      reference: "cs_test_abc123",
      counterparty: "Stripe",
      status: "completed",
      note: "Stripe · visa ending 4242",
    });
  });

  it("rounds a bank payment to cents", () => {
    const row = stripeFundingTransactionRow({
      userId: "user-1",
      sessionId: "cs_test_bank",
      amountUsd: 12.3456,
      status: "pending",
      paymentMethod: "Stripe bank account",
    });
    expect(row.usd_amount).toBe(12.35);
    expect(row.status).toBe("pending");
  });
});

function fakeClient(handlers: {
  existing?: { id: string; status: string; note?: string } | null;
  insertCode?: string;
}) {
  const calls: Array<{ op: string; payload?: unknown }> = [];
  const table = {
    select: () => table,
    eq: () => table,
    maybeSingle: async () => ({ data: handlers.existing ?? null }),
    update: (payload: unknown) => {
      calls.push({ op: "update", payload });
      return { eq: async () => ({ error: null }) };
    },
    insert: async (payload: unknown) => {
      calls.push({ op: "insert", payload });
      return { error: handlers.insertCode ? { code: handlers.insertCode } : null };
    },
  };
  return { calls, from: () => table };
}

describe("syncStripeFundingTransaction", () => {
  it("adds one history row when the payment is new", async () => {
    const client = fakeClient({ existing: null });
    await syncStripeFundingTransaction(client, {
      userId: "user-1",
      sessionId: "cs_test_new",
      amountUsd: 25,
      status: "completed",
      paymentMethod: "Stripe · card",
    });
    expect(client.calls).toHaveLength(1);
    expect(client.calls[0].op).toBe("insert");
    expect((client.calls[0].payload as { usd_amount: number }).usd_amount).toBe(25);
  });

  it("updates the status instead of adding a second row", async () => {
    const client = fakeClient({ existing: { id: "row-1", status: "pending" } });
    await syncStripeFundingTransaction(client, {
      userId: "user-1",
      sessionId: "cs_test_bank",
      amountUsd: 40,
      status: "completed",
      paymentMethod: "Stripe bank account",
    });
    expect(client.calls.map(call => call.op)).toEqual(["update"]);
    expect((client.calls[0].payload as { status: string }).status).toBe("completed");
  });

  it("leaves an unchanged payment alone", async () => {
    const client = fakeClient({ existing: { id: "row-1", status: "completed", note: "Stripe · card" } });
    await syncStripeFundingTransaction(client, {
      userId: "user-1",
      sessionId: "cs_test_done",
      amountUsd: 10,
      status: "completed",
      paymentMethod: "Stripe · card",
    });
    expect(client.calls).toHaveLength(0);
  });

  it("ignores a duplicate payment reported twice", async () => {
    const client = fakeClient({ existing: null, insertCode: "23505" });
    await expect(
      syncStripeFundingTransaction(client, {
        userId: "user-1",
        sessionId: "cs_test_race",
        amountUsd: 5,
        status: "completed",
        paymentMethod: "Stripe · card",
      }),
    ).resolves.toBeUndefined();
  });
});
