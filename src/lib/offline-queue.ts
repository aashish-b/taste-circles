import type { Category, Provider, VerdictScore } from "@/lib/domain";

const QUEUE_STORAGE_KEY = "taste-circles.manual-add-queue";

export interface QueuedManualAdd {
  userId: string;
  category: Category;
  provider: Provider;
  providerId: string;
  title: string;
  year: number | null;
  creators: string[];
  verdictScore: VerdictScore;
  createdAt: string;
}

function hasWindow(): boolean {
  return typeof window !== "undefined";
}

export function getQueuedManualAdds(): QueuedManualAdd[] {
  if (!hasWindow()) {
    return [];
  }
  const raw = window.localStorage.getItem(QUEUE_STORAGE_KEY);
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as QueuedManualAdd[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function persistQueuedManualAdds(entries: QueuedManualAdd[]): void {
  if (!hasWindow()) {
    return;
  }
  window.localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(entries));
}

export function enqueueManualAdd(entry: QueuedManualAdd): void {
  const next = [...getQueuedManualAdds(), entry];
  persistQueuedManualAdds(next);
}

export function clearQueuedManualAdds(): void {
  persistQueuedManualAdds([]);
}
