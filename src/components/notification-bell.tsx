import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function NotificationBell({ tone = "default" }: { tone?: "default" | "light" }) {
  return <Popover>
    <PopoverTrigger asChild>
      <Button variant="ghost" size="icon" className={`relative h-10 w-10 [&_svg]:size-7 ${tone === "light" ? "text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground" : ""}`} aria-label="Notifications">
        <Bell />
      </Button>
    </PopoverTrigger>
    <PopoverContent align="end" sideOffset={8} className="w-[min(22rem,calc(100vw-2rem))] p-0">
      <div className="border-b px-4 py-3"><h2 className="font-bold">Notifications</h2></div>
      <p className="px-4 py-8 text-center text-sm text-muted-foreground">No notifications yet.</p>
    </PopoverContent>
  </Popover>;
}
