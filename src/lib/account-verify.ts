import { COUNTRY_DIALS } from "@/lib/countries";

export const ID_DOCUMENTS = ["National ID Card", "International Passport", "Driver's License"] as const;

export type VerifyStatus = "unverified" | "pending";

type VerifySnapshot = { status: VerifyStatus };

let status: VerifyStatus = "unverified";
let snapshot: VerifySnapshot = { status: "unverified" };
const listeners = new Set<() => void>();

function publish() {
  snapshot = { status };
  listeners.forEach(listener => listener());
}

export function subscribeAccountVerification(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getAccountVerification() {
  return snapshot;
}

export function resetAccountVerification() {
  status = "unverified";
  publish();
}

export function submitAccountVerification() {
  status = "pending";
  publish();
}

export const VERIFY_COUNTRIES = COUNTRY_DIALS.map(item => item.name);

export function formatSsn(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 9);
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

export function ssnError(ssn: string) {
  const digits = ssn.replace(/\D/g, "");
  if (digits.length !== 9) return "Enter a Social Security number as XXX-XX-XXXX.";
  const area = Number(digits.slice(0, 3));
  const group = Number(digits.slice(3, 5));
  const serial = Number(digits.slice(5));
  if (area === 0 || area === 666 || area >= 900 || group === 0 || serial === 0) return "Enter a valid Social Security number.";
  return "";
}

export function verifyDetailsError(input: { name: string; phone: string; email: string; address: string; country: string; ssn: string }) {
  if (input.name.trim().length < 2) return "Enter your full name.";
  const digits = input.phone.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) return "Enter a phone number.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) return "Enter a valid email address.";
  if (!VERIFY_COUNTRIES.includes(input.country)) return "Choose a country.";
  if (input.country === "United States") {
    const problem = ssnError(input.ssn);
    if (problem) return problem;
  }
  if (input.address.trim().length < 8) return "Enter a residential address.";
  return "";
}

export function verifyDocumentError(idType: string) {
  if (!ID_DOCUMENTS.includes(idType as (typeof ID_DOCUMENTS)[number])) return "Choose an accepted document.";
  return "";
}
