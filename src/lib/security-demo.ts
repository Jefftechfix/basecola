export const DEMO_AUTH_CODE = "482913";

type SecuritySnapshot = { pinSet: boolean; passwordSet: boolean; twoFactor: boolean };

let sessionPin = "";
let sessionPassword = "";
let sessionTwoFactor = false;
let snapshot: SecuritySnapshot = { pinSet: false, passwordSet: false, twoFactor: false };
const listeners = new Set<() => void>();

function publish() {
  snapshot = { pinSet: sessionPin.length > 0, passwordSet: sessionPassword.length > 0, twoFactor: sessionTwoFactor };
  listeners.forEach(listener => listener());
}

export function subscribeSecurity(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSecuritySession() {
  return snapshot;
}

export function resetSecuritySession() {
  sessionPin = "";
  sessionPassword = "";
  sessionTwoFactor = false;
  publish();
}

export function signupPinError(next: string, again: string) {
  if (!/^\d{4}$/.test(next)) return "Enter a 4-digit PIN.";
  if (next !== again) return "PIN entries do not match.";
  return "";
}

export function pinChangeError(current: string, next: string, again: string) {
  if (sessionPin && current !== sessionPin) return "Current PIN is not correct.";
  if (!/^\d{4}$/.test(next)) return "Enter a 4-digit PIN.";
  if (next !== again) return "PIN entries do not match.";
  return "";
}

export function applyPin(pin: string) {
  sessionPin = pin;
  publish();
}

export function passwordChangeError(current: string, next: string, again: string) {
  if (sessionPassword && current !== sessionPassword) return "Current password is not correct.";
  if (next.length < 8) return "Use at least 8 characters.";
  if (next !== again) return "Password entries do not match.";
  return "";
}

export function applyPassword(password: string) {
  sessionPassword = password;
  publish();
}

export function twoFactorCodeError(code: string) {
  if (code !== DEMO_AUTH_CODE) return "Enter the 6-digit demo code shown above.";
  return "";
}

export function applyTwoFactor(on: boolean) {
  sessionTwoFactor = on;
  publish();
}
