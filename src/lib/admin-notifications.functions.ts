import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { renderTemplateEmail } from "@/lib/email-templates/send-email";

type AuthCtx = { supabase: SupabaseClient<Database>; userId: string };
type AdminNotificationRecipient = { id: string; email: string; name: string };

async function assertAdmin(context: AuthCtx) {
  const { data, error } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error || !data) throw new Error("Admin access required.");
}

async function admin() {
  return (await import("@/integrations/supabase/client.server")).supabaseAdmin;
}

async function sendAdminNotificationEmail(
  recipient: AdminNotificationRecipient,
  input: { subject: string; message: string; idempotencyKey: string },
): Promise<void> {
  const request = getRequest();
  const authorization = request?.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    throw new Error("Could not authenticate email delivery with Supabase.");
  }

  const supabaseUrl = process.env.SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
  const publishableKey =
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !publishableKey) {
    throw new Error("Supabase URL and publishable key are required for email delivery.");
  }

  const email = await renderTemplateEmail("admin-notification", recipient.email, {
    templateData: {
      subject: input.subject,
      message: input.message,
      name: recipient.name,
    },
  });
  const endpoint = new URL("/functions/v1/admin-notification-email", supabaseUrl);
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: authorization,
      apikey: publishableKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...email,
      userId: recipient.id,
      idempotencyKey: input.idempotencyKey,
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const error = body && typeof body.error === "string" ? body.error : null;
    throw new Error(error ?? `Supabase email delivery failed with status ${response.status}.`);
  }
}

async function activeEmailRecipients(userIds?: string[]): Promise<AdminNotificationRecipient[]> {
  const db = await admin();
  const profiles: { id: string; full_name: string | null; email: string | null }[] = [];
  if (userIds) {
    const { data, error } = await db
      .from("profiles")
      .select("id, full_name, email")
      .in("id", userIds)
      .not("email", "is", null)
      .order("id", { ascending: true });
    if (error) throw new Error(`Could not load email recipients: ${error.message}`);
    profiles.push(...(data ?? []));
  } else {
    for (let offset = 0; ; offset += 500) {
      const { data, error } = await db
        .from("profiles")
        .select("id, full_name, email")
        .not("email", "is", null)
        .order("id", { ascending: true })
        .range(offset, offset + 499);
      if (error) throw new Error(`Could not load email recipients: ${error.message}`);
      profiles.push(...(data ?? []));
      if (!data || data.length < 500) break;
    }
  }

  const inactiveUserIds = new Set<string>();
  if (userIds && profiles.length > 0) {
    const { data, error } = await db
      .from("admin_user_management")
      .select("user_id")
      .in(
        "user_id",
        profiles.map((profile) => profile.id),
      )
      .neq("account_status", "active")
      .order("user_id", { ascending: true });
    if (error) throw new Error(`Could not load user account statuses: ${error.message}`);
    for (const row of data ?? []) inactiveUserIds.add(row.user_id);
  } else if (!userIds) {
    for (let offset = 0; ; offset += 500) {
      const { data, error } = await db
        .from("admin_user_management")
        .select("user_id")
        .neq("account_status", "active")
        .order("user_id", { ascending: true })
        .range(offset, offset + 499);
      if (error) throw new Error(`Could not load user account statuses: ${error.message}`);
      for (const row of data ?? []) inactiveUserIds.add(row.user_id);
      if (!data || data.length < 500) break;
    }
  }

  return profiles.flatMap((profile) => {
    const email = profile.email?.trim();
    if (!email || inactiveUserIds.has(profile.id) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return [];
    }
    return [{ id: profile.id, email, name: profile.full_name?.trim() || "there" }];
  });
}

export type AdminEmailUser = { id: string; email: string; name: string };

