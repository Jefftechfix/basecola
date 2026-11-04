import { describe, expect, it } from "vitest";
import { tradeCryptoLimitError } from "@/lib/trade-settings";

describe("tradeCryptoLimitError", () => {
  it("accepts values at both configured limits", () => {
    expect(tradeCryptoLimitError(0.01, 0.01, 10)).toBe("");
    expect(tradeCryptoLimitError(10, 0.01, 10)).toBe("");
  });

  it("rejects values below or above configured limits", () => {
    expect(tradeCryptoLimitError(0.009, 0.01, 10)).toContain("between 0.01 and 10");
    expect(tradeCryptoLimitError(10.01, 0.01, 10)).toContain("between 0.01 and 10");
  });

  it("rejects non-finite amounts and invalid bounds", () => {
    expect(tradeCryptoLimitError(Number.NaN, 0.01, 10)).not.toBe("");
    expect(tradeCryptoLimitError(1, Number.NaN, 10)).not.toBe("");
  });
});