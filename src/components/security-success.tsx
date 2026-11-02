import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function SecuritySuccess({ open, title, detail, onClose }: { open: boolean; title: string; detail: string; onClose: () => void }) {
  return <Dialog open={open} onOpenChange={value => { if (!value) onClose(); }}>
    <DialogContent className="max-w-sm rounded-3xl text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-green-soft text-success"><Check className="h-7 w-7" /></div>
      <DialogHeader>
        <DialogTitle className="text-center text-xl">{title}</DialogTitle>
        <DialogDescription className="text-center">{detail}</DialogDescription>
      </DialogHeader>
      <Button type="button" className="h-12 w-full" onClick={onClose}>Done</Button>
    </DialogContent>
  </Dialog>;
}
