import { describe, expect, it, vi } from "vitest";
import { render } from "@react-email/render";
import AdminNotificationEmail from "@/lib/email-templates/admin-notification";
import { renderTemplateEmail } from "@/lib/email-templates/send-email";

describe("admin notification email", () => {
  it("renders the subject and message as escaped email content", async () => {
    const html = await render(
      <AdminNotificationEmail
        subject="Service update"
        message={"First line\n<script>alert('x')</script>"}
        name="Member"
      />,
    );

    expect(html).toContain("Service update");
    expect(html).toContain("Hello <!-- -->Member<!-- -->,");
    expect(html).toContain("First line");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("does not require an app URL for admin notices", async () => {
    vi.stubEnv("APP_URL", "");
    try {
      const email = await renderTemplateEmail("admin-notification", "member@example.com", {
        templateData: { subject: "Service update", message: "We have an update." },
        includeAppUrl: false,
      });

      expect(email.to).toBe("member@example.com");
      expect(email.subject).toBe("Service update");
      expect(email.html).toContain("We have an update.");
      await expect(
        renderTemplateEmail("transaction-receipt", "member@example.com"),
      ).rejects.toThrow("APP_URL is not configured");
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
