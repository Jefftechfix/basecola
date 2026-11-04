import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type SettingsSection = "general" | "branding" | "support" | "features" | "policies";
export const SETTINGS_SECTIONS: SettingsSection[] = ["general", "branding", "support", "features", "policies"];

export type PlatformSettings = Record<SettingsSection, Record<string, string | boolean>> & { updated_at: string | null };
export type SettingsAuditRow = { id: string; section: string; note: string | null; created_at: string };

type AuthCtx = { supabase: { from: (t: "user_roles") => any }; userId: string };

async function assertAdmin(context: AuthCtx) {
  const { data } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("Admin access required.");
}

async function db(): Promise<any> {
  return (await import("@/integrations/supabase/client.server")).supabaseAdmin;
}

/** Keeps only flat string/boolean values with safe keys and lengths. */
export function cleanSettingsValue(value: unknown): Record<string, string | boolean> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Settings must be an object.");
  const out: Record<string, string | boolean> = {};
  for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
    if (!/^[a-zA-Z0-9_]{1,40}$/.test(key)) throw new Error(`Invalid setting name: ${key}`);
    if (typeof v === "boolean") out[key] = v;
    else if (typeof v === "string") out[key] = v.slice(0, 20000);
    else throw new Error(`Invalid value for ${key}.`);
  }
  if (Object.keys(out).length > 60) throw new Error("Too many settings.");
  return out;
}

export const getPlatformSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ settings: PlatformSettings; audit: SettingsAuditRow[] }> => {
    await assertAdmin(context as AuthCtx);
    const client = await db();
    const [{ data, error }, audit] = await Promise.all([
      client.from("platform_settings").select("general, branding, support, features, policies, updated_at").eq("id", 1).maybeSingle(),
      client.from("admin_settings_audit").select("id, section, note, created_at").order("created_at", { ascending: false }).limit(10),
    ]);
    if (error) throw new Error(error.message);
    const empty = { general: {}, branding: {}, support: {}, features: {}, policies: {}, updated_at: null };
    return { settings: { ...empty, ...(data ?? {}) } as PlatformSettings, audit: (audit.data ?? []) as SettingsAuditRow[] };
  });

export const updatePlatformSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { section: SettingsSection; value: Record<string, string | boolean>; note?: string }) => {
    if (!SETTINGS_SECTIONS.includes(d.section)) throw new Error("Unknown settings section.");
    return { section: d.section, value: cleanSettingsValue(d.value), note: (d.note ?? "").trim().slice(0, 500) };
  })
  .handler(async ({ data, context }) => {
    const ctx = context as AuthCtx;
    await assertAdmin(ctx);
    const client = await db();
    const { data: merged, error } = await client.rpc("admin_update_platform_settings", { _admin_id: ctx.userId, _section: data.section, _value: data.value, _note: data.note });
    if (error) throw new Error(error.message);
    return merged as Record<string, string | boolean>;
  });
