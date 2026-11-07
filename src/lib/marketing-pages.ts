export type MarketingCategory = "Company" | "Products" | "Support";

export type MarketingPage = {
  category: MarketingCategory;
  slug: string;
  label: string;
  eyebrow: string;
  title: string;
  description: string;
  sections: {
    title: string;
    body: string;
    points: string[];
  }[];
  action?: { label: string; href: string };
  actions?: { label: string; href: string }[];
  related?: string[];
  faqs?: { question: string; answer: string }[];
};

export const MARKETING_NAV: {
  category: MarketingCategory;
  items: { label: string; slug: string }[];
}[] = [
  {
    category: "Company",
    items: [
      { label: "About Us", slug: "about-us" },
      { label: "Careers", slug: "careers" },
      { label: "Blog", slug: "blog" },
      { label: "Contact", slug: "contact" },
    ],
  },
  {
    category: "Products",
    items: [
      { label: "Buy & Sell", slug: "buy-sell" },
      { label: "Trade", slug: "trade" },
      { label: "Assets", slug: "assets" },
      { label: "Security", slug: "security" },
    ],
  },
  {
    category: "Support",
    items: [
      { label: "Help Center", slug: "help-center" },
      { label: "FAQs", slug: "faqs" },
    ],
  },
];

export function marketingPagePath(category: MarketingCategory, slug: string) {
  const section =
    category === "Company" ? "company" : category === "Products" ? "products" : "support";
  return `/${section}/${slug}`;
}

