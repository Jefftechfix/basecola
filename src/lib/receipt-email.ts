// Server-only: builds and sends Basecola transaction notifications.
import { sendTemplateEmail } from "@/lib/email-templates/send-email";

export type ReceiptKind = "funding" | "buy" | "sell" | "send" | "receive";

type ReceiptRow = Record<string, unknown>;

const usd = (value: unknown) => {
  const amount = Number(value);
  return Number.isFinite(amount)
    ? `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : "—";
};

const cryptoAmount = (value: unknown, symbol: unknown) => {
  const amount = Number(value);
  const formatted = Number.isFinite(amount)
    ? amount.toLocaleString("en-US", { maximumFractionDigits: 18 })
    : "—";
  const asset = String(symbol ?? "").trim();
  return asset ? `${formatted} ${asset}` : formatted;
};

const text = (value: unknown, fallback = "—") => {
  const result = String(value ?? "").trim();
  return result || fallback;
};

const when = (value: unknown) => {
  const date = new Date(String(value ?? ""));
  return Number.isNaN(date.getTime())
    ? "—"
    : `${date.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" })} UTC`;
};

const statusLabel = (value: unknown) => {
  const status = text(value, "pending").replaceAll("_", " ");
  return status.replace(/\b\w/g, (letter) => letter.toUpperCase());
};

function reference(row: ReceiptRow) {
  return text(row.reference ?? row.transaction_hash ?? row.tx_hash ?? row.id);
}

function commonRows(row: ReceiptRow) {
  return [
    { label: "Reference", value: reference(row) },
    { label: "Date", value: when(row.confirmed_at ?? row.created_at) },
  ];
}

export function buildReceipt(kind: ReceiptKind, row: ReceiptRow) {
  const status = statusLabel(row.status);
  const network = text(row.network);

  switch (kind) {
    case "funding":
      return {
        title: "Wallet funded",
        headline: usd(row.amount ?? row.usd_amount),
        status,
        rows: [
          { label: "Method", value: text(row.payment_method ?? row.note) },
          ...commonRows(row),
        ],
      };
    case "buy": {
      const usdAmount = Number(row.usd_amount);
      const fee = Number(row.fee_usd);
      return {
        title: "Crypto purchased",
        headline: cryptoAmount(row.crypto_amount, row.coin),
        status,
        rows: [
          { label: "Network", value: network },
          { label: "Amount paid", value: usd(row.usd_amount) },
          { label: "Fee", value: usd(row.fee_usd) },
          { label: "Total paid", value: usd(usdAmount + fee) },
          { label: "Price", value: usd(row.price_usd) },
          ...commonRows(row),
        ],
      };
    }
    case "sell":
      return {
        title: "Crypto sold",
        headline: usd(Number(row.usd_amount) - Number(row.fee_usd)),
        status,
        rows: [
          { label: "Asset sold", value: cryptoAmount(row.crypto_amount, row.coin) },
          { label: "Network", value: network },
          { label: "Sale value", value: usd(row.usd_amount) },
          { label: "Fee", value: usd(row.fee_usd) },
          { label: "Price", value: usd(row.price_usd) },
          ...commonRows(row),
        ],
      };
    case "send": {
      const asset = row.coin ?? row.asset;
      const amount = row.amount ?? row.crypto_amount;
      const hash = row.transaction_hash;
      const feeUsd = row.network_fee_usd;
      return {
        title: "Crypto sent",
        headline: cryptoAmount(amount, asset),
        status,
        rows: [
          { label: "Network", value: network },
          { label: "To", value: text(row.to_address ?? row.destination_address) },
          ...(row.network_fee !== undefined
            ? [
                {
                  label: "Network fee",
                  value: `${cryptoAmount(row.network_fee, asset)}${feeUsd !== undefined ? ` (${usd(feeUsd)})` : ""}`,
                },
              ]
            : [{ label: "Network fee", value: usd(row.fee) }]),
          ...(hash ? [{ label: "Transaction hash", value: text(hash) }] : []),
          ...commonRows(row),
        ],
      };
    }
    case "receive": {
      const isDeposit = row.crypto_amount !== undefined;
      return {
        title: isDeposit ? "Crypto received" : "Receive request saved",
        headline: cryptoAmount(isDeposit ? row.crypto_amount : row.amount, row.asset ?? row.coin),
        status,
        rows: [
          { label: "Network", value: network },
          {
            label: isDeposit ? "Deposit address" : "Receive identifier",
            value: text(row.deposit_address ?? row.wallet_address),
          },
          ...(row.sender_address ? [{ label: "From", value: text(row.sender_address) }] : []),
          ...(row.confirmations !== undefined
            ? [
                {
                  label: "Confirmations",
                  value: `${row.confirmations} / ${row.required_confirmations}`,
                },
              ]
            : []),
          ...(row.tx_hash ? [{ label: "Transaction hash", value: text(row.tx_hash) }] : []),
          ...commonRows(row),
        ],
      };
    }
  }
}

export async function sendReceipt(
  kind: ReceiptKind,
  email: string,
  name: string | null,
  row: ReceiptRow,
) {
  const receipt = buildReceipt(kind, row);
  const result = await sendTemplateEmail("transaction-receipt", email, {
    templateData: { name: name ?? "", ...receipt },
    idempotencyKey: `receipt-${kind}-${text(row.id, reference(row))}-${String(row.status)}`,
  });
  return result.sent;
}
