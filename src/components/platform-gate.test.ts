import { describe, it, expect } from "vitest";
import { blockFor } from "./platform-gate";
const on = { maintenance: false, registration: true, buySell: true };
describe("platform switches", () => {
  it("maintenance blocks member pages but not admin", () => {
    expect(blockFor("/dashboard", { ...on, maintenance: true })).toBe("maintenance");
    expect(blockFor("/admin", { ...on, maintenance: true })).toBeNull();
  });
  it("registration off blocks signup only", () => {
    expect(blockFor("/signup", { ...on, registration: false })).toBe("registration");
    expect(blockFor("/login", { ...on, registration: false })).toBeNull();
  });
  it("buy & sell off blocks buy and sell", () => {
    expect(blockFor("/buy", { ...on, buySell: false })).toBe("buySell");
    expect(blockFor("/sell", { ...on, buySell: false })).toBe("buySell");
    expect(blockFor("/send", { ...on, buySell: false })).toBeNull();
  });
});
