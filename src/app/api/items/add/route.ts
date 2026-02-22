import { NextRequest, NextResponse } from "next/server";

import { CATEGORY_ORDER, type Category, type Provider, type UserItemStatus } from "@/lib/domain";
import { upsertItemAndUserItemForCurrentUser } from "@/server/repositories";

interface AddRequestBody {
  category: Category;
  provider: Provider;
  providerId: string;
  title: string;
  year?: number | null;
  creators?: string[];
  posterUrl?: string | null;
  thumbUrl?: string | null;
  description?: string | null;
  airingStatus?: "ONGOING" | "FINISHED" | null;
  seasonCount?: number | null;
  episodeCount?: number | null;
  noteOneLiner?: string | null;
  defaultStatus?: UserItemStatus;
}

function isCategory(value: string): value is Category {
  return CATEGORY_ORDER.includes(value as Category);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let payload: AddRequestBody;
  try {
    payload = (await request.json()) as AddRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!payload.title || !payload.provider || !isCategory(payload.category)) {
    return NextResponse.json(
      { error: "Missing required fields for add operation" },
      { status: 400 },
    );
  }

  const result = await upsertItemAndUserItemForCurrentUser(payload);
  return NextResponse.json(result, { status: 200 });
}
