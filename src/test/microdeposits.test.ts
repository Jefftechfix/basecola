import { describe, expect, it, vi } from "vitest";
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
import { microdepositInput } from "@/lib/stripe-funding";

describe("microdepositInput", () => {
  it("converts two dollar amounts to cents", () => expect(microdepositInput("0.32", ".45", "")).toEqual({ amounts: [32, 45] }));
  it("requires both amounts", () => expect("error" in microdepositInput("0.32", "", "")).toBe(true));
  it("accepts an SM descriptor code", () => expect(microdepositInput("", "", "sm11aa")).toEqual({ descriptorCode: "SM11AA" }));
  it("rejects a bad code", () => expect("error" in microdepositInput("", "", "AB1234")).toBe(true));
});
