import { describe, expect, it } from "vitest";

import { parseProviderInput, searchProviders } from "@/server/providers/registry";

describe("provider registry", () => {
  it("searches category-specific providers", async () => {
    const results = await searchProviders("MOVIE", "arrival");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].provider).toBe("TMDB");
  });

  it("parses provider URLs", () => {
    const parsed = parseProviderInput("https://anilist.co/anime/19");
    expect(parsed.some((entry) => entry.provider === "ANILIST")).toBe(true);
  });

  it("returns common TV matches for real queries", async () => {
    const results = await searchProviders("TV", "breaking bad");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].title).toBe("Breaking Bad");
  });

  it("filters out weak token-only movie matches", async () => {
    const results = await searchProviders("MOVIE", "there will be blood");
    expect(results.some((entry) => entry.title === "Forrest Gump")).toBe(false);
  });
});
