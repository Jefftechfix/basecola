// Server-only: sends the Basecola verification decision email.
// Email sending activates once the Basecola sender domain is set up.
export async function notifyVerificationDecision(_input: {
  id: string; email: string; name: string; decision: "approved" | "rejected"; note: string | null;
}): Promise<string> {
  return "email_not_configured";
}
