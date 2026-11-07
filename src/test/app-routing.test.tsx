import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";

// Match routes without running loaders or rendering: loaders may need a server or
// network the test run lacks, and jsdom never loads the stylesheets React waits on.
describe("App routing", () => {
  it.each(["btc", "eth", "usdt", "sol", "xrp"])("matches a standalone crypto detail page for %s", (symbol) => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
    const matches = router.matchRoutes(`/assets/${symbol}`);
    expect(matches.at(-1)?.routeId).toBe("/assets_/$symbol");
    expect(matches.at(-1)?.params).toMatchObject({ symbol });
    expect(matches.some(match => match.routeId === "/assets")).toBe(false);
  });
  it("matches a standalone transaction details page", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
    const matches = router.matchRoutes("/transactions/BC-1027-001");
    expect(matches.at(-1)?.routeId).toBe("/transactions_/$transactionId");
    expect(matches.at(-1)?.params).toMatchObject({ transactionId: "BC-1027-001" });
    expect(matches.some(match => match.routeId === "/transactions")).toBe(false);
  });

  it.each(["/assets", "/transactions", "/profile", "/fund-wallet", "/receive", "/send", "/buy", "/sell", "/referral", "/statements", "/help", "/security", "/change-pin", "/change-password", "/two-factor", "/verify-account", "/delete-account", "/login", "/forgot-password", "/reset-password", "/reset-password-success", "/admin-login", "/admin", "/privacy-policy", "/terms-of-service"])("matches the account page at %s", (path) => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
    expect(router.matchRoutes(path).at(-1)?.routeId).toBe(path);
  });

  it("matches a page for / instead of falling back to not found", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    const matches = router.matchRoutes("/");

    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
  });
});
