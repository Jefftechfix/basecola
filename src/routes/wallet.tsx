import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle, Copy, Check } from "lucide-react";
import { AuthShell } from "@/components/brand";

export const Route = createFileRoute("/wallet")({
  head: () => ({
    meta: [
      { title: "Create your wallet — Basecola" },
      { name: "description", content: "Save your 12-word recovery phrase to secure your Basecola wallet." },
      { property: "og:title", content: "Create your wallet — Basecola" },
      { property: "og:description", content: "Secure your Basecola wallet." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: WalletPage,
});

const WORDS = ["planet", "maple", "ocean", "cabin", "theory", "near", "bright", "velvet", "harvest", "civic", "rival", "potato"];

function WalletPage() {
  const [copied, setCopied] = useState(false);
  return (
    <AuthShell>
      <h1 className="text-center text-3xl font-extrabold">Create Your Wallet</h1>
      <p className="mt-2 text-center text-muted-foreground">Your wallet has been created. Below is your 12-word recovery phrase.</p>
      <div className="mt-6 flex gap-3 rounded-2xl bg-warning-soft p-4">
        <AlertTriangle className="h-6 w-6 shrink-0 text-warning" />
        <div><p className="font-bold text-destructive">Important: Store it Safely!</p>
          <p className="mt-1 text-sm">These 12 words are the only way to recover your wallet. Write them down and keep them in a safe, offline place. Do not share them with anyone.</p></div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl bg-muted p-3">
        {WORDS.map((w, i) => (
          <div key={w} className="flex items-center gap-3 rounded-xl bg-card p-2.5 font-semibold">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-accent text-sm text-primary">{i + 1}</span>{w}
          </div>
        ))}
      </div>
      <button onClick={() => { navigator.clipboard?.writeText(WORDS.join(" ")); setCopied(true); }}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-input bg-card py-4 font-bold text-primary">
        {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}{copied ? "Copied!" : "Copy Phrase"}
      </button>
      <Link to="/dashboard" className="mt-3 block w-full rounded-2xl bg-primary py-4 text-center text-lg font-bold text-primary-foreground">Continue</Link>
    </AuthShell>
  );
}
