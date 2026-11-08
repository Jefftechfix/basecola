import { describe, expect, it } from "vitest";
import { render } from "@react-email/render";
import AdminNotificationEmail from "@/lib/email-templates/admin-notification";

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
});
