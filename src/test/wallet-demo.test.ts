import { describe, expect, it } from "vitest";
import { getAccountVerification, resetAccountVerification, submitAccountVerification, VERIFY_COUNTRIES, verifyDetailsError, verifyDocumentError } from "@/lib/account-verify";
import { COUNTRY_DIALS, countryByName, splitPhone } from "@/lib/countries";
import { accountStatement, deleteAccountError, inStatementRange, NOTIFICATIONS, statementPeriod, TRANSACTIONS, unreadNotificationCount } from "@/lib/account-demo";
import { HELP_EMAIL, HELP_PHONE, helpMessageError, matchingFaqs } from "@/lib/help-demo";
import { applyPassword, applyPin, getSecuritySession, passwordChangeError, pinChangeError, resetSecuritySession, signupPinError, twoFactorCodeError } from "@/lib/security-demo";
import { loginError, resetPasswordError } from "@/lib/login-demo";
import { adminLoginError } from "@/lib/admin-demo";
import { stripeFundingAmountError, stripeFundingCents } from "@/lib/stripe-funding";
import { amountError, bankAccountError, cardNumberError, cvvError, demoReceiveCode, expiryError, formatAssetAmount, matchingStripeDemoBanks, quoteTradeFee, recipientError, routingNumberError, sampleUnitPrice, sendNetworkFee, stripeDemoLoginError } from "@/lib/wallet-demo";

