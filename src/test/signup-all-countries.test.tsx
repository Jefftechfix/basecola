import { QueryClient } from "@tanstack/react-query";
import { createMemoryHistory, createRouter, RouterProvider } from "@tanstack/react-router";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { COUNTRY_DIALS } from "@/lib/countries";
import { routeTree } from "@/routeTree.gen";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: vi.fn(async () => ({ data: { email_taken: false, phone_taken: false }, error: null })),
    auth: { signUp: vi.fn(async () => ({ data: null, error: null })) },
  },
}));

async function openSignup() {
  (routeTree as unknown as { options: { shellComponent?: unknown } }).options.shellComponent = undefined;
  const router = createRouter({
    routeTree,
    context: { queryClient: new QueryClient() },
    history: createMemoryHistory({ initialEntries: ["/signup"] }),
  });
  render(<RouterProvider router={router} />);
  return screen.findByLabelText("Country");
}

describe("Signup is open to every country", () => {
  it("offers every country in the list, not just the United States", async () => {
    const country = await openSignup();
    const options = Array.from(country.querySelectorAll("option")).map(option => option.textContent?.trim());

    expect(country.querySelectorAll("option")).toHaveLength(COUNTRY_DIALS.length + 1);
    for (const name of ["Nigeria", "India", "United Kingdom", "Brazil", "Vietnam"]) {
      expect(options).toContain(name);
    }
  });

  it("does not preselect a US phone code before the member chooses a country", async () => {
    await openSignup();

    const dial = screen.getByRole("button", { name: "Country code" });
    expect(dial).toHaveTextContent("Code");
    expect(dial).not.toHaveTextContent("US +1");
  });

  it("fills the dial code from the country the member picks", async () => {
    const country = await openSignup();

    fireEvent.change(country, { target: { value: "Nigeria" } });

    expect(screen.getByRole("button", { name: "Country code" })).toHaveTextContent("NG +234");
  });
});
