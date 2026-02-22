import { NextResponse } from "next/server";

import type { RecommendationState } from "@/lib/domain";
import { setRecommendationStateForCurrentUser } from "@/server/repositories";

interface RecommendationStateBody {
  state?: RecommendationState;
  recipientVerdictScore?: 1 | 2 | 3 | 4 | 5 | null;
  excellent?: boolean;
  incompatible?: boolean;
}

type AcknowledgedState = "ACK_STARTED" | "ACK_FINISHED" | "ACK_DROPPED";

const ACK_STATES: AcknowledgedState[] = ["ACK_STARTED", "ACK_FINISHED", "ACK_DROPPED"];

function isAckState(value: RecommendationState | undefined): value is AcknowledgedState {
  return Boolean(value && ACK_STATES.includes(value as AcknowledgedState));
}

export async function POST(
  request: Request,
  context: { params: { recommendationId: string } },
): Promise<NextResponse> {
  const recommendationId = context.params.recommendationId?.trim();
  if (!recommendationId) {
    return NextResponse.json({ error: "Missing recommendation id" }, { status: 400 });
  }

  let payload: RecommendationStateBody;
  try {
    payload = (await request.json()) as RecommendationStateBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!isAckState(payload.state)) {
    return NextResponse.json({ error: "Invalid recommendation state" }, { status: 400 });
  }

  const result = await setRecommendationStateForCurrentUser({
    recommendationId,
    state: payload.state,
    recipientVerdictScore: payload.recipientVerdictScore,
    excellent: payload.excellent,
    incompatible: payload.incompatible,
  });

  if (!result) {
    return NextResponse.json({ error: "Recommendation not found" }, { status: 404 });
  }

  return NextResponse.json(result);
}