export const MARKETING_PAGES: MarketingPage[] = [
  {
    category: "Company",
    slug: "about-us",
    label: "About Us",
    eyebrow: "Company",
    title: "Meet Basecola: a clearer way to explore digital assets.",
    description:
      "We are building connected crypto tools around clarity, thoughtful design, and transparency—so people can better understand the assets and actions in front of them.",
    sections: [
      {
        title: "A simpler starting point",
        body: "Crypto products can be difficult to navigate. Basecola brings core account and asset actions into one place, with clear steps and useful context along the way.",
        points: [
          "See your assets and recent activity together",
          "Review a transaction before you continue",
          "Find account and security controls from your profile",
        ],
      },
      {
        title: "Designed around clarity",
        body: "We believe good financial interfaces should explain what is happening instead of hiding important details behind jargon.",
        points: [
          "Straightforward product explanations",
          "Visible transaction status and receipts",
          "Support content for common questions",
        ],
      },
      {
        title: "A note about this experience",
        body: "This website currently includes preview and demonstration flows. Unless a screen explicitly confirms a live service, displayed balances and transactions should not be treated as real financial activity.",
        points: [
          "Preview data is separate from real account activity",
          "A demo quote is not a guaranteed execution price",
          "Never send funds to a demo address or QR code",
        ],
      },
    ],
    action: { label: "Explore the assets page", href: "/assets" },
    related: ["careers", "security"],
  },
  {
    category: "Company",
    slug: "careers",
    label: "Careers",
    eyebrow: "Company",
    title: "Build the services behind a clearer crypto experience.",
    description:
      "Explore Basecola engineering role profiles, including full-time backend engineering, and learn about the systems these roles could help build.",
    sections: [
      {
        title: "How we work",
        body: "Our product principles start with user understanding: make the next step clear, communicate limitations honestly, and treat account security as part of the experience.",
        points: [
          "Start with the user problem",
          "Prefer clarity over unnecessary complexity",
          "Build carefully and improve continuously",
        ],
      },
      {
        title: "Areas of work",
        body: "A product like Basecola draws on many disciplines. As the team grows, work may span product, design, engineering, operations, and customer experience.",
        points: [
          "Product and interaction design",
          "Web application engineering",
          "Customer education and support",
        ],
      },
      {
        title: "Open positions",
        body: "There are no verified job listings published on this page right now. We do not collect applications through this preview site.",
        points: [
          "Check back for announcements",
          "Use the contact page for general company inquiries",
          "Do not send sensitive identity or financial information by email",
        ],
      },
    ],
    action: { label: "Contact the team", href: "/company/contact" },
  },
  {
    category: "Company",
    slug: "blog",
    label: "Blog",
    eyebrow: "Company",
    title: "Crypto news, ideas, and conversations from around the world.",
    description:
      "Explore sample editorial stories about global crypto markets, digital payments, blockchain ecosystems, and policy. These examples are not live news.",
    sections: [
      {
        title: "Start with the fundamentals",
        body: "Digital assets are recorded on networks that use cryptography to verify activity. Different assets can use different networks, rules, and fee models, so always check the details before acting.",
        points: [
          "Learn what a blockchain records",
          "Understand that asset symbols can exist on multiple networks",
          "Use trusted sources when researching a token",
        ],
      },
      {
        title: "Make security a habit",
        body: "Protecting an account is a series of small decisions. Use a unique password, enable available additional verification, and be cautious of urgent messages or requests for recovery information.",
        points: [
          "Never share a password or one-time code",
          "Verify a destination address independently",
          "Contact support through a known channel",
        ],
      },
      {
        title: "Review before you confirm",
        body: "A careful transaction review helps you catch the wrong asset, network, amount, or destination before a transfer is submitted.",
        points: [
          "Check the asset and network",
          "Read the fee and total",
          "Save the receipt or transaction reference",
        ],
      },
    ],
    action: { label: "Read common questions", href: "/support/faqs" },
    related: ["security"],
  },
  {
    category: "Company",
    slug: "contact",
    label: "Contact",
    eyebrow: "Company",
    title: "Get in touch with Basecola.",
    description:
      "Choose the right contact path for product questions, accessibility feedback, or general company inquiries.",
    sections: [
      {
        title: "Product and account help",
        body: "For help with an account, transaction, or security setting, start with the Help Center. It includes common answers and the support options configured for this preview.",
        points: [
          "Describe the screen and action you were using",
          "Include a transaction reference when relevant",
          "Never share passwords, recovery phrases, or one-time codes",
        ],
      },
      {
        title: "Company inquiries",
        body: "For press, partnership, or general company questions, use the contact action below. It opens your email application with a draft; this site does not store or submit the message to a server.",
        points: [
          "Use a clear subject line",
          "Share only information needed to answer your question",
          "Do not attach sensitive financial documents",
        ],
      },
      {
        title: "Need a quick answer?",
        body: "The support section has an FAQ page and a Help Center with searchable answers. These pages are the fastest place to start.",
        points: [
          "Browse frequently asked questions",
          "Review how fees are presented",
          "Check service status information",
        ],
      },
    ],
    action: { label: "Open Help Center", href: "/help" },
    related: ["help-center", "faqs"],
  },
  {
    category: "Products",
    slug: "buy-sell",
    label: "Buy & Sell",
    eyebrow: "Products",
    title: "Review a crypto buy or sell flow.",
    description:
      "Explore the steps for selecting an asset, entering an amount, and reviewing a quote before continuing.",
    sections: [
      {
        title: "Choose an asset and amount",
        body: "Start by selecting an available asset and entering the amount you want to review. The interface should make the selected asset and currency clear.",
        points: [
          "Confirm the asset symbol and name",
          "Check the amount and currency",
          "Review the quote timestamp where available",
        ],
      },
      {
        title: "Review before continuing",
        body: "Before an order is submitted, review the displayed rate, any fees, and the total. A quote may change and is not a promise of execution.",
        points: [
          "Read the complete order summary",
          "Understand any fees shown",
          "Only continue when the details are correct",
        ],
      },
      {
        title: "Preview availability",
        body: "The buy and sell screens in this environment may use demonstration balances and quotes. A successful preview does not mean that real crypto was purchased or sold.",
        points: [
          "No real-money execution is implied by demo screens",
          "Do not rely on preview balances for financial decisions",
          "Use the Help Center if a screen is unclear",
        ],
      },
    ],
    actions: [
      { label: "Buy crypto", href: "/buy" },
      { label: "Sell crypto", href: "/sell" },
    ],
    related: ["trade"],
  },
  {
    category: "Products",
    slug: "trade",
    label: "Trade",
    eyebrow: "Products",
    title: "Understand the trade before you place it.",
    description:
      "A helpful trading experience should keep asset selection, quote details, and order review easy to follow.",
    sections: [
      {
        title: "Know what you are trading",
        body: "Crypto markets can move quickly. Confirm the asset, direction, amount, and any quote or order conditions shown in the interface.",
        points: [
          "Check the asset and trading pair",
          "Review the amount and estimated total",
          "Understand the order type before continuing",
        ],
      },
      {
        title: "Keep risk in view",
        body: "Digital asset prices can be volatile, and losses are possible. Do not trade money you cannot afford to lose or rely on a displayed estimate as a guaranteed outcome.",
        points: [
          "Set your own risk limits",
          "Avoid decisions based only on short-term price movements",
          "Research assets independently",
        ],
      },
      {
        title: "Current preview",
        body: "An advanced live trading engine is not connected to this preview page. The available Buy and Sell screens demonstrate a separate guided flow.",
        points: [
          "No order is placed from this information page",
          "Preview quotes are not exchange execution prices",
          "Availability depends on the configured service",
        ],
      },
    ],
    action: { label: "Explore Buy & Sell", href: "/products/buy-sell" },
    related: ["assets", "fees"],
  },
  {
    category: "Products",
    slug: "assets",
    label: "Assets",
    eyebrow: "Products",
    title: "Explore digital assets with useful context.",
    description:
      "View supported asset information and keep the network and symbol in mind whenever you review a crypto transaction.",
    sections: [
      {
        title: "Asset details matter",
        body: "A ticker symbol alone may not identify a network or token contract. Read the asset details and network information shown for an action before continuing.",
        points: [
          "Confirm the full asset name and symbol",
          "Check network compatibility for transfers",
          "Do not assume similar symbols represent the same token",
        ],
      },
      {
        title: "Follow market information carefully",
        body: "Market prices can change and provider data may be delayed or unavailable. A displayed price is informational unless a transaction screen explicitly presents a current quote.",
        points: [
          "Look for quote timing and source context",
          "Expect prices to move",
          "Confirm the final order review",
        ],
      },
      {
        title: "Preview balances",
        body: "This environment may show example holdings and activity. Preview data is for interface demonstration and is not a record of real funds.",
        points: [
          "No deposit is made by viewing this page",
          "Sample holdings do not represent an account balance",
          "Never send crypto to a demo identifier",
        ],
      },
    ],
    action: { label: "View assets", href: "/assets" },
    related: ["buy-sell", "security"],
  },
  {
    category: "Products",
    slug: "security",
    label: "Security",
    eyebrow: "Products",
    title: "Security starts with informed choices.",
    description:
      "Use strong account protections, verify requests, and understand what a crypto transfer can and cannot be reversed.",
    sections: [
      {
        title: "Protect your account",
        body: "Use a unique password and enable additional authentication options when available. Keep recovery information private and use only official sign-in pages.",
        points: [
          "Never share passwords or verification codes",
          "Be cautious of urgent requests and unexpected links",
          "Sign out on shared devices",
        ],
      },
      {
        title: "Check every transfer",
        body: "Crypto transfers are often difficult or impossible to reverse. Verify the destination, asset, and network through a trusted channel before sending.",
        points: [
          "Confirm the complete destination address",
          "Check network and token compatibility",
          "Start with a small test transfer only when appropriate",
        ],
      },
      {
        title: "Security settings",
        body: "Signed-in customers can review available password, PIN, and two-factor settings from the Security area. Options shown depend on account state and service configuration.",
        points: [
          "Review account security periodically",
          "Use an authenticator app when supported",
          "Contact support if you suspect account access",
        ],
      },
    ],
    action: { label: "Open account security", href: "/security" },
    related: ["help-center", "assets"],
  },
  {
    category: "Support",
    slug: "help-center",
    label: "Help Center",
    eyebrow: "Support",
    title: "Find a clear next step.",
    description:
      "Search answers about the Basecola preview, account settings, asset details, and common transaction questions.",
    sections: [
      {
        title: "Search common topics",
        body: "The Help Center brings frequently requested information together so you can find an answer without guessing which screen to open.",
        points: [
          "Account and profile settings",
          "Buy, sell, send, and receive flows",
          "Preview balances and activity",
        ],
      },
      {
        title: "Get help with a specific issue",
        body: "If an answer does not resolve your question, use the support options shown in the Help Center. Contact details and form behavior may be sample-only in this preview.",
        points: [
          "Include the page and step where you got stuck",
          "Do not include passwords or private keys",
          "Use Report an Issue for a website problem",
        ],
      },
      {
        title: "Keep records safe",
        body: "If you are reviewing a transaction, keep its receipt or reference number available. Never share private keys or recovery phrases with anyone claiming to provide support.",
        points: [
          "Save the transaction reference",
          "Verify support channels independently",
          "Report suspicious requests",
        ],
      },
    ],
    action: { label: "Open Help Center", href: "/help" },
    related: ["faqs"],
  },
  {
    category: "Support",
    slug: "faqs",
    label: "FAQs",
    eyebrow: "Support",
    title: "Answers to common questions.",
    description:
      "Quick guidance on preview activity, crypto transfers, account protection, and finding help.",
    sections: [
      {
        title: "Are balances and transactions real?",
        body: "Some screens in this environment use sample holdings, prices, or transaction activity. A demo state is not evidence that funds were received, sent, purchased, or sold.",
        points: [
          "Check whether the screen says preview or demo",
          "Do not treat example receipts as proof of payment",
          "Use a verified transaction reference for real activity",
        ],
      },
      {
        title: "Can crypto transfers be reversed?",
        body: "Most blockchain transfers cannot be reversed by a sender after confirmation. Always verify the asset, network, and destination before submitting a transfer.",
        points: [
          "Confirm address and network independently",
          "Beware of impersonation scams",
          "Contact your service provider promptly if something is wrong",
        ],
      },
      {
        title: "Where can I get more help?",
        body: "Use the Help Center to search answers and review available support options. Contact support if you still need help with this website.",
        points: [
          "Search for the relevant feature",
          "Share only non-sensitive troubleshooting details",
          "Never disclose a password or recovery phrase",
        ],
      },
    ],
    faqs: [
      {
        question: "Is a displayed price guaranteed?",
        answer:
          "No. Market data and estimates can change. Review the final quote and terms shown immediately before any supported transaction.",
      },
      {
        question: "Does a demo receipt prove a transfer happened?",
        answer:
          "No. A preview receipt is illustrative. Only a verified transaction record from the relevant service or network can confirm real activity.",
      },
      {
        question: "What should I do if I see a suspicious request?",
        answer:
          "Do not share credentials or recovery information. Stop, verify the request through a trusted channel, and report the issue.",
      },
    ],
    action: { label: "Go to Help Center", href: "/help" },
  },
];

export function getMarketingPage(category: MarketingCategory, slug: string) {
  const isListedPage = MARKETING_NAV.some(
    (group) => group.category === category && group.items.some((item) => item.slug === slug),
  );
  if (!isListedPage) return undefined;

  return MARKETING_PAGES.find((page) => page.category === category && page.slug === slug);
}