export const searchAdminEmailUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((input: { query: string }) => {
    const query = input.query.trim();
    if (query.length < 2 || query.length > 100) {
      throw new Error("Search must be between 2 and 100 characters.");
    }
    return { query };
  })
  .handler(async ({ data, context }): Promise<AdminEmailUser[]> => {
    await assertAdmin(context as AuthCtx);
    const db = await admin();
    const pattern = `%${data.query.replace(/[\\%_]/g, "\\$&")}%`;
    const [byName, byEmail] = await Promise.all([
      db
        .from("profiles")
        .select("id, full_name, email")
        .ilike("full_name", pattern)
        .not("email", "is", null)
        .order("id")
        .limit(50),
      db
        .from("profiles")
        .select("id, full_name, email")
        .ilike("email", pattern)
        .not("email", "is", null)
        .order("id")
        .limit(50),
    ]);
    if (byName.error) throw new Error(`Could not search users: ${byName.error.message}`);
    if (byEmail.error) throw new Error(`Could not search users: ${byEmail.error.message}`);

    const profiles = [
      ...new Map(
        [...(byName.data ?? []), ...(byEmail.data ?? [])].map((profile) => [profile.id, profile]),
      ).values(),
    ].slice(0, 100);
    if (profiles.length === 0) return [];

    const { data: inactiveUsers, error } = await db
      .from("admin_user_management")
      .select("user_id")
      .in(
        "user_id",
        profiles.map((profile) => profile.id),
      )
      .neq("account_status", "active");
    if (error) throw new Error(`Could not check user account statuses: ${error.message}`);
    const inactiveIds = new Set((inactiveUsers ?? []).map((user) => user.user_id));
    return profiles
      .flatMap((profile) => {
        const email = profile.email?.trim();
        if (!email || inactiveIds.has(profile.id) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
          return [];
        return [{ id: profile.id, email, name: profile.full_name?.trim() || "there" }];
      })
      .slice(0, 20);
  });

export type AdminEmailNotificationHistoryRow = {
  id: string;
  subject: string;
  audience: "all_active" | "selected_users";
  status: "sending" | "sent" | "partial" | "failed";
  recipient_count: number;
  sent_count: number;
  failed_count: number;
  created_at: string;
  completed_at: string | null;
};

export const getAdminEmailAudience = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ activeRecipientCount: number }> => {
    await assertAdmin(context as AuthCtx);
    const recipients = await activeEmailRecipients();
    return { activeRecipientCount: recipients.length };
  });

export const listAdminEmailNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminEmailNotificationHistoryRow[]> => {
    await assertAdmin(context as AuthCtx);
    const db = await admin();
    const { data, error } = await db
      .from("admin_email_notifications")
      .select(
        "id, subject, audience, status, recipient_count, sent_count, failed_count, created_at, completed_at",
      )
      .order("created_at", { ascending: false })
      .limit(25);
    if (error) throw new Error(`Could not load notification history: ${error.message}`);
    return (data ?? []) as AdminEmailNotificationHistoryRow[];
  });

