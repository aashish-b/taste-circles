import { type UserTasteBlurb } from "@/lib/domain";
import {
  getUserByHandle,
  getUserItem,
  getUserNameById,
  items,
  tasteBlurbs,
  userItems,
  users,
} from "@/lib/mock-data";

const MAX_REGENERATION_WINDOW_HOURS = 24;

function nowIso(): string {
  return new Date().toISOString();
}

function topAnchors(userId: string): string[] {
  return userItems
    .filter((entry) => entry.userId === userId)
    .filter((entry) => entry.starred || entry.status === "FINISHED")
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .slice(0, 5)
    .map((entry) => items.find((item) => item.id === entry.itemId)?.title)
    .filter((title): title is string => Boolean(title));
}

function canRegenerate(blurb: UserTasteBlurb | null): boolean {
  if (!blurb?.generatedAt) {
    return true;
  }
  const generatedAt = new Date(blurb.generatedAt).getTime();
  const elapsed = Date.now() - generatedAt;
  return elapsed >= MAX_REGENERATION_WINDOW_HOURS * 60 * 60 * 1000;
}

function buildBlurbText(userId: string): string {
  const anchors = topAnchors(userId);
  if (anchors.length === 0) {
    return "You are still building your taste map. Add a few finished or starred items and regenerate.";
  }

  const userName = users.find((user) => user.id === userId)?.displayName ?? "This user";
  const lead = `${userName} leans toward deliberate pacing and strong emotional payoff.`;
  const anchorsLine = `Anchors include ${anchors.slice(0, 3).join(", ")} and ${anchors[anchors.length - 1]}.`;
  const close = "They tend to prefer works that reward attention and leave a lasting feeling.";
  return [lead, anchorsLine, close].join(" ");
}

export async function requestTasteBlurbGeneration(
  userId: string,
): Promise<UserTasteBlurb> {
  const existing = tasteBlurbs.find((entry) => entry.userId === userId) ?? null;
  const pending: UserTasteBlurb = {
    userId,
    text: existing?.text ?? null,
    isVisible: existing?.isVisible ?? true,
    status: "PENDING",
    provider: existing?.provider ?? "stub-llm",
    model: existing?.model ?? "foundation-v1",
    promptVersion: existing?.promptVersion ?? 1,
    generatedAt: existing?.generatedAt ?? null,
    updatedAt: nowIso(),
    errorMessage: null,
  };

  if (existing) {
    const index = tasteBlurbs.findIndex((entry) => entry.userId === userId);
    tasteBlurbs[index] = pending;
  } else {
    tasteBlurbs.push(pending);
  }
  return pending;
}

export async function generateTasteBlurb(userId: string): Promise<UserTasteBlurb> {
  const existing = tasteBlurbs.find((entry) => entry.userId === userId) ?? null;
  if (!canRegenerate(existing)) {
    const blocked: UserTasteBlurb = {
      userId,
      text: existing?.text ?? null,
      isVisible: existing?.isVisible ?? true,
      status: "ERROR",
      provider: existing?.provider ?? "stub-llm",
      model: existing?.model ?? "foundation-v1",
      promptVersion: existing?.promptVersion ?? 1,
      generatedAt: existing?.generatedAt ?? null,
      updatedAt: nowIso(),
      errorMessage: "Rate limited: one regeneration every 24 hours.",
    };
    if (existing) {
      const index = tasteBlurbs.findIndex((entry) => entry.userId === userId);
      tasteBlurbs[index] = blocked;
    } else {
      tasteBlurbs.push(blocked);
    }
    return blocked;
  }

  const generated: UserTasteBlurb = {
    userId,
    text: buildBlurbText(userId),
    isVisible: true,
    status: "READY",
    provider: "stub-llm",
    model: "foundation-v1",
    promptVersion: 1,
    generatedAt: nowIso(),
    updatedAt: nowIso(),
    errorMessage: null,
  };

  if (existing) {
    const index = tasteBlurbs.findIndex((entry) => entry.userId === userId);
    tasteBlurbs[index] = generated;
  } else {
    tasteBlurbs.push(generated);
  }

  return generated;
}

export function getTasteBlurbForHandle(handle: string): UserTasteBlurb | null {
  const user = getUserByHandle(handle);
  if (!user) {
    return null;
  }
  return tasteBlurbs.find((entry) => entry.userId === user.id) ?? null;
}

export function summarizeUserTaste(userId: string): string {
  const userName = getUserNameById(userId);
  const favorites = userItems
    .filter((entry) => entry.userId === userId)
    .filter((entry) => entry.starred)
    .map((entry) => {
      const item = items.find((candidate) => candidate.id === entry.itemId);
      const userEntry = getUserItem(userId, entry.itemId);
      return `${item?.title ?? "Unknown"} (${userEntry?.status ?? "NONE"})`;
    });
  return `${userName}: ${favorites.join(", ")}`;
}
