import { describe, expect, it } from "vitest";

import { getVerdictLabel, parseCategorySlug } from "@/lib/domain";

describe("domain helpers", () => {
  it("parses valid category slugs", () => {
    expect(parseCategorySlug("movies")).toBe("movies");
    expect(parseCategorySlug("BOOKS")).toBe("books");
    expect(parseCategorySlug("music")).toBe("music");
  });

  it("returns null for unknown category slug", () => {
    expect(parseCategorySlug("podcasts")).toBeNull();
  });

  it("maps verdict labels", () => {
    expect(getVerdictLabel(1)).toBe("Time theft");
    expect(getVerdictLabel(5)).toBe("Life-altering");
    expect(getVerdictLabel(null)).toBeNull();
  });
});
