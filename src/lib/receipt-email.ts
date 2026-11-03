// Server-only: builds and sends Basecola receipt emails.
import { sendTemplateEmail } from "@/lib/email-templates/send-email";

export type ReceiptKind = "funding" | "buy" | "sell" | "send" | "receive";
const usd = (n: unknown) => `$${Number(n ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const when = (d: unknown) => new Date(String(d)).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }) + " UTC";
const cap = (s: unknown) => { const v = String(s ?? "pending"); return v.charAt(0).toUpperCase() + v.slice(1); };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildReceipt(kind: ReceiptKind, r: Record<string, any>) {
  const base = [{ label: "Date", value: when(r.created_at) }];
  switch (kind) {
    case "funding": return { title: "Wallet funded", headline: usd(r.amount), status: cap(r.status), rows: [{ label: "Method", value: String(r.payment_method) }, { label: "Reference", value: String(r.reference ?? r.id) }, ...base] };
    case "buy": return { title: "Crypto purchase", headline: `${Number(r.crypto_amount)} ${r.coin}`, status: cap(r.status), rows: [{ label: "Network", value: r.network }, { label: "Amount", value: usd(r.usd_amount) }, { label: "Fee", value: usd(r.fee_usd) }, { label: "Total paid", value: usd(Number(r.usd_amount) + Number(r.fee_usd)) }, { label: "Price", value: usd(r.price_usd) }, { label: "Paid with", value: "Wallet balance" }, { label: "Reference", value: r.reference }, ...base] };
    case "sell": return { title: "Crypto sale", headline: usd(Number(r.usd_amount) - Number(r.fee_usd)), status: cap(r.status), rows: [{ label: "Sold", value: `${Number(r.crypto_amount)} ${r.coin}` }, { label: "Network", value: r.network }, { label: "Sale value", value: usd(r.usd_amount) }, { label: "Fee", value: usd(r.fee_usd) }, { label: "Price", value: usd(r.price_usd) }, { label: "Paid to", value: "Wallet balance" }, { label: "Reference", value: r.reference }, ...base] };
    case "send": return { title: "Crypto sent", headline: `${Number(r.amount)} ${r.coin}`, status: cap(r.status), rows: [{ label: "Network", value: r.network }, { label: "To", value: r.to_address }, { label: "Network fee", value: usd(r.fee) }, { label: "Reference", value: String(r.id).slice(0, 8).toUpperCase() }, ...base] };
    case "receive": return { title: "Receive request", headline: r.amount ? `${Number(r.amount)} ${r.coin}` : r.coin, status: cap(r.status), rows: [{ label: "Network", value: r.network }, { label: "Address", value: r.wallet_address }, { label: "Reference", value: String(r.id).slice(0, 8).toUpperCase() }, ...base] };
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function sendReceipt(kind: ReceiptKind, email: string, name: string | null, row: Record<string, any>) {
  const receipt = buildReceipt(kind, row);
  const result = await sendTemplateEmail("transaction-receipt", email, {
    templateData: { name: name ?? "", ...receipt },
    idempotencyKey: `receipt-${kind}-${row.id}-${String(row.status)}`,
  });
  return result.sent;
}
