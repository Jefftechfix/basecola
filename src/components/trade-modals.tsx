import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function TradePreviewModal({ open, title, headline, detail, rows, note, confirmLabel, editLabel, onConfirm, onClose }: {
  open: boolean;
  title: string;
  headline: string;
  detail: string;
  rows: { label: string; value: string }[];
  note: string;
  confirmLabel: string;
  editLabel: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return <Dialog open={open} onOpenChange={value => { if (!value) onClose(); }}>
    <DialogContent className="max-w-sm rounded-3xl">
      <DialogHeader>
        <DialogTitle className="text-xl">{title}</DialogTitle>
        <DialogDescription>{detail}</DialogDescription>
      </DialogHeader>
      <p className="text-center text-3xl font-extrabold break-words">{headline}</p>
      <dl className="space-y-3 text-sm">
        {rows.map(row => <div key={row.label} className="flex justify-between gap-4"><dt className="text-muted-foreground">{row.label}</dt><dd className="text-right font-semibold">{row.value}</dd></div>)}
      </dl>
      <p className="text-sm leading-relaxed text-muted-foreground">{note}</p>
      <Button type="button" className="h-12 w-full" onClick={onConfirm}>{confirmLabel}</Button>
      <Button type="button" variant="outline" className="w-full" onClick={onClose}>{editLabel}</Button>
    </DialogContent>
  </Dialog>;
}

export function TradeSuccessModal({ open, title, headline, detail, againLabel, onAgain, onClose }: {
  open: boolean;
  title: string;
  headline: string;
  detail: string;
  againLabel: string;
  onAgain: () => void;
  onClose: () => void;
}) {
  return <Dialog open={open} onOpenChange={value => { if (!value) onClose(); }}>
    <DialogContent className="max-w-sm rounded-3xl text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-green-soft text-success"><Check className="h-7 w-7" /></div>
      <DialogHeader>
        <DialogTitle className="text-center text-xl">{title}</DialogTitle>
        <DialogDescription className="text-center text-base font-semibold text-foreground">{headline}</DialogDescription>
      </DialogHeader>
      <p className="text-sm leading-relaxed text-muted-foreground">{detail}</p>
      <Button type="button" className="h-12 w-full" onClick={onAgain}>{againLabel}</Button>
      <Button asChild variant="outline" className="w-full"><Link to="/dashboard">Back to wallet</Link></Button>
    </DialogContent>
  </Dialog>;
}
