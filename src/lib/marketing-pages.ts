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
      { label: "Press", slug: "press" },
      { label: "Contact", slug: "contact" },
    ],
  },
  {
    category: "Products",
    items: [
      { label: "Buy & Sell", slug: "buy-sell" },
      { label: "Trade", slug: "trade" },
      { label: "Assets", slug: "assets" },
      { label: "Earn", slug: "earn" },
      { label: "Security", slug: "security" },
    ],
  },
  {
    category: "Support",
    items: [
      { label: "Help Center", slug: "help-center" },
      { label: "FAQs", slug: "faqs" },
      { label: "Fees", slug: "fees" },
      { label: "Status", slug: "status" },
      { label: "Report an Issue", slug: "report-an-issue" },
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
    title: "Crypto should feel easier to understand.",
    description:
      "Basecola is designed to make exploring digital assets more approachable, with clear flows for viewing, buying, selling, and managing crypto.",
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
    title: "Build clearer experiences for digital assets.",
    description:
      "We care about thoughtful product design, responsible engineering, and making complex tools easier to use.",
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
    title: "Learn the essentials, one clear step at a time.",
    description:
      "A practical reading list for understanding crypto basics, account safety, and the details behind a transaction.",
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
    related: ["fees", "security"],
  },
  {
    category: "Company",
    slug: "press",
    label: "Press",
    eyebrow: "Company",
    title: "A clear introduction to Basecola.",
    description:
      "A concise overview for writers and partners researching the Basecola product and this website.",
    sections: [
      {
        title: "About Basecola",
        body: "Basecola is a crypto platform experience focused on helping people explore digital assets and understand common account actions through a straightforward interface.",
        points: [
          "Product areas include assets, buying and selling, account security, and support",
          "The current website includes demonstration and preview experiences",
          "Availability and functionality may vary by environment",
        ],
      },
      {
        title: "Using product information",
        body: "Please describe the product accurately and distinguish preview screens from any live financial service. Do not treat sample balances, sample prices, or demo transactions as real.",
        points: [
          "Avoid implying guaranteed returns or prices",
          "Do not describe a preview transaction as executed",
          "Verify product availability before publication",
        ],
      },
      {
        title: "Press inquiries",
        body: "For questions about the product or a potential interview, use the contact page. This preview does not provide a dedicated press inbox or media asset download.",
        points: [
          "Include your publication and deadline",
          "Describe the information you need",
          "Do not include account credentials or private keys",
        ],
      },
    ],
    action: { label: "Send an inquiry", href: "/company/contact" },
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
    related: ["trade", "fees"],
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
    slug: "earn",
    label: "Earn",
    eyebrow: "Products",
    title: "Learn about earning products before committing funds.",
    description:
      "Crypto reward and yield products can carry market, protocol, and access risks. Understand the terms before considering any product.",
    sections: [
      {
        title: "How earning products can work",
        body: "Some services offer rewards through staking, lending, or other mechanisms. The source of a reward, eligibility, lock-up period, and risks vary by product.",
        points: [
          "Read how rewards are generated",
          "Check lock-up and withdrawal conditions",
          "Understand counterparty and network risks",
        ],
      },
      {
        title: "No live earn product in this preview",
        body: "This website does not currently connect to a live earning or staking service. Any illustrative rates or artwork elsewhere should not be read as an offer or guaranteed return.",
        points: [
          "No funds are enrolled from this page",
          "No return is promised",
          "Availability requires a separately configured service",
        ],
      },
      {
        title: "Stay informed",
        body: "Before using any future product, read its official terms and understand that digital asset values and rewards can change.",
        points: [
          "Review product-specific disclosures",
          "Consider whether you can tolerate loss",
          "Ask support when terms are unclear",
        ],
      },
    ],
    action: { label: "Review available assets", href: "/assets" },
    related: ["security", "fees"],
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
    related: ["faqs", "report-an-issue"],
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
        body: "Use the Help Center to search answers and review available support options. Use Report an Issue to describe a problem with this website.",
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
  {
    category: "Support",
    slug: "fees",
    label: "Fees",
    eyebrow: "Support",
    title: "Understand the costs before you confirm.",
    description:
      "Fees depend on the service, asset, and network. Review the complete transaction breakdown presented for your specific action.",
    sections: [
      {
        title: "What can affect the total",
        body: "Depending on the service, a transaction may include a service charge, a spread in the quoted price, or a network fee. Not every cost applies to every action.",
        points: [
          "Service fees depend on product terms",
          "Network fees can change with network demand",
          "The quoted rate may differ from a market reference price",
        ],
      },
      {
        title: "Review the transaction summary",
        body: "Before confirming, check the amount, rate, fees, and total or receive amount. If a cost is missing or unclear, do not continue until you understand it.",
        points: [
          "Look for a fee breakdown on the review screen",
          "Check whether a fee is fixed or variable",
          "Save the final receipt for your records",
        ],
      },
      {
        title: "No fixed schedule shown here",
        body: "This page does not publish a numerical fee schedule because fees can depend on live service configuration. Preview flows may display sample values that are not actual charges.",
        points: [
          "Do not rely on a sample quote",
          "Check current terms for a live service",
          "Ask support if the displayed amount is unclear",
        ],
      },
    ],
    action: { label: "Read FAQs", href: "/support/faqs" },
    related: ["buy-sell", "trade"],
  },
  {
    category: "Support",
    slug: "status",
    label: "Status",
    eyebrow: "Support",
    title: "Service status information.",
    description:
      "This page explains how to interpret the current preview; a live service-monitoring feed is not connected here.",
    sections: [
      {
        title: "Preview availability",
        body: "This website is available as a demonstration experience, but individual integrations may be disabled, sample-only, or unavailable in a given environment.",
        points: [
          "Market data may be delayed or unavailable",
          "Preview actions do not confirm a live transaction",
          "Availability may differ between environments",
        ],
      },
      {
        title: "No live incident feed",
        body: "There is no live status API or incident history connected to this page. It cannot confirm whether a production service is operational.",
        points: [
          "Do not use this page as a production uptime indicator",
          "Check the relevant provider for its own status",
          "Contact support for account-specific questions",
        ],
      },
      {
        title: "Troubleshooting",
        body: "If an app screen does not load, try again later and note the time and page. Do not repeatedly submit a transaction if you are unsure whether it completed.",
        points: [
          "Capture a non-sensitive error message",
          "Check the transaction history before retrying",
          "Report the issue with relevant context",
        ],
      },
    ],
    action: { label: "Report a website issue", href: "/support/report-an-issue" },
  },
  {
    category: "Support",
    slug: "report-an-issue",
    label: "Report an Issue",
    eyebrow: "Support",
    title: "Tell us what went wrong.",
    description:
      "A useful report describes what you expected, what happened, and the page where the issue occurred—without exposing sensitive account information.",
    sections: [
      {
        title: "Include helpful details",
        body: "A concise description helps someone reproduce a website problem. Share the steps leading up to it and any visible error text.",
        points: [
          "Page or feature where it happened",
          "Steps to reproduce the issue",
          "Browser/device and approximate time",
        ],
      },
      {
        title: "Keep your account safe",
        body: "Never include passwords, PINs, one-time codes, recovery phrases, private keys, or full payment card details in an issue report.",
        points: [
          "Redact personal data from screenshots",
          "Do not share wallet secrets",
          "Use a verified support channel",
        ],
      },
      {
        title: "How this preview handles reports",
        body: "Submitting below prepares a message in your email application; this website does not upload or store the report. If no email application opens, use the Help Center contact options.",
        points: [
          "Review the message before sending",
          "Only send information you are comfortable sharing",
          "Include no credentials or secrets",
        ],
      },
    ],
    action: { label: "Open Help Center", href: "/help" },
  },
];

export function getMarketingPage(category: MarketingCategory, slug: string) {
  return MARKETING_PAGES.find((page) => page.category === category && page.slug === slug);
}
