import { QueryClient } from "@tanstack/react-query";
import { createMemoryHistory, createRouter, RouterProvider } from "@tanstack/react-router";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { routeTree } from "@/routeTree.gen";

const { rpc, state } = vi.hoisted(() => {
  const state = { emailTaken: true };
  const rpc = vi.fn(async (fn: string, args?: { _email?: string }) => {
    if (fn !== "check_signup_available") return { data: null, error: null };
    return { data: { email_taken: state.emailTaken, phone_taken: false }, error: null };
  });
  return { rpc, state };
});

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { rpc, auth: { signUp: vi.fn(async () => ({ data: null, error: null })) } },
}));

const availabilityCalls = () => rpc.mock.calls.filter(call => call[0] === "check_signup_available");

async function openSignup() {
  (routeTree as unknown as { options: { shellComponent?: unknown } }).options.shellComponent = undefined;
  const router = createRouter({
    routeTree,
    context: { queryClient: new QueryClient() },
    history: createMemoryHistory({ initialEntries: ["/signup"] }),
  });
  render(<RouterProvider router={router} />);
  return screen.findByPlaceholderText("Enter your email address");
}

describe("Signup email availability", () => {
  it("warns that the email is registered as soon as it is typed", async () => {
    state.emailTaken = true;
    const email = await openSignup();

    fireEvent.change(email, { target: { value: "taken@example.com" } });

    expect(await screen.findByText(/This email is already registered/)).toBeTruthy();
    expect(rpc).toHaveBeenCalledWith("check_signup_available", { _email: "taken@example.com", _phone: "" });
    expect(email.getAttribute("aria-invalid")).toBe("true");
  });

  it("confirms a free email without anyone pressing Sign Up", async () => {
    state.emailTaken = false;
    const email = await openSignup();

    fireEvent.change(email, { target: { value: "fresh@example.com" } });

    expect(await screen.findByText("Email is available")).toBeTruthy();
    expect(screen.queryByText(/This email is already registered/)).toBeNull();
  });

  it("does not ask the server until the email looks complete", async () => {
    state.emailTaken = false;
    rpc.mockClear();
    const email = await openSignup();

    fireEvent.change(email, { target: { value: "not-an-email" } });
    await new Promise(resolve => setTimeout(resolve, 700));

    expect(availabilityCalls()).toHaveLength(0);
    expect(screen.queryByText(/This email is already registered/)).toBeNull();
  });

  it("re-checks when the member edits the email", async () => {
    state.emailTaken = true;
    const email = await openSignup();

    fireEvent.change(email, { target: { value: "taken@example.com" } });
    await screen.findByText(/This email is already registered/);

    state.emailTaken = false;
    fireEvent.change(email, { target: { value: "taken2@example.com" } });

    await waitFor(() => expect(rpc).toHaveBeenLastCalledWith("check_signup_available", { _email: "taken2@example.com", _phone: "" }));
    expect(await screen.findByText("Email is available")).toBeTruthy();
  });
});
