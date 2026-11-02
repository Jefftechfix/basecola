import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { amountError } from "@/lib/wallet-demo";

const MIN_CENTS = 100;
const MAX_CENTS = 1_000_000;

export function stripeFundingAmountError(value: string) {
  const basic = amountError(value);
  if (basic) return basic;
  if (!/^\d+(\.\d{1,2})?$/.test(value.trim())) return "Enter a USD amount with up to 2 decimal places.";
  const cents = stripeFundingCents(value);
  if (cents < MIN_CENTS) return "The minimum Stripe funding is $1.00.";
  if (cents > MAX_CENTS) return "The maximum Stripe funding is $10,000.00.";
  return "";
}

export function stripeFundingCents(value: string) {
  return Math.round(Number(value.trim()) * 100);
}

async function functionMessage(error: unknown) {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json();
      if (body && typeof body.error === "string") return body.error;
    } catch {
      return error.message;
    }
  }
  return error instanceof Error ? error.message : "Stripe funding could not be completed.";
}

export async function startStripeFunding(amount: string, onCheckoutStart?: () => void) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Log in to fund your wallet with Stripe.");
  onCheckoutStart?.();
  return openStripeFunding(amount);
}

async function openStripeFunding(amount: string) {
  const { data, error } = await supabase.functions.invoke("stripe-fund-wallet", {
    body: { action: "checkout", amount: amount.trim(), origin: window.location.origin },
  });
  if (error) throw new Error(await functionMessage(error));
  const url = data && typeof data.url === "string" ? data.url : "";
  if (!url.startsWith("https://checkout.stripe.com/")) throw new Error("Stripe did not return a checkout page.");
  window.location.assign(url);
}

export type StripeFundingReceipt = {
  amount: number;
  paymentMethod: string;
  status: string;
  alreadySaved: boolean;
};

export async function confirmStripeFunding(sessionId: string): Promise<StripeFundingReceipt> {
  const { data, error } = await supabase.functions.invoke("stripe-fund-wallet", {
    body: { action: "confirm", sessionId },
  });
  if (error) throw new Error(await functionMessage(error));
  if (!data || typeof data.amount !== "number" || typeof data.paymentMethod !== "string") {
    throw new Error("Stripe did not confirm this payment.");
  }
  return {
    amount: data.amount,
    paymentMethod: data.paymentMethod,
    status: typeof data.status === "string" ? data.status : "pending",
    alreadySaved: Boolean(data.alreadySaved),
  };
}
