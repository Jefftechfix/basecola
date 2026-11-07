import { describe, expect, it } from "vitest";
import { getMarketingPage, MARKETING_NAV } from "./marketing-pages";

describe("marketing pages", () => {
  it("omits removed pages from the footer and page lookup", () => {
    const removedPages = [
      { category: "Company", slug: "press" },
      { category: "Products", slug: "earn" },
      { category: "Support", slug: "fees" },
      { category: "Support", slug: "status" },
      { category: "Support", slug: "report-an-issue" },
    ] as const;

    for (const { category, slug } of removedPages) {
      expect(
        MARKETING_NAV.some(
          (group) => group.category === category && group.items.some((item) => item.slug === slug),
        ),
      ).toBe(false);
      expect(getMarketingPage(category, slug)).toBeUndefined();
    }
  });
});
