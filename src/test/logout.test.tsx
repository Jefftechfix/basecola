import { QueryClient } from "@tanstack/react-query";
import { createMemoryHistory, createRouter, RouterProvider } from "@tanstack/react-router";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { routeTree } from "@/routeTree.gen";

const { signOut } = vi.hoisted(() => ({ signOut: vi.fn(async () => ({ error: null })) }));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { auth: { signOut: (...args: unknown[]) => signOut(...args) } },
}));

vi.mock("@/lib/account-profile", () => ({
  accountInitials: () => "JD",
  loadAccountProfile: async () => ({
    name: "Jane Doe",
    email: "jane@example.com",
    phone: "",
    country: "",
    address: "",
    referralCode: "",
  }),
  saveAccountProfile: async () => "Saved",
}));

describe("Signing out", () => {
  it("ends on the login page, not the landing page", async () => {
    const router = createRouter({
      routeTree,
      context: { queryClient: new QueryClient() },
      history: createMemoryHistory({ initialEntries: ["/profile"] }),
    });

    render(<RouterProvider router={router} />);

    const button = await screen.findByRole("button", { name: "Log Out" });
    fireEvent.click(button);

    await waitFor(() => expect(signOut).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(router.state.location.pathname).toBe("/login"));
  });
});
