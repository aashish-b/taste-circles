"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  ExcellentChip,
  IncompatibleChip,
  RecommendationStateChip,
  VerdictChip,
} from "@/components/ui/chip";
import type { Recommendation } from "@/lib/domain";

interface RecommendationCardProps {
  recommendation: Recommendation;
  fromName?: string;
  toName?: string;
  compact?: boolean;
}

type PendingAction = "accept" | "ACK_STARTED" | "ACK_FINISHED" | "ACK_DROPPED";

export function RecommendationCard({
  recommendation,
  fromName = "Someone",
  toName = "You",
  compact = false,
}: RecommendationCardProps): JSX.Element {
  const router = useRouter();
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runAccept(): Promise<void> {
    setPending("accept");
    setError(null);
    try {
      const response = await fetch(`/api/recommendations/${recommendation.id}/accept`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Accept failed");
      }
      router.refresh();
    } catch {
      setError("Could not accept this recommendation right now.");
    } finally {
      setPending(null);
    }
  }

  async function runStateUpdate(state: "ACK_STARTED" | "ACK_FINISHED" | "ACK_DROPPED"): Promise<void> {
    setPending(state);
    setError(null);
    try {
      const response = await fetch(`/api/recommendations/${recommendation.id}/state`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ state }),
      });
      if (!response.ok) {
        throw new Error("Update failed");
      }
      router.refresh();
    } catch {
      setError("Could not update recommendation state.");
    } finally {
      setPending(null);
    }
  }

  const updatedDate = new Date(recommendation.updatedAt).toISOString().slice(0, 10);
  const hasPending = pending !== null;

  return (
    <article className={compact ? "recommendation-card recommendation-card-compact" : "recommendation-card"}>
      <header className="recommendation-card-header">
        <h4>
          {fromName}
          {" -> "}
          {toName}
        </h4>
        <RecommendationStateChip state={recommendation.state} />
      </header>
      <div className="recommendation-card-chips">
        <VerdictChip verdictScore={recommendation.recipientVerdictScore} />
        <ExcellentChip value={recommendation.excellent} />
        <IncompatibleChip value={recommendation.incompatible} />
      </div>
      <p className="muted">Updated {updatedDate}</p>
      {!compact ? (
        <div className="recommendation-card-actions">
          {recommendation.state === "SENT" ? (
            <button
              className="button"
              type="button"
              onClick={() => void runAccept()}
              disabled={hasPending}
            >
              {pending === "accept" ? "Accepting..." : "Accept (not started)"}
            </button>
          ) : null}
          <button
            className="button button-secondary"
            type="button"
            onClick={() => void runStateUpdate("ACK_STARTED")}
            disabled={hasPending}
          >
            {pending === "ACK_STARTED" ? "Saving..." : "Mark started"}
          </button>
          <button
            className="button button-secondary"
            type="button"
            onClick={() => void runStateUpdate("ACK_FINISHED")}
            disabled={hasPending}
          >
            {pending === "ACK_FINISHED" ? "Saving..." : "Mark finished"}
          </button>
          <button
            className="button button-secondary"
            type="button"
            onClick={() => void runStateUpdate("ACK_DROPPED")}
            disabled={hasPending}
          >
            {pending === "ACK_DROPPED" ? "Saving..." : "Mark dropped"}
          </button>
        </div>
      ) : null}
      {error ? <p className="muted">{error}</p> : null}
    </article>
  );
}
