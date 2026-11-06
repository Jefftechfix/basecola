import { AuthSessionMissingError } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: { getUser: vi.fn() },
    from: vi.fn(),
  },
}));

import { supabase } from "@/integrations/supabase/client";
import { currentUserIsAdmin } from "@/lib/admin-demo";

describe("admin session verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("treats a missing auth session as a signed-out user", async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
      data: { user: null },
      error: new AuthSessionMissingError(),
    });

    await expect(currentUserIsAdmin()).resolves.toBe(false);
    expect(supabase.from).not.toHaveBeenCalled();
  });
});
