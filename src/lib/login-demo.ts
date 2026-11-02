const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const REMEMBERED_EMAIL_KEY = "basecola-demo-email";

export function loginError(email: string, password: string) {
  if (!EMAIL.test(email.trim())) return "Enter a valid email address.";
  if (!password) return "Enter your password.";
  return "";
}

export function resetPasswordChecks(password: string) {
  return [
    { ok: password.length >= 8, label: "At least 8 characters" },
    { ok: /\d/.test(password), label: "Include a number (0-9)" },
    { ok: /[^A-Za-z0-9]/.test(password), label: "Include a special character (e.g. !@#)" },
  ] as const;
}

export function resetPasswordError(password: string, confirm: string) {
  const unmet = resetPasswordChecks(password).find(rule => !rule.ok);
  if (unmet) return unmet.label + ".";
  if (password !== confirm) return "Passwords do not match.";
  return "";
}
