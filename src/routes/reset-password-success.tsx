import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { AuthShell } from "@/components/brand";

export const Route = createFileRoute("/reset-password-success")({
  head: () => ({ meta: [
    { title: "Password Reset Successful — Basecola" }, { name: "description", content: "The Basecola preview password was updated." },
    { property: "og:title", content: "Password Reset Successful — Basecola" }, { property: "og:description", content: "You can log in with the new preview password." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: ResetSuccessPage,
});

function ResetSuccessPage() {
  return <AuthShell back={false}>
    <CheckCircle2 className="mx-auto h-24 w-24 text-success" strokeWidth={1.6} />
    <h1 className="mt-4 text-center text-3xl font-extrabold">Password Reset Successful!</h1>
    <p className="mt-3 text-center text-muted-foreground">Your password has been reset successfully. You can now log in to your account with your new password.</p>
    <Link to="/login" className="mt-8 block w-full rounded-2xl bg-primary py-4 text-center text-lg font-bold text-primary-foreground shadow-soft">Back to Login</Link>
  </AuthShell>;
}
