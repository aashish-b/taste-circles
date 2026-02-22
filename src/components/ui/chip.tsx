import {
  RECOMMENDATION_STATE_LABEL,
  STATUS_LABEL,
  getVerdictLabel,
  type RecommendationState,
  type UserItemStatus,
  type VerdictScore,
} from "@/lib/domain";

interface ChipProps {
  children: React.ReactNode;
  tone?: "neutral" | "positive" | "warning" | "muted";
}

export function Chip({ children, tone = "neutral" }: ChipProps): JSX.Element {
  return <span className={`chip chip-${tone}`}>{children}</span>;
}

export function StatusChip({ status }: { status: UserItemStatus }): JSX.Element {
  if (status === "NONE") {
    return <Chip tone="muted">Not started</Chip>;
  }
  const tone = status === "FINISHED" ? "positive" : status === "DROPPED" ? "warning" : "neutral";
  return <Chip tone={tone}>{STATUS_LABEL[status]}</Chip>;
}

export function VerdictChip({
  verdictScore,
}: {
  verdictScore: VerdictScore | null;
}): JSX.Element | null {
  const verdict = getVerdictLabel(verdictScore);
  if (!verdict) {
    return null;
  }
  return <Chip tone="neutral">Verdict {verdictScore}: {verdict}</Chip>;
}

export function RecommendationStateChip({
  state,
}: {
  state: RecommendationState;
}): JSX.Element {
  const tone = state === "ACK_FINISHED" ? "positive" : state === "ACK_DROPPED" ? "warning" : "neutral";
  return <Chip tone={tone}>{RECOMMENDATION_STATE_LABEL[state]}</Chip>;
}

export function ExcellentChip({ value }: { value: boolean }): JSX.Element | null {
  if (!value) {
    return null;
  }
  return <Chip tone="positive">Excellent</Chip>;
}

export function IncompatibleChip({ value }: { value: boolean }): JSX.Element | null {
  if (!value) {
    return null;
  }
  return <Chip tone="warning">Not for me</Chip>;
}