describe("Demo wallet safeguards", () => {
  it("verifies a sample account without keeping the ID number", () => {
    resetAccountVerification();
    const address = "No. 12, Lokoja Road, Anyigba, Kogi State, Nigeria";
    const nigeria = { name: "Mustapha Suleiman", phone: "8034567890", email: "mustapha@basecola.com", address, country: "Nigeria", ssn: "" };
    expect(verifyDetailsError({ ...nigeria, name: "M" })).toBe("Enter your full name.");
    expect(verifyDetailsError({ ...nigeria, phone: "12" })).toBe("Enter a phone number.");
    expect(verifyDetailsError({ ...nigeria, email: "not-an-email" })).toBe("Enter a valid email address.");
    expect(verifyDetailsError(nigeria)).toBe("");
    expect(verifyDetailsError({ ...nigeria, country: "United States", ssn: "" })).toBe("Enter a Social Security number as XXX-XX-XXXX.");
    expect(verifyDetailsError({ ...nigeria, country: "United States", ssn: "000-12-3456" })).toBe("Enter a valid Social Security number.");
    expect(verifyDetailsError({ ...nigeria, country: "United States", ssn: "123-45-6789" })).toBe("");
    expect(VERIFY_COUNTRIES).toContain("Ghana");
    expect(VERIFY_COUNTRIES.length).toBeGreaterThan(190);
    expect(countryByName("Nigeria")?.dial).toBe("+234");
    expect(countryByName("Ghana")?.dial).toBe("+233");
    expect(new Set(COUNTRY_DIALS.map(item => item.iso)).size).toBe(COUNTRY_DIALS.length);
    expect(splitPhone("+1 (971) 555-2389", "US")).toEqual({ iso: "US", national: "(971) 555-2389" });
    expect(verifyDocumentError("Passport")).toBe("Choose an accepted document.");
    expect(verifyDocumentError("National ID Card")).toBe("");
    submitAccountVerification();
    expect(getAccountVerification().status).toBe("pending");
    resetAccountVerification();
  });
  it("checks login and reset password rules", () => {
    expect(loginError("not-an-email", "secret")).toBe("Enter a valid email address.");
    expect(loginError("mustapha@gmail.com", "")).toBe("Enter your password.");
    expect(loginError("mustapha@gmail.com", "secret")).toBe("");
    expect(adminLoginError("admin@basecola.demo", "wrong")).toBe("Use the admin demo sign-in shown on this screen.");
    expect(adminLoginError(" Admin@Basecola.demo ", "admin-demo")).toBe("");
    expect(resetPasswordError("short1!", "short1!")).toBe("At least 8 characters.");
    expect(resetPasswordError("longpassword", "longpassword")).toBe("Include a number (0-9).");
    expect(resetPasswordError("longpassword1", "longpassword1")).toBe("Include a special character (e.g. !@#).");
    expect(resetPasswordError("longpassword1!", "different1!")).toBe("Passwords do not match.");
    expect(resetPasswordError("longpassword1!", "longpassword1!")).toBe("");
  });
  it("checks card and US bank funding details without accepting a charge", () => {
    expect(cardNumberError("4242424242424242")).toBe("");
    expect(cardNumberError("4242424242424243")).not.toBe("");
    expect(expiryError("01/26", new Date(2026, 10, 2))).not.toBe("");
    expect(expiryError("12/26", new Date(2026, 10, 2))).toBe("");
    expect(cvvError("12")).not.toBe("");
    expect(routingNumberError("123456780")).toBe("");
    expect(routingNumberError("123456789")).not.toBe("");
    expect(bankAccountError("12")).not.toBe("");
    expect(bankAccountError("123456789")).toBe("");
    expect(stripeDemoLoginError("user_good", "wrong")).toBe("Use the Stripe demo sign-in shown on this screen.");
    expect(stripeDemoLoginError(" user_good ", "pass_good")).toBe("");
    expect(matchingStripeDemoBanks("credit").map(bank => bank.name)).toEqual(["Demo Credit Union"]);
    expect(matchingStripeDemoBanks("").length).toBeGreaterThan(1);
  });
  it("rejects zero, negative and non-numeric funding amounts", () => {
    for (const value of ["", "0", "-1", "no", "Infinity"]) expect(amountError(value)).not.toBe("");
    expect(amountError("50")).toBe("");
    expect(stripeFundingAmountError("0.50")).toBe("The minimum Stripe funding is $1.00.");
    expect(stripeFundingAmountError("10.999")).toBe("Enter a USD amount with up to 2 decimal places.");
    expect(stripeFundingAmountError("10000.01")).toBe("The maximum Stripe funding is $10,000.00.");
    expect(stripeFundingAmountError("25.50")).toBe("");
    expect(stripeFundingCents("25.50")).toBe(2550);
  });
  it("does not preview sending more than the demo balance", () => {
    expect(amountError("0.11", 0.1)).not.toBe("");
    expect(amountError("0.1", 0.1)).toBe("");
  });
  it("uses an explicitly non-wallet receive identifier", () => {
    expect(demoReceiveCode("BTC")).toBe("BASECOLA-DEMO-BTC-NOT-A-WALLET");
    expect(demoReceiveCode("ETH")).toBe("BASECOLA-DEMO-ETH-NOT-A-WALLET");
  });
  it("quotes a buy from the sample unit price", () => {
    expect(sampleUnitPrice("$67,420.50")).toBe(67420.5);
    expect(formatAssetAmount(50 / 67420.5)).toBe("0.00074161");
    expect(formatAssetAmount(0)).toBe("0");
    expect(quoteTradeFee(100)).toBe(1.5);
    expect(quoteTradeFee(0)).toBe(0);
    expect(sendNetworkFee("BTC")).toBe(2.5);
    expect(sendNetworkFee("USDT")).toBe(1);
    expect(TRANSACTIONS.filter(item => item.type !== "Receive").every(item => item.fee > 0)).toBe(true);
  });
  it("builds a downloadable statement of account", () => {
    const statement = accountStatement(TRANSACTIONS.filter(item => item.status === "Completed"));
    expect(statement).toContain("Basecola statement of account");
    expect(statement).toContain("Mustapha Suleiman");
    expect(statement).toContain("BC-1028-001");
    expect(statement).not.toContain("BC-1027-001");
    expect(statement).toContain("Period: Oct 24, 2026 – Oct 28, 2026");
    expect(statement).toContain("Fee");
    expect(statement).toContain("$13.31");
    expect(statement).toContain("No account was charged.");
  });
  it("limits a statement to the selected dates", () => {
    const rows = TRANSACTIONS.filter(item => inStatementRange(item.date, "2026-10-26", "2026-10-27"));
    expect(rows.map(item => item.id)).toEqual(["BC-1027-001", "BC-1026-001"]);
    const statement = accountStatement(rows, statementPeriod("2026-10-26", "2026-10-27"));
    expect(statement).toContain("Period: Oct 26, 2026 – Oct 27, 2026");
    expect(statement).toContain("BC-1026-001");
    expect(statement).not.toContain("BC-1028-001");
    expect(inStatementRange(TRANSACTIONS[0].date, "2026-10-28", "2026-10-24")).toBe(false);
  });
  it("requires DELETE before closing the preview account", () => {
    expect(deleteAccountError("")).toBe("Type DELETE to confirm.");
    expect(deleteAccountError("remove")).toBe("Type DELETE to confirm.");
    expect(deleteAccountError(" delete ")).toBe("");
  });
  it("filters help answers and checks a support note", () => {
    expect(HELP_PHONE).toBe("+1 (971) 555-2389");
    expect(HELP_EMAIL).toBe("mustapha@gmail.com");
    expect(matchingFaqs("statement").map(item => item.id)).toEqual(["statement"]);
    expect(matchingFaqs("   ")).toHaveLength(8);
    expect(helpMessageError("", "short")).toBe("Choose a topic.");
    expect(helpMessageError("Security", "hi")).toBe("Describe what you need help with.");
    expect(helpMessageError("Security", "I cannot see my demo PIN screen.")).toBe("");
  });
  it("checks preview PIN, password, and two-factor changes", () => {
    resetSecuritySession();
    expect(signupPinError("12", "12")).toBe("Enter a 4-digit PIN.");
    expect(signupPinError("1234", "9999")).toBe("PIN entries do not match.");
    expect(signupPinError("1234", "1234")).toBe("");
    expect(pinChangeError("", "12", "12")).toBe("Enter a 4-digit PIN.");
    expect(pinChangeError("", "1234", "9999")).toBe("PIN entries do not match.");
    expect(pinChangeError("", "1234", "1234")).toBe("");
    applyPin("1234");
    expect(getSecuritySession().pinSet).toBe(true);
    expect(pinChangeError("0000", "5678", "5678")).toBe("Current PIN is not correct.");
    expect(passwordChangeError("", "short", "short")).toBe("Use at least 8 characters.");
    expect(passwordChangeError("", "preview-pass", "preview-pass")).toBe("");
    applyPassword("preview-pass");
    expect(twoFactorCodeError("000000")).not.toBe("");
    expect(twoFactorCodeError("482913")).toBe("");
    resetSecuritySession();
  });
  it("counts unread bell notifications", () => {
    expect(new Set(NOTIFICATIONS.map(item => item.id)).size).toBe(NOTIFICATIONS.length);
    expect(unreadNotificationCount([])).toBe(NOTIFICATIONS.length);
    expect(unreadNotificationCount([NOTIFICATIONS[0].id, "missing"])).toBe(NOTIFICATIONS.length - 1);
  });
  it("rejects empty and whitespace-containing recipients", () => {
    expect(recipientError("")).not.toBe("");
    expect(recipientError("1234567890 1234567890")).not.toBe("");
    expect(recipientError("BASECOLA-DEMO-RECIPIENT")).toBe("");
  });
});