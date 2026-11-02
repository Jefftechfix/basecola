export const HELP_PHONE = "+1 (971) 555-2389";
export const HELP_PHONE_HREF = "tel:+19715552389";
export const HELP_EMAIL = "mustapha@gmail.com";
export const HELP_EMAIL_HREF = "mailto:mustapha@gmail.com";
export const HELP_TOPICS = ["Account", "Wallet activity", "Buy or sell", "Security", "Other"] as const;

export const HELP_FAQS = [
  { id: "live", question: "Is this a live wallet?", answer: "No. Balances, prices, and transfers are samples. No money or cryptocurrency is sent or stored." },
  { id: "activity", question: "Where do I see activity?", answer: "Open Transactions from the bottom navigation. Each row opens a receipt you can share." },
  { id: "buy", question: "How do I buy or sell crypto?", answer: "Use Buy and Sell from the dashboard. The quote is a sample price and your balance does not change." },
  { id: "send", question: "How do I send or receive?", answer: "Send and Receive are separate pages. Receive codes are demo identifiers, not wallet addresses." },
  { id: "statement", question: "How do I download a statement?", answer: "Open Statements from your profile, choose the dates, and download the sample statement of account." },
  { id: "referral", question: "How does the referral reward work?", answer: "You receive $10 in this preview for each person who joins with your code. The reward is not paid out." },
  { id: "security", question: "How do I change my PIN or turn on 2FA?", answer: "Open Security from your profile. PIN, password, and the demo two-factor code stay in this session and are not sent." },
  { id: "support", question: "Does a message reach a support team?", answer: `The phone number ${HELP_PHONE} and email ${HELP_EMAIL} are sample contacts. The form keeps your note in this preview. Nothing is emailed or stored on a server.` },
] as const;

export function matchingFaqs(query: string) {
  const term = query.trim().toLowerCase();
  if (!term) return [...HELP_FAQS];
  return HELP_FAQS.filter(item => `${item.question} ${item.answer}`.toLowerCase().includes(term));
}

export function helpMessageError(topic: string, message: string) {
  if (!HELP_TOPICS.includes(topic as (typeof HELP_TOPICS)[number])) return "Choose a topic.";
  if (message.trim().length < 8) return "Describe what you need help with.";
  return "";
}
