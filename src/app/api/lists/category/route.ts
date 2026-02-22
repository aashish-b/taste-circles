import { NextRequest, NextResponse } from "next/server";

import { CATEGORY_ORDER, type Category } from "@/lib/domain";
import {
  getCurrentUser,
  listCategoryEntriesForUser,
} from "@/server/repositories";

function parseCategory(raw: string | null): Category {
  if (!raw) {
    return "MOVIE";
  }
  const normalized = raw.toUpperCase();
  const candidate = CATEGORY_ORDER.find((entry) => entry === normalized);
  return candidate ?? "MOVIE";
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const category = parseCategory(request.nextUrl.searchParams.get("category"));
  const user = await getCurrentUser();
  const entries = await listCategoryEntriesForUser(user.id, category);
  return NextResponse.json({ entries });
}
