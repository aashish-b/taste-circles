import { NextResponse } from "next/server";

import type { UserItemStatus, VerdictScore } from "@/lib/domain";
import { updateItemEntryForCurrentUser } from "@/server/repositories";

interface UpdateItemEntryBody {
  status?: UserItemStatus;
  verdictScore?: VerdictScore | null;
}

const USER_ITEM_STATUSES: UserItemStatus[] = ["NONE", "STARTED", "FINISHED", "DROPPED"];

function isUserItemStatus(value: unknown): value is UserItemStatus {
  return typeof value === "string" && USER_ITEM_STATUSES.includes(value as UserItemStatus);
}

function isVerdictScore(value: unknown): value is VerdictScore | null {
  if (value === null) {
    return true;
  }
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 5;
}

export async function PATCH(
  request: Request,
  context: { params: { itemId: string } },
): Promise<NextResponse> {
  const itemId = context.params.itemId?.trim();
  if (!itemId) {
    return NextResponse.json({ error: "Missing item id" }, { status: 400 });
  }

  let payload: UpdateItemEntryBody;
  try {
    payload = (await request.json()) as UpdateItemEntryBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const hasStatus = Object.prototype.hasOwnProperty.call(payload, "status");
  const hasVerdict = Object.prototype.hasOwnProperty.call(payload, "verdictScore");
  if (!hasStatus && !hasVerdict) {
    return NextResponse.json(
      { error: "At least one field is required (status or verdictScore)" },
      { status: 400 },
    );
  }

  if (hasStatus && !isUserItemStatus(payload.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  if (hasVerdict && !isVerdictScore(payload.verdictScore)) {
    return NextResponse.json({ error: "Invalid verdictScore" }, { status: 400 });
  }

  const updated = await updateItemEntryForCurrentUser({
    itemId,
    status: hasStatus ? payload.status : undefined,
    verdictScore: hasVerdict ? payload.verdictScore ?? null : undefined,
  });
  if (!updated) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  return NextResponse.json({ userItem: updated }, { status: 200 });
}
