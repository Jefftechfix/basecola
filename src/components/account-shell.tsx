import { Link } from "@tanstack/react-router";
import { Home, Layers, History, User } from "lucide-react";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand";
import { Button } from "@/components/ui/button";

const destinations = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/assets", label: "Assets", icon: Layers },
  { to: "/transactions", label: "Transactions", icon: History },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function AccountNav({ active }: { active: typeof destinations[number]["to"] }) {
  return <nav aria-label="Account navigation" className="fixed inset-x-0 bottom-0 z-30 border-t bg-card pb-[env(safe-area-inset-bottom)]">
    <div className="mx-auto grid max-w-3xl grid-cols-4 gap-1 px-2 py-2">
      {destinations.map(({ to, label, icon: Icon }) => <Button key={to} asChild variant="ghost" className={`h-14 flex-col gap-1 px-1 text-xs ${active === to ? "bg-accent text-primary" : "text-muted-foreground"}`}>
        <Link to={to} aria-current={active === to ? "page" : undefined}><Icon className="!h-5 !w-5" />{label}</Link>
      </Button>)}
    </div>
  </nav>;
}

export function AccountShell({ active, title, children }: { active: typeof destinations[number]["to"]; title: string; children: ReactNode }) {
  return <div className="min-h-screen pb-28">
    <div className="mx-auto max-w-3xl px-5 pt-5">
      <header className="flex items-center justify-between"><Logo /><Button asChild variant="ghost" size="icon" className="rounded-full bg-accent text-primary"><Link to="/profile" aria-label="Your profile"><User /></Link></Button></header>
      <h1 className="mb-6 mt-7 text-3xl font-extrabold">{title}</h1>
      {children}
    </div>
    <AccountNav active={active} />
  </div>;
}