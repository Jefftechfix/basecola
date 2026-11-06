import { createClient } from "npm:@supabase/supabase-js@2.118.0";

function isOpaqueApiKey(value: string): boolean {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

function createSupabaseFetch(apiKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );
    if (init?.headers) new Headers(init.headers).forEach((value, key) => headers.set(key, value));

    if (isOpaqueApiKey(apiKey) && headers.get("Authorization") === `Bearer ${apiKey}`) {
      headers.delete("Authorization");
    }
    headers.set("apikey", apiKey);
    return fetch(input, { ...init, headers });
  };
}

export function createSupabaseClient(
  url: string,
  apiKey: string,
  headers?: Record<string, string>,
) {
  return createClient(url, apiKey, {
    global: {
      fetch: createSupabaseFetch(apiKey),
      headers,
    },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
