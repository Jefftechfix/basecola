export type LegalDocumentSection = {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

export type LegalDocument = {
  title: string;
  shortTitle: string;
  updated: string;
  introduction: string;
  sections: LegalDocumentSection[];
};

export const LEGAL_DOCUMENTS: Record<"privacy" | "terms", LegalDocument> = {
  privacy: {
    title: "Privacy Policy",
    shortTitle: "Privacy",
    updated: "November 7, 2026",
    introduction:
      "This policy explains how information may be handled when you use the Basecola website and its account, wallet, and support features. The experience includes demonstration flows; a feature may process real account data only when it is connected to and enabled by the relevant service.",
    sections: [
      {
        id: "information-we-handle",
        title: "Information we handle",
        paragraphs: [
          "The information involved depends on which pages and services you use. Information may include details you submit, information needed to authenticate an account, and records generated when an enabled service processes a request.",
        ],
        bullets: [
          "Account and contact details, such as your name, email address, phone number, country, and account identifier.",
          "Authentication and security information used to sign in, maintain a session, and apply account protections. Basecola does not ask you to disclose your password or one-time authentication code to support.",
          "Service and transaction records, such as funding requests, crypto activity, order details, amounts, fees, status, timestamps, and references, when those services are enabled.",
          "Verification details you choose or are required to submit through an enabled identity-verification flow.",
          "Messages and information you provide when contacting support or reporting a problem.",
          "Technical information needed to deliver and protect the website, such as browser and device characteristics, request data, diagnostic events, and security logs, where collected by the app host or service providers.",
        ],
      },
      {
        id: "preview-data",
        title: "Preview and demonstration data",
        paragraphs: [
          "Some balances, prices, transaction histories, and account actions in a preview may be sample data or simulations. A displayed sample is not proof of a real payment, deposit, withdrawal, purchase, sale, or wallet balance. Do not send funds to a demo address, QR code, or identifier.",
          "If you sign in to a connected account or use a feature explicitly identified as live, information submitted to that feature may be processed by the services required to provide it. Check the screen and service terms before submitting personal or financial information.",
        ],
      },
      {
        id: "how-information-is-used",
        title: "How information is used",
        paragraphs: [
          "Information may be used to provide and maintain requested features; authenticate users and protect accounts; process, record, and support enabled transactions; respond to questions; diagnose errors; prevent fraud, abuse, and security incidents; meet applicable legal obligations; and improve the reliability and accessibility of the service.",
          "Where applicable law requires a legal basis, the basis may include providing a requested service, complying with a legal obligation, a legitimate interest such as service security, or your consent. The applicable basis depends on the processing and your location.",
        ],
      },
      {
        id: "storage-and-cookies",
        title: "Cookies and browser storage",
        paragraphs: [
          "The application uses browser storage to preserve an authentication session and support the sign-in experience. In a hosted preview, authentication state may also be brokered by the preview editor. The site may receive essential technical storage or cookies from its hosting and integrated providers.",
          "This policy does not promise that every deployment uses the same storage technologies. Browser settings can restrict storage, but doing so may prevent sign-in or other features from working. Review the cookie and privacy notices of any provider you use through the service.",
        ],
      },
      {
        id: "when-information-is-shared",
        title: "When information may be shared",
        paragraphs: [
          "Information may be made available to service providers only as needed to operate, secure, or support a feature, and may be disclosed when required by law or to protect users and the service. Depending on the feature and deployment, providers may include:",
        ],
        bullets: [
          "Supabase for authentication, database, and related application services.",
          "Stripe for payment processing when a Stripe funding flow is enabled.",
          "Turnkey and Alchemy for crypto wallet infrastructure and blockchain-related services when enabled.",
          "Lovable or its configured email provider for transactional messages when email delivery is enabled.",
          "The app host and security, monitoring, or infrastructure providers used to deliver the site.",
        ],
      },
      {
        id: "blockchain-information",
        title: "Public blockchain information",
        paragraphs: [
          "If a live blockchain transaction is submitted, transaction details recorded on a public blockchain may be visible to anyone and may be difficult or impossible to remove. A public wallet address can sometimes be associated with an individual through other information. Check the asset, network, destination, and amount before confirming.",
        ],
      },
      {
        id: "retention",
        title: "Retention",
        paragraphs: [
          "Information is retained for as long as needed for the purpose for which it was collected, to provide requested services, resolve disputes, maintain required records, and meet legal or security obligations. Actual retention periods depend on the data type, service configuration, provider, and applicable law; this page does not specify a fixed retention schedule.",
        ],
      },
      {
        id: "security",
        title: "Security",
        paragraphs: [
          "Reasonable technical and organizational safeguards should be used to protect information, but no website, transmission method, or storage system can be guaranteed completely secure. Use a unique password, enable available authentication protections, keep recovery information private, and report suspected account compromise promptly.",
        ],
      },
      {
        id: "your-choices-and-rights",
        title: "Your choices and privacy rights",
        paragraphs: [
          "Depending on where you live, privacy law may give you rights to access, correct, delete, restrict, object to, or obtain a copy of certain personal information, or to withdraw consent. These rights can have exceptions and are not identical everywhere.",
          "You can update profile details through account settings where available and can stop using the website at any time. To make a privacy request, use the contact options shown in the Help Center. The Help Center contact details in a demonstration environment may be sample details and may not reach a live support team.",
        ],
      },
      {
        id: "children",
        title: "Children",
        paragraphs: [
          "The service is not intended for children who are not legally permitted to use the relevant financial or digital-asset services in their jurisdiction. We do not knowingly seek personal information from children. If you believe a child has provided information, contact support through a verified channel.",
        ],
      },
      {
        id: "international-processing",
        title: "International processing",
        paragraphs: [
          "You and the providers supporting the service may be located in different countries. Where information is transferred internationally, the applicable provider and deployment should use transfer safeguards required by relevant law. The specific hosting regions and transfer mechanisms can vary by deployment.",
        ],
      },
      {
        id: "policy-changes",
        title: "Changes to this policy",
        paragraphs: [
          "This policy may be updated as the product, providers, or legal requirements change. The updated date at the top indicates the latest revision. Material changes should be presented through the service or another appropriate notice where required.",
        ],
      },
      {
        id: "privacy-contact",
        title: "Contact",
        paragraphs: [
          "For questions about this policy or a privacy request, use the contact options in the Basecola Help Center. Before production launch, the operator should publish a verified privacy contact and identify the legal entity responsible for processing.",
        ],
      },
    ],
  },
  terms: {
    title: "Terms of Service",
    shortTitle: "Terms",
    updated: "November 7, 2026",
    introduction:
      "These terms describe the basic rules for accessing the Basecola website and its features. Some parts of the site are demonstrations and do not provide a live financial or crypto transaction service. By using the site, you agree to these terms to the extent permitted by applicable law.",
    sections: [
      {
        id: "who-may-use",
        title: "Who may use the service",
        paragraphs: [
          "You may use the service only if you can form a binding agreement and are legally permitted to use the relevant features where you live. Some financial, payment, or digital-asset services may have additional age, identity, residency, or eligibility requirements. Do not use a feature if you are prohibited from doing so by law or applicable sanctions.",
        ],
      },
      {
        id: "accounts",
        title: "Accounts and account security",
        paragraphs: [
          "You are responsible for providing accurate information, protecting your sign-in credentials and recovery methods, and activity performed through your account, except where applicable law provides otherwise. Notify the service promptly if you believe your account is compromised.",
          "Do not share passwords, PINs, one-time codes, recovery phrases, or private keys with anyone claiming to represent Basecola. Basecola support should not need your wallet secret or authentication code.",
        ],
      },
      {
        id: "preview-and-availability",
        title: "Preview features and availability",
        paragraphs: [
          "The website may display simulated balances, sample prices, demo receipts, or preview transaction flows. These do not represent real money, an actual crypto asset balance, or a completed transaction. Demo addresses, QR codes, and identifiers are not deposit destinations.",
          "Features may be incomplete, unavailable, changed, or disabled without notice. A page describing a product does not mean that the product is live, available to you, or offered in your location. Only rely on a transaction confirmation from the live service explicitly handling that transaction.",
        ],
      },
      {
        id: "digital-asset-risks",
        title: "Digital asset risks",
        paragraphs: [
          "Digital assets are volatile and can lose some or all of their value. Transactions may be irreversible; network congestion, protocol changes, software errors, third-party outages, or incorrect addresses may cause delays or permanent loss. Past performance and displayed market information do not predict future results.",
          "You are responsible for checking the asset, network, destination, amount, and transaction details before confirming a live transaction. A ticker symbol alone may not identify a token or network. Never send assets to a demo address or based only on instructions received through an unverified channel.",
        ],
      },
      {
        id: "not-advice",
        title: "No financial, investment, tax, or legal advice",
        paragraphs: [
          "Website content, market data, and educational material are provided for general information. They are not individualized financial, investment, tax, or legal advice, and are not an offer, recommendation, or solicitation to buy, sell, hold, or use any asset or service. Consult qualified professionals about your circumstances.",
        ],
      },
      {
        id: "quotes-and-fees",
        title: "Quotes, orders, and fees",
        paragraphs: [
          "Market prices and estimates may be delayed, incomplete, or different from an executable quote. Any quote can change until a supported transaction is accepted. Before using a live feature, review the final amount, exchange rate, fees, network costs, limits, and terms shown by that service. Do not proceed if the total or conditions are unclear.",
          "Any fees or limits must be disclosed by the applicable live service before they apply. A sample amount in a preview is not a fee schedule or a promise of price.",
        ],
      },
      {
        id: "acceptable-use",
        title: "Acceptable use",
        paragraphs: ["You agree not to:"],
        bullets: [
          "Break applicable law, infringe another person's rights, or use the service for fraud, money laundering, terrorist financing, sanctions evasion, or other prohibited activity.",
          "Attempt to gain unauthorized access, interfere with service operation, probe or bypass security controls, or introduce malicious code.",
          "Use automated access in a way that disrupts the service, evade rate limits, or scrape information without authorization.",
          "Misrepresent your identity, submit information you are not authorized to provide, or use another person's account without permission.",
          "Use preview data or materials as proof of a real payment, asset holding, transaction, or Basecola endorsement.",
        ],
      },
      {
        id: "third-party-services",
        title: "Third-party services",
        paragraphs: [
          "Some features may rely on third-party providers, payment processors, wallet infrastructure, blockchain networks, or external websites. Those services may have separate terms and privacy notices. Basecola does not control third-party networks or services, and their availability and terms may change independently.",
        ],
      },
      {
        id: "intellectual-property",
        title: "Intellectual property",
        paragraphs: [
          "The website and its original content, branding, design, and software are owned by or licensed to their respective rights holders and are protected by applicable laws. You may use the service for its intended purpose, but may not copy, modify, distribute, or commercially exploit protected materials except as allowed by law or with permission. Third-party marks belong to their owners.",
        ],
      },
      {
        id: "suspension",
        title: "Suspension and termination",
        paragraphs: [
          "Access may be restricted or suspended where reasonably necessary to protect users or the service, address suspected abuse, comply with law, or respond to a security incident. Where practical and lawful, notice may be provided. Ending access does not remove obligations or records that must be retained by law or that relate to activity already completed.",
        ],
      },
      {
        id: "warranties-and-liability",
        title: "Disclaimers and limitation of liability",
        paragraphs: [
          "To the extent permitted by law, the website and preview features are provided on an “as is” and “as available” basis, without promises that they will be uninterrupted, error-free, or suitable for a particular purpose. Nothing in these terms excludes a warranty or right that cannot legally be excluded.",
          "To the extent permitted by law, Basecola and its providers are not liable for indirect, incidental, special, consequential, exemplary, or punitive loss, loss of profits or data, or losses resulting from unsupported preview data, network conditions, third-party services, or your failure to verify transaction details. Any liability limit must be applied only as allowed by the law governing the claim; these terms do not limit liability that cannot legally be limited.",
        ],
      },
      {
        id: "indemnity",
        title: "Responsibility for claims",
        paragraphs: [
          "To the extent permitted by law, you are responsible for losses or claims caused by your unlawful use of the service or material breach of these terms. Nothing here requires you to indemnify a party for that party's own conduct where such an obligation is prohibited by law.",
        ],
      },
      {
        id: "governing-law",
        title: "Governing law and disputes",
        paragraphs: [
          "Mandatory consumer protections and rules in your place of residence continue to apply. The legal entity providing the service, governing law, venue, and any dispute-resolution process must be specified for the relevant production service before these terms are used as a final contract. Nothing in this section removes a right that cannot be waived under applicable law.",
        ],
      },
      {
        id: "changes",
        title: "Changes to these terms",
        paragraphs: [
          "These terms may be updated as the service or legal requirements change. Continued use after an updated version takes effect constitutes acceptance only where permitted by applicable law. If you do not agree to an update, stop using the affected service.",
        ],
      },
      {
        id: "contact-and-operator",
        title: "Operator and contact information",
        paragraphs: [
          "Questions about these terms can be sent through the contact options in the Help Center. This demonstration environment does not identify a legal contracting entity, registered address, or verified legal contact. Those details and jurisdiction-specific provisions should be completed and reviewed by qualified counsel before a production launch.",
        ],
      },
    ],
  },
};
