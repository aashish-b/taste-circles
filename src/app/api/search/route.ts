import { NextRequest, NextResponse } from "next/server";

import { CATEGORY_ORDER, type Category } from "@/lib/domain";
import { searchCachedItems } from "@/server/repositories";
import { searchProviders } from "@/server/providers/registry";

function parseCategory(raw: string | null): Category {
  if (!raw) {
    return "MOVIE";
  }
  const normalized = raw.toUpperCase();
  const candidate = CATEGORY_ORDER.find((entry) => entry === normalized);
  return candidate ?? "MOVIE";
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const category = parseCategory(request.nextUrl.searchParams.get("category"));

  if (!query) {
    return NextResponse.json({ dbResults: [], providerResults: [] });
  }

  const [dbResults, providerResultsRaw] = await Promise.all([
    searchCachedItems(category, query, 8),
    searchProviders(category, query),
  ]);

  const providerResults = providerResultsRaw.map((entry) => ({
    ...entry,
    source: "PROVIDER" as const,
  }));

  return NextResponse.json({ dbResults, providerResults });
}