export const sendAdminEmailNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    (input: {
      subject: string;
      message: string;
      confirmation: string;
      expectedRecipientCount: number;
      audience: "all_active" | "selected_users";
      selectedUserIds: string[];
    }) => {
      const subject = input.subject.trim();
      const message = input.message.trim();
      if (subject.length < 1 || subject.length > 200) {
        throw new Error("Subject must be between 1 and 200 characters.");
      }
      if (message.length < 1 || message.length > 10_000) {
        throw new Error("Message must be between 1 and 10,000 characters.");
      }
      if (input.confirmation !== "SEND") {
        throw new Error('Type "SEND" to confirm this email notification.');
      }
      if (input.audience !== "all_active" && input.audience !== "selected_users") {
        throw new Error("Choose a valid email audience.");
      }
      if (!Number.isSafeInteger(input.expectedRecipientCount) || input.expectedRecipientCount < 1) {
        throw new Error("Refresh the active recipient count before sending.");
      }
      if (
        !Array.isArray(input.selectedUserIds) ||
        input.selectedUserIds.some((id) => typeof id !== "string")
      ) {
        throw new Error("Choose valid users before sending.");
      }
      const selectedUserIds = [...new Set(input.selectedUserIds)];
      if (
        input.audience === "selected_users" &&
        (selectedUserIds.length < 1 ||
          selectedUserIds.length !== input.selectedUserIds.length ||
          selectedUserIds.length !== input.expectedRecipientCount ||
          selectedUserIds.some(
            (id) =>
              !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
                id,
              ),
          ))
      ) {
        throw new Error("Choose valid, unique active users before sending.");
      }
      return {
        subject,
        message,
        expectedRecipientCount: input.expectedRecipientCount,
        audience: input.audience,
        selectedUserIds,
      };
    },
  )
  .handler(
    async ({
      data,
      context,
    }): Promise<{
      id: string;
      recipientCount: number;
      sentCount: number;
      failedCount: number;
      status: "sent" | "partial" | "failed";
    }> => {
      const ctx = context as AuthCtx;
      await assertAdmin(ctx);
      const db = await admin();
      const recipients =
        data.audience === "all_active"
          ? await activeEmailRecipients()
          : await activeEmailRecipients(data.selectedUserIds);
      if (recipients.length !== data.expectedRecipientCount) {
        throw new Error(
          "The selected recipients changed or are no longer active. Review the audience and try again.",
        );
      }
      if (recipients.length === 0)
        throw new Error("There are no active users with valid email addresses.");

      const { data: notification, error: createError } = await db
        .from("admin_email_notifications")
        .insert({
          created_by: ctx.userId,
          subject: data.subject,
          message: data.message,
          audience: data.audience,
          status: "sending",
          recipient_count: recipients.length,
        })
        .select("id")
        .single();
      if (createError || !notification) {
        throw new Error(
          `Could not create email notification: ${createError?.message ?? "No notification record returned."}`,
        );
      }

      let sentCount = 0;
      let failedCount = 0;
      for (let offset = 0; offset < recipients.length; offset += 5) {
        const batch = recipients.slice(offset, offset + 5);
        const results = await Promise.all(
          batch.map(async (recipient) => {
            try {
              await sendAdminNotificationEmail(recipient, {
                subject: data.subject,
                message: data.message,
                idempotencyKey: `admin-notification-${notification.id}-${recipient.id}`,
              });
              return {
                notification_id: notification.id,
                user_id: recipient.id,
                status: "sent" as const,
                error_message: null,
                sent_at: new Date().toISOString(),
              };
            } catch (error) {
              return {
                notification_id: notification.id,
                user_id: recipient.id,
                status: "failed" as const,
                error_message:
                  error instanceof Error
                    ? error.message.slice(0, 500)
                    : "Unknown email delivery error.",
                sent_at: null,
              };
            }
          }),
        );

        const { error: deliveryError } = await db
          .from("admin_email_notification_deliveries")
          .insert(results);
        if (deliveryError) {
          await db
            .from("admin_email_notifications")
            .update({
              status: "failed",
              sent_count: sentCount,
              failed_count: recipients.length - sentCount,
              completed_at: new Date().toISOString(),
            })
            .eq("id", notification.id);
          throw new Error(`Email delivery results could not be recorded: ${deliveryError.message}`);
        }
        sentCount += results.filter((result) => result.status === "sent").length;
        failedCount += results.filter((result) => result.status === "failed").length;
      }

      const status =
        sentCount === recipients.length ? "sent" : sentCount === 0 ? "failed" : "partial";
      const { error: updateError } = await db
        .from("admin_email_notifications")
        .update({
          status,
          sent_count: sentCount,
          failed_count: failedCount,
          completed_at: new Date().toISOString(),
        })
        .eq("id", notification.id);
      if (updateError)
        throw new Error(
          `Emails were processed, but notification status could not be saved: ${updateError.message}`,
        );

      return {
        id: notification.id,
        recipientCount: recipients.length,
        sentCount,
        failedCount,
        status,
      };
    },
  );
