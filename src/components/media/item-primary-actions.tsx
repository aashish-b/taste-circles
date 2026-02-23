"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { VerdictScale } from "@/components/ui/verdict-scale";
import { type UserItemStatus, type VerdictScore } from "@/lib/domain";

type PrimaryMode = "SET_VERDICT" | "MARK_FINISHED" | "RECOMMEND";

function resolvePrimaryMode(input: {
  verdictScore: VerdictScore | null;
  status: UserItemStatus | null;
}): PrimaryMode {
  if (input.verdictScore === null) {
    return "SET_VERDICT";
  }
  if (input.status !== "FINISHED") {
    return "MARK_FINISHED";
  }
  return "RECOMMEND";
}

export function ItemPrimaryActions({
  itemId,
  status,
  verdictScore,
}: {
  itemId: string;
  status: UserItemStatus | null;
  verdictScore: VerdictScore | null;
}): JSX.Element {
  const router = useRouter();
  const [selectedVerdict, setSelectedVerdict] = useState<VerdictScore | undefined>(
    verdictScore ?? undefined,
  );
  const [pending, setPending] = useState<"verdict" | "finished" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mode = resolvePrimaryMode({ verdictScore, status });

  async function patchEntry(payload: {
    status?: UserItemStatus;
    verdictScore?: VerdictScore;
  }): Promise<void> {
    const response = await fetch(`/api/items/${itemId}/entry`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error("Could not save");
    }
    router.refresh();
  }

  async function handleSetVerdict(): Promise<void> {
    if (!selectedVerdict) {
      setError("Pick a verdict first.");
      return;
    }

    setPending("verdict");
    setError(null);
    try {
      await patchEntry({ verdictScore: selectedVerdict });
    } catch {
      setError("Could not set verdict right now.");
    } finally {
      setPending(null);
    }
  }

  async function handleMarkFinished(): Promise<void> {
    setPending("finished");
    setError(null);
    try {
      await patchEntry({ status: "FINISHED" });
    } catch {
      setError("Could not mark finished right now.");
    } finally {
      setPending(null);
    }
  }

  return (
    <section className="card item-primary-card">
      <header className="section-head">
        <h2>Next step</h2>
      </header>

      <div className="item-missing-prompts">
        {verdictScore === null ? (
          <p className="muted">No verdict yet. Add one so this item shapes your taste signal.</p>
        ) : null}
        {status !== "FINISHED" ? (
          <p className="muted">Not marked finished yet.</p>
        ) : null}
      </div>

      <div className="item-primary-actions">
        {mode === "SET_VERDICT" ? (
          <>
            <VerdictScale selected={selectedVerdict} onSelect={setSelectedVerdict} />
            <button
              className="button"
              type="button"
              disabled={pending !== null || !selectedVerdict}
              onClick={() => void handleSetVerdict()}
            >
              {pending === "verdict" ? "Saving..." : "Set verdict"}
            </button>
          </>
        ) : null}

        {mode === "MARK_FINISHED" ? (
          <button
            className="button"
            type="button"
            disabled={pending !== null}
            onClick={() => void handleMarkFinished()}
          >
            {pending === "finished" ? "Saving..." : "Mark finished"}
          </button>
        ) : null}

        <a
          className={mode === "RECOMMEND" ? "button" : "button button-secondary"}
          href="#recommend-section"
        >
          Recommend
        </a>
      </div>
      {error ? <p className="muted">{error}</p> : null}
    </section>
  );
}
