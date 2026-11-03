// Server-only: sends the Basecola verification decision email.
import { sendTemplateEmail } from "@/lib/email-templates/send-email";

export async function notifyVerificationDecision(input: {
  id: string; email: string; name: string; decision: "approved" | "rejected"; note: string | null;
}): Promise<string> {
  const result = await sendTemplateEmail("verification-decision", input.email, {
    templateData: { name: input.name, decision: input.decision, note: input.note },
    idempotencyKey: `verification-decision-${input.id}-${input.decision}`,
  });
  return result.sent ? "sent" : "suppressed";
}
