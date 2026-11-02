import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Bell } from "lucide-react";
import { NOTIFICATIONS, TRANSACTIONS, unreadNotificationCount, type DemoNotification } from "@/lib/account-demo";
import { TransactionStatus } from "@/components/transaction-status";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const filters = [
  { id: "all", label: "All" },
  { id: "transaction", label: "Activity" },
  { id: "market", label: "Market" },
] as const;

let sessionReadIds: string[] = [];

export function NotificationBell({ tone = "default" }: { tone?: "default" | "light" }) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<(typeof filters)[number]["id"]>("all");
  const [readIds, setReadIds] = useState(sessionReadIds);
  const unread = unreadNotificationCount(readIds);
  const visible = NOTIFICATIONS.filter(item => filter === "all" || item.kind === filter);

  function remember(ids: string[]) {
    sessionReadIds = ids;
    setReadIds(ids);
  }

  function markRead(id: string) {
    if (readIds.includes(id)) return;
    remember([...readIds, id]);
  }

  return <Popover open={open} onOpenChange={setOpen}>
    <PopoverTrigger asChild>
      <Button variant="ghost" size="icon" className={`relative h-10 w-10 [&_svg]:size-7 ${tone === "light" ? "text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground" : ""}`} aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}>
        <Bell />
        {unread > 0 && <span className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-destructive-foreground">{unread}</span>}
      </Button>
    </PopoverTrigger>
    <PopoverContent align="end" sideOffset={8} className="w-[min(22rem,calc(100vw-2rem))] p-0">
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
        <h2 className="font-bold">Notifications</h2>
        <Button variant="link" className="h-auto px-0 text-xs" disabled={unread === 0} onClick={() => remember(NOTIFICATIONS.map(item => item.id))}>Mark all read</Button>
      </div>
      <div role="group" aria-label="Notification type" className="flex gap-2 px-4 py-3">
        {filters.map(item => <Button key={item.id} size="sm" variant={filter === item.id ? "default" : "outline"} aria-pressed={filter === item.id} onClick={() => setFilter(item.id)}>{item.label}</Button>)}
      </div>
      <div className="max-h-80 overflow-y-auto border-t">
        {visible.length === 0 ? <p className="px-4 py-8 text-center text-sm text-muted-foreground">No notifications in this view.</p> : <ul>{visible.map(item => <li key={item.id}><NotificationItem item={item} unread={!readIds.includes(item.id)} onOpen={() => { markRead(item.id); setOpen(false); }} /></li>)}</ul>}
      </div>
      <div className="border-t px-4 py-2"><Button asChild variant="link" className="h-auto px-0 text-sm"><Link to="/transactions" onClick={() => setOpen(false)}>View all activity</Link></Button></div>
    </PopoverContent>
  </Popover>;
}

function NotificationItem({ item, unread, onOpen }: { item: DemoNotification; unread: boolean; onOpen: () => void }) {
  const transaction = item.transactionId ? TRANSACTIONS.find(entry => entry.id === item.transactionId) : undefined;
  const body = <span className="flex min-w-0 flex-1 gap-3">
    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${unread ? "bg-primary" : "bg-transparent"}`} aria-hidden />
    <span className="min-w-0">
      <span className="flex items-start justify-between gap-2"><span className="font-semibold">{item.title}</span>{transaction && <TransactionStatus status={transaction.status} />}</span>
      <span className="mt-1 block text-xs leading-5 text-muted-foreground">{item.detail}</span>
      <span className="mt-1 block text-xs text-muted-foreground">{item.time}</span>
    </span>
  </span>;
  const className = `flex w-full px-4 py-3 text-left text-sm hover:bg-accent ${unread ? "bg-accent/50" : ""}`;
  if (item.transactionId) return <Link to="/transactions/$transactionId" params={{ transactionId: item.transactionId }} className={className} onClick={onOpen}>{body}</Link>;
  return <Link to="/assets/$symbol" params={{ symbol: item.symbol ?? "" }} className={className} onClick={onOpen}>{body}</Link>;
}
