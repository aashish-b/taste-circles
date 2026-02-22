import { NextResponse } from "next/server";

import { acceptRecommendationForCurrentUser } from "@/server/repositories";

export async function POST(
  _request: Request,
  context: { params: { recommendationId: string } },
): Promise<NextResponse> {
  const recommendationId = context.params.recommendationId?.trim();
  if (!recommendationId) {
    return NextResponse.json({ error: "Missing recommendation id" }, { status: 400 });
  }

  const result = await acceptRecommendationForCurrentUser(recommendationId);
  if (!result) {
    return NextResponse.json({ error: "Recommendation not found" }, { status: 404 });
  }

  return NextResponse.json(result);
}
