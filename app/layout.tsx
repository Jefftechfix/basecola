import type { Metadata } from "next";
import { Providers } from "./providers";
import "../src/styles.css";

export const metadata: Metadata = {
  title: "Basecola — Buy, sell & manage crypto",
  description:
    "A secure and easy way to buy, sell, trade, and store cryptocurrency on Basecola.",
  openGraph: {
    title: "Basecola — Buy, sell & manage crypto",
    description:
      "A secure and easy way to buy, sell, trade, and store cryptocurrency.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
