import * as React from "react";
import { render } from "@react-email/render";
import { TEMPLATES } from "./registry";

export type SendTemplateEmailResult =
  { sent: true } | { sent: false; reason: "recipient_suppressed" };

export interface SendTemplateEmailOptions {
  templateData?: Record<string, unknown>;
  /** Dedupes retries of the same logical send; defaults to a random UUID (no dedupe). */
  idempotencyKey?: string;
  replyTo?: string;
  includeAppUrl?: boolean;
}

export interface RenderedTemplateEmail {
  to: string;
  subject: string;
  html: string;
  text: string;
}

function getAppOrigin(): string {
  const configuredUrl = process.env.APP_URL?.trim();
  if (!configuredUrl) throw new Error("APP_URL is not configured");

  let url: URL;
  try {
    url = new URL(configuredUrl);
  } catch {
    throw new Error("APP_URL must be an absolute http(s) URL");
  }

  const isLocalHttp = url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname);
  if (url.protocol !== "https:" && !isLocalHttp) {
    throw new Error("APP_URL must use HTTPS except for localhost development");
  }

  return url.origin;
}

export async function renderTemplateEmail(
  templateName: string,
  to: string,
  options: SendTemplateEmailOptions = {},
): Promise<RenderedTemplateEmail> {
  const template = TEMPLATES[templateName];
  if (!template) {
    throw new Error(
      `Template '${templateName}' not found. Available: ${Object.keys(TEMPLATES).join(", ")}`,
    );
  }

  const recipient = template.to || to;
  if (!recipient) {
    throw new Error("Recipient is required (the template defines no fixed recipient)");
  }

  const templateData = {
    ...options.templateData,
    ...(options.includeAppUrl === false ? {} : { appUrl: getAppOrigin() }),
  };
  const element = React.createElement(template.component, templateData);
  const html = await render(element);
  const text = await render(element, { plainText: true });
  const subject =
    typeof template.subject === "function" ? template.subject(templateData) : template.subject;

  return { to: recipient, subject, html, text };
}

export async function sendTemplateEmail(
  templateName: string,
  to: string,
  options: SendTemplateEmailOptions = {},
): Promise<SendTemplateEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const fromEmail = process.env.RESEND_FROM_EMAIL?.trim();
  if (!apiKey) throw new Error("RESEND_API_KEY is not configured");
  if (!fromEmail) throw new Error("RESEND_FROM_EMAIL is not configured");

  const email = await renderTemplateEmail(templateName, to, options);
  const idempotencyKey = options.idempotencyKey || crypto.randomUUID();

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({
      from: `Basecola <${fromEmail}>`,
      to: [email.to],
      subject: email.subject,
      html: email.html,
      text: email.text,
      tags: [{ name: "template", value: templateName }],
      ...(options.replyTo ? { reply_to: options.replyTo } : {}),
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`Resend email request failed with status ${response.status}`);
  }

  return { sent: true };
}
