import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export type PlatformFlags = { maintenance: boolean; registration: boolean; buySell: boolean };
const DEFAULTS: PlatformFlags = { maintenance: false, registration: true, buySell: true };

export function usePlatformFlags() {
  return useQuery({
    queryKey: ["platform-flags"],
    queryFn: async (): Promise<PlatformFlags> => {
      const { data, error } = await (supabase.rpc as any)("get_platform_flags");
      if (error || !data) return DEFAULTS;
      return { ...DEFAULTS, ...(data as Partial<PlatformFlags>) };
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
}

/** Which block (if any) applies to a path. Admin pages are never blocked. */
export function blockFor(path: string, f: PlatformFlags): "maintenance" | "registration" | "buySell" | null {
  if (path.startsWith("/admin")) return null;
  if (f.maintenance) return "maintenance";
  if (!f.registration && (path === "/signup" || path === "/verify")) return "registration";
  if (!f.buySell && (path === "/buy" || path === "/sell")) return "buySell";
  return null;
}

const COPY = {
  maintenance: { title: "We'll be right back", body: "Basecola is undergoing scheduled maintenance. Please check back shortly.", to: null },
  registration: { title: "Sign-ups are closed", body: "New account registration is paused right now. Existing members can still log in.", to: "/login" },
  buySell: { title: "Buy & Sell is paused", body: "Trading is temporarily unavailable. Your balance and assets are safe.", to: "/dashboard" },
} as const;

export function PlatformGate({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const { data } = usePlatformFlags();
  const block = data ? blockFor(pathname, data) : null;
  if (!block) return <>{children}</>;
  const c = COPY[block];
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-sm text-center">
        <img src="/logo.png" alt="Basecola" className="mx-auto h-14 w-14" />
        <h1 className="mt-5 text-2xl font-bold text-foreground">{c.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{c.body}</p>
        {c.to && (
          <Link to={c.to} className="mt-6 inline-flex rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground">
            {block === "registration" ? "Go to login" : "Back to dashboard"}
          </Link>
        )}
      </div>
    </div>
  );
}
