import { VERDICT_LABEL, type VerdictScore } from "@/lib/domain";

const VERDICT_SCORES: VerdictScore[] = [1, 2, 3, 4, 5];

export function VerdictScale({
  selected,
  onSelect,
  compact = false,
}: {
  selected: VerdictScore | undefined | null;
  onSelect?: (score: VerdictScore) => void;
  compact?: boolean;
}): JSX.Element {
  return (
    <div
      className={compact ? "verdict-scale verdict-scale-compact" : "verdict-scale"}
      role="radiogroup"
      aria-label="Verdict score"
    >
      {VERDICT_SCORES.map((score) => (
        <button
          key={score}
          className={selected === score ? "verdict-pill active" : "verdict-pill"}
          type="button"
          role="radio"
          aria-checked={selected === score}
          title={VERDICT_LABEL[score]}
          onClick={onSelect ? () => onSelect(score) : undefined}
          disabled={!onSelect}
        >
          {score}
        </button>
      ))}
    </div>
  );
}
