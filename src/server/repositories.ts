import "server-only";

import { randomUUID } from "node:crypto";

import {
  Category as DbCategory,
  ListVisibility as DbListVisibility,
  type Prisma,
  Provider as DbProvider,
} from "@prisma/client";

import {
  CATEGORY_ORDER,
  NOTE_ONE_LINER_MAX_LENGTH,
  type CategoryListEntry,
  type Category,
  type Item,
  type Recommendation,
  type RecommendationWithNames,
  type SearchResult,
  type TasteWaveCategoryMetric,
  type User,
  type UserItem,
  type UserTasteBlurb,
  type VerdictScore,
} from "@/lib/domain";
import { prisma } from "@/server/db";
import { getProviderDetails } from "@/server/providers/registry";

const DEV_USER_HANDLE = process.env.DEV_USER_HANDLE ?? "me";
const DEV_DISPLAY_NAME = process.env.DEV_DISPLAY_NAME ?? "You";

interface AddItemInput {
  category: Category;
  provider: Item["provider"];
  providerId: string;
  title: string;
  verdictScore: Exclude<UserItem["verdictScore"], null>;
  year?: number | null;
  creators?: string[];
  posterUrl?: string | null;
  thumbUrl?: string | null;
  description?: string | null;
  airingStatus?: Item["airingStatus"];
  seasonCount?: number | null;
  episodeCount?: number | null;
  noteOneLiner?: string | null;
  defaultStatus?: UserItem["status"];
}

interface DbItemRecord {
  id: string;
  category: DbCategory;
  provider: DbProvider;
  providerId: string;
  title: string;
  year: number | null;
  creators: Prisma.JsonValue | null;
  posterUrl: string | null;
  thumbUrl: string | null;
  description: string | null;
  airingStatus: string | null;
  seasonCount: number | null;
  episodeCount: number | null;
  tags: Prisma.JsonValue | null;
}

function parseStringArray(input: Prisma.JsonValue | null): string[] {
  if (!Array.isArray(input)) {
    return [];
  }
  return input.filter((entry): entry is string => typeof entry === "string");
}

function toDomainUser(user: {
  id: string;
  handle: string;
  displayName: string;
  createdAt: Date;
}): User {
  return {
    id: user.id,
    handle: user.handle,
    displayName: user.displayName,
    createdAt: user.createdAt.toISOString(),
  };
}

function toDomainItem(item: DbItemRecord): Item {
  return {
    id: item.id,
    category: item.category,
    provider: item.provider,
    providerId: item.providerId,
    title: item.title,
    year: item.year,
    creators: parseStringArray(item.creators),
    posterUrl: item.posterUrl,
    thumbUrl: item.thumbUrl,
    description: item.description,
    airingStatus: item.airingStatus as Item["airingStatus"],
    seasonCount: item.seasonCount,
    episodeCount: item.episodeCount,
    tags: parseStringArray(item.tags),
  };
}

function toDomainUserItem(entry: {
  userId: string;
  itemId: string;
  starred: boolean;
  status: UserItem["status"];
  verdictScore: number | null;
  impactAge: number | null;
  noteOneLiner: string | null;
  updatedAt: Date;
}): UserItem {
  return {
    userId: entry.userId,
    itemId: entry.itemId,
    starred: entry.starred,
    status: entry.status,
    verdictScore: entry.verdictScore as UserItem["verdictScore"],
    impactAge: entry.impactAge,
    noteOneLiner: entry.noteOneLiner,
    updatedAt: entry.updatedAt.toISOString(),
  };
}

function toDomainRecommendation(entry: {
  id: string;
  fromUserId: string;
  toUserId: string;
  itemId: string;
  state: Recommendation["state"];
  recipientVerdictScore: number | null;
  excellent: boolean;
  incompatible: boolean;
  parentRecommendationId: string | null;
  createdAt: Date;
  updatedAt: Date;
}): Recommendation {
  return {
    id: entry.id,
    fromUserId: entry.fromUserId,
    toUserId: entry.toUserId,
    itemId: entry.itemId,
    state: entry.state,
    recipientVerdictScore: entry.recipientVerdictScore as Recommendation["recipientVerdictScore"],
    excellent: entry.excellent,
    incompatible: entry.incompatible,
    parentRecommendationId: entry.parentRecommendationId,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
  };
}

function toDomainTasteBlurb(entry: {
  userId: string;
  text: string | null;
  isVisible: boolean;
  status: UserTasteBlurb["status"];
  provider: string | null;
  model: string | null;
  promptVersion: number;
  generatedAt: Date | null;
  updatedAt: Date;
  errorMessage: string | null;
}): UserTasteBlurb {
  return {
    userId: entry.userId,
    text: entry.text,
    isVisible: entry.isVisible,
    status: entry.status,
    provider: entry.provider,
    model: entry.model,
    promptVersion: entry.promptVersion,
    generatedAt: entry.generatedAt ? entry.generatedAt.toISOString() : null,
    updatedAt: entry.updatedAt.toISOString(),
    errorMessage: entry.errorMessage,
  };
}

function normalizeNote(note?: string | null): string | null {
  if (!note) {
    return null;
  }
  const trimmed = note.trim();
  if (!trimmed) {
    return null;
  }
  return trimmed.slice(0, NOTE_ONE_LINER_MAX_LENGTH);
}

function mapToDbCategory(category: Category): DbCategory {
  return category as DbCategory;
}

function mapToDbProvider(provider: Item["provider"]): DbProvider {
  return provider as DbProvider;
}

type AcknowledgedRecommendationState = Exclude<Recommendation["state"], "SENT">;

function recommendationStateToUserItemStatus(state: Recommendation["state"]): UserItem["status"] {
  if (state === "ACK_STARTED") {
    return "STARTED";
  }
  if (state === "ACK_FINISHED") {
    return "FINISHED";
  }
  if (state === "ACK_DROPPED") {
    return "DROPPED";
  }
  return "NONE";
}

function resolveInitialUserItemStatus(input: AddItemInput): UserItem["status"] {
  if (input.defaultStatus) {
    return input.defaultStatus;
  }
  return input.provider === "MANUAL" ? "FINISHED" : "NONE";
}

async function resolveItemMetadata(
  input: AddItemInput,
): Promise<{
  posterUrl: string | null;
  thumbUrl: string | null;
  description: string | null;
  airingStatus: Item["airingStatus"];
  seasonCount: number | null;
  episodeCount: number | null;
}> {
  const base = {
    posterUrl: input.posterUrl ?? null,
    thumbUrl: input.thumbUrl ?? null,
    description: input.description ?? null,
    airingStatus: input.airingStatus ?? null,
    seasonCount: input.seasonCount ?? null,
    episodeCount: input.episodeCount ?? null,
  };

  if (input.provider === "MANUAL") {
    return base;
  }

  const needsEnrichment =
    input.category === "TV" &&
    (!base.description ||
      !base.posterUrl ||
      !base.thumbUrl ||
      !base.airingStatus ||
      !base.seasonCount ||
      !base.episodeCount);

  if (!needsEnrichment) {
    return base;
  }

  const enriched = await getProviderDetails(input.category, input.providerId, input.title);
  if (!enriched) {
    return base;
  }

  return {
    posterUrl: base.posterUrl ?? enriched.posterUrl ?? null,
    thumbUrl: base.thumbUrl ?? enriched.thumbUrl ?? null,
    description: base.description ?? enriched.description ?? null,
    airingStatus: base.airingStatus ?? enriched.airingStatus ?? null,
    seasonCount: base.seasonCount ?? enriched.seasonCount ?? null,
    episodeCount: base.episodeCount ?? enriched.episodeCount ?? null,
  };
}

export async function ensureCurrentUser(): Promise<User> {
  const user = await prisma.user.upsert({
    where: { handle: DEV_USER_HANDLE },
    update: { displayName: DEV_DISPLAY_NAME },
    create: {
      handle: DEV_USER_HANDLE,
      displayName: DEV_DISPLAY_NAME,
    },
  });

  await Promise.all(
    CATEGORY_ORDER.map((category) =>
      prisma.categoryListSettings.upsert({
        where: {
          userId_category: {
            userId: user.id,
            category: category as DbCategory,
          },
        },
        update: {},
        create: {
          userId: user.id,
          category: category as DbCategory,
          visibility: DbListVisibility.PRIVATE,
          circleId: null,
          unlistedToken: null,
        },
      }),
    ),
  );

  return toDomainUser(user);
}

export async function getCurrentUser(): Promise<User> {
  return ensureCurrentUser();
}

export async function getUserByHandle(handle: string): Promise<User | null> {
  const user = await prisma.user.findUnique({ where: { handle } });
  if (!user) {
    return null;
  }
  return toDomainUser(user);
}

export async function getCategorySummaryForUser(
  userId: string,
): Promise<Record<Category, number>> {
  const entries = await prisma.userItem.findMany({
    where: { userId },
    select: {
      item: {
        select: {
          category: true,
        },
      },
    },
  });

  const base: Record<Category, number> = {
    TV: 0,
    MOVIE: 0,
    MUSIC: 0,
    ANIME: 0,
    BOOK: 0,
    GAME: 0,
  };

  for (const entry of entries) {
    base[entry.item.category as Category] += 1;
  }

  return base;
}

export async function getTasteWaveMetricsForUser(
  userId: string,
): Promise<TasteWaveCategoryMetric[]> {
  const entries = await prisma.userItem.findMany({
    where: { userId },
    select: {
      status: true,
      starred: true,
      verdictScore: true,
      updatedAt: true,
      item: {
        select: {
          category: true,
        },
      },
    },
  });

  const base = new Map<
    Category,
    {
      category: Category;
      total: number;
      finished: number;
      started: number;
      dropped: number;
      starred: number;
      verdictSum: number;
      verdictCount: number;
      lastVerdictScore: VerdictScore | null;
      lastUpdatedAt: Date | null;
    }
  >(
    CATEGORY_ORDER.map((category) => [
      category,
      {
        category,
        total: 0,
        finished: 0,
        started: 0,
        dropped: 0,
        starred: 0,
        verdictSum: 0,
        verdictCount: 0,
        lastVerdictScore: null,
        lastUpdatedAt: null,
      },
    ]),
  );

  for (const entry of entries) {
    const category = entry.item.category as Category;
    const metric = base.get(category);
    if (!metric) {
      continue;
    }

    metric.total += 1;
    if (entry.status === "FINISHED") {
      metric.finished += 1;
    } else if (entry.status === "STARTED") {
      metric.started += 1;
    } else if (entry.status === "DROPPED") {
      metric.dropped += 1;
    }

    if (entry.starred) {
      metric.starred += 1;
    }

    if (entry.verdictScore && entry.verdictScore >= 1 && entry.verdictScore <= 5) {
      metric.verdictSum += entry.verdictScore;
      metric.verdictCount += 1;
    }

    if (!metric.lastUpdatedAt || entry.updatedAt > metric.lastUpdatedAt) {
      metric.lastUpdatedAt = entry.updatedAt;
      metric.lastVerdictScore =
        entry.verdictScore && entry.verdictScore >= 1 && entry.verdictScore <= 5
          ? (entry.verdictScore as VerdictScore)
          : null;
    }
  }

  return CATEGORY_ORDER.map((category) => {
    const metric = base.get(category)!;
    return {
      category,
      total: metric.total,
      finished: metric.finished,
      started: metric.started,
      dropped: metric.dropped,
      starred: metric.starred,
      avgVerdictScore:
        metric.verdictCount > 0
          ? Number((metric.verdictSum / metric.verdictCount).toFixed(2))
          : null,
      lastVerdictScore: metric.lastVerdictScore,
      lastUpdatedAt: metric.lastUpdatedAt ? metric.lastUpdatedAt.toISOString() : null,
    };
  });
}

export async function getTasteBlurbForUser(userId: string): Promise<UserTasteBlurb | null> {
  const blurb = await prisma.userTasteBlurb.findUnique({ where: { userId } });
  if (!blurb) {
    return null;
  }
  return toDomainTasteBlurb(blurb);
}

export async function listCategoryEntriesForUser(
  userId: string,
  category: Category,
): Promise<CategoryListEntry[]> {
  const entries = await prisma.userItem.findMany({
    where: {
      userId,
      item: {
        category: mapToDbCategory(category),
      },
    },
    include: {
      item: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return entries.map((entry) => ({
    item: toDomainItem(entry.item),
    userItem: toDomainUserItem(entry),
  }));
}

export async function searchCachedItems(
  category: Category,
  query: string,
  limit = 8,
): Promise<SearchResult[]> {
  const normalized = query.trim();
  if (!normalized) {
    return [];
  }

  const matches = await prisma.item.findMany({
    where: {
      category: mapToDbCategory(category),
      OR: [
        {
          title: {
            contains: normalized,
            mode: "insensitive",
          },
        },
      ],
    },
    orderBy: {
      title: "asc",
    },
    take: limit,
  });

  return matches.map((entry) => ({
    category: entry.category as Category,
    provider: entry.provider as Item["provider"],
    providerId: entry.providerId,
    title: entry.title,
    year: entry.year,
    creators: parseStringArray(entry.creators),
    posterUrl: entry.posterUrl,
    thumbUrl: entry.thumbUrl,
    description: entry.description,
    airingStatus: entry.airingStatus as Item["airingStatus"],
    seasonCount: entry.seasonCount,
    episodeCount: entry.episodeCount,
    source: "DB",
  }));
}

export async function upsertItemAndUserItemForCurrentUser(
  input: AddItemInput,
): Promise<{ item: Item; userItem: UserItem }> {
  const currentUser = await ensureCurrentUser();
  const normalizedNote = normalizeNote(input.noteOneLiner);
  const metadata = await resolveItemMetadata(input);
  const initialStatus = resolveInitialUserItemStatus(input);
  const providerId =
    input.provider === "MANUAL" || !input.providerId || input.providerId === "manual-fallback"
      ? randomUUID()
      : input.providerId;

  const result = await prisma.$transaction(async (tx) => {
    const item = await tx.item.upsert({
      where: {
        category_provider_providerId: {
          category: mapToDbCategory(input.category),
          provider: mapToDbProvider(input.provider),
          providerId,
        },
      },
      update: {
        title: input.title,
        year: input.year ?? null,
        creators: input.creators ?? [],
        posterUrl: metadata.posterUrl ?? undefined,
        thumbUrl: metadata.thumbUrl ?? undefined,
        description: metadata.description ?? undefined,
        airingStatus: metadata.airingStatus ?? undefined,
        seasonCount: metadata.seasonCount ?? undefined,
        episodeCount: metadata.episodeCount ?? undefined,
      },
      create: {
        category: mapToDbCategory(input.category),
        provider: mapToDbProvider(input.provider),
        providerId,
        title: input.title,
        year: input.year ?? null,
        creators: input.creators ?? [],
        posterUrl: metadata.posterUrl,
        thumbUrl: metadata.thumbUrl,
        description: metadata.description,
        airingStatus: metadata.airingStatus ?? null,
        seasonCount: metadata.seasonCount,
        episodeCount: metadata.episodeCount,
      },
    });

    const userItem = await tx.userItem.upsert({
      where: {
        userId_itemId: {
          userId: currentUser.id,
          itemId: item.id,
        },
      },
      update: {
        updatedAt: new Date(),
        verdictScore: input.verdictScore,
        noteOneLiner: normalizedNote ?? undefined,
      },
      create: {
        userId: currentUser.id,
        itemId: item.id,
        status: initialStatus,
        verdictScore: input.verdictScore,
        noteOneLiner: normalizedNote,
      },
    });

    return { item, userItem };
  });

  return {
    item: toDomainItem(result.item),
    userItem: toDomainUserItem(result.userItem),
  };
}

export async function getItemDetailForCurrentUser(
  itemId: string,
): Promise<{
  item: Item;
  userItem: UserItem | null;
  recommendations: RecommendationWithNames[];
} | null> {
  const currentUser = await ensureCurrentUser();

  const foundItem = await prisma.item.findUnique({ where: { id: itemId } });
  if (!foundItem) {
    return null;
  }
  let item = foundItem;

  if (
    item.category === "TV" &&
    (!item.description ||
      !item.posterUrl ||
      !item.thumbUrl ||
      !item.airingStatus ||
      !item.seasonCount ||
      !item.episodeCount)
  ) {
    const enriched = await getProviderDetails("TV", item.providerId, item.title);
    if (enriched) {
      item = await prisma.item.update({
        where: { id: item.id },
        data: {
          posterUrl: item.posterUrl ?? enriched.posterUrl ?? undefined,
          thumbUrl: item.thumbUrl ?? enriched.thumbUrl ?? undefined,
          description: item.description ?? enriched.description ?? undefined,
          airingStatus:
            (item.airingStatus as Item["airingStatus"]) ??
            enriched.airingStatus ??
            undefined,
          seasonCount: item.seasonCount ?? enriched.seasonCount ?? undefined,
          episodeCount: item.episodeCount ?? enriched.episodeCount ?? undefined,
        },
      });
    }
  }

  const userItem = await prisma.userItem.findUnique({
    where: {
      userId_itemId: {
        userId: currentUser.id,
        itemId,
      },
    },
  });

  const recommendations = await prisma.recommendation.findMany({
    where: { itemId },
    include: {
      fromUser: {
        select: {
          displayName: true,
        },
      },
      toUser: {
        select: {
          displayName: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return {
    item: toDomainItem(item),
    userItem: userItem ? toDomainUserItem(userItem) : null,
    recommendations: recommendations.map((entry) => ({
      recommendation: toDomainRecommendation(entry),
      fromName: entry.fromUser.displayName,
      toName: entry.toUser.displayName,
    })),
  };
}

export async function getInboxForCurrentUser(): Promise<RecommendationWithNames[]> {
  const currentUser = await ensureCurrentUser();
  const entries = await prisma.recommendation.findMany({
    where: {
      toUserId: currentUser.id,
    },
    include: {
      fromUser: {
        select: {
          displayName: true,
        },
      },
      toUser: {
        select: {
          displayName: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return entries.map((entry) => ({
    recommendation: toDomainRecommendation(entry),
    fromName: entry.fromUser.displayName,
    toName: entry.toUser.displayName,
  }));
}

export async function acceptRecommendationForCurrentUser(
  recommendationId: string,
): Promise<{ recommendation: Recommendation; userItem: UserItem } | null> {
  const currentUser = await ensureCurrentUser();

  const result = await prisma.$transaction(async (tx) => {
    const recommendation = await tx.recommendation.findFirst({
      where: {
        id: recommendationId,
        toUserId: currentUser.id,
      },
    });

    if (!recommendation) {
      return null;
    }

    const userItem = await tx.userItem.upsert({
      where: {
        userId_itemId: {
          userId: currentUser.id,
          itemId: recommendation.itemId,
        },
      },
      update: {
        updatedAt: new Date(),
      },
      create: {
        userId: currentUser.id,
        itemId: recommendation.itemId,
        status: recommendationStateToUserItemStatus(recommendation.state as Recommendation["state"]),
      },
    });

    return { recommendation, userItem };
  });

  if (!result) {
    return null;
  }

  return {
    recommendation: toDomainRecommendation(result.recommendation),
    userItem: toDomainUserItem(result.userItem),
  };
}

export async function setRecommendationStateForCurrentUser(input: {
  recommendationId: string;
  state: AcknowledgedRecommendationState;
  recipientVerdictScore?: Recommendation["recipientVerdictScore"] | null;
  excellent?: boolean;
  incompatible?: boolean;
}): Promise<{ recommendation: Recommendation; userItem: UserItem } | null> {
  const currentUser = await ensureCurrentUser();

  const result = await prisma.$transaction(async (tx) => {
    const recommendation = await tx.recommendation.findFirst({
      where: {
        id: input.recommendationId,
        toUserId: currentUser.id,
      },
    });
    if (!recommendation) {
      return null;
    }

    const updatedRecommendation = await tx.recommendation.update({
      where: { id: recommendation.id },
      data: {
        state: input.state,
        recipientVerdictScore: input.recipientVerdictScore ?? undefined,
        excellent: input.excellent ?? undefined,
        incompatible: input.incompatible ?? undefined,
        updatedAt: new Date(),
      },
    });

    const userItemStatus = recommendationStateToUserItemStatus(input.state);
    const userItem = await tx.userItem.upsert({
      where: {
        userId_itemId: {
          userId: currentUser.id,
          itemId: recommendation.itemId,
        },
      },
      update: {
        status: userItemStatus,
        updatedAt: new Date(),
      },
      create: {
        userId: currentUser.id,
        itemId: recommendation.itemId,
        status: userItemStatus,
      },
    });

    return { recommendation: updatedRecommendation, userItem };
  });

  if (!result) {
    return null;
  }

  return {
    recommendation: toDomainRecommendation(result.recommendation),
    userItem: toDomainUserItem(result.userItem),
  };
}

export async function listCirclesForCurrentUser(): Promise<Array<{
  id: string;
  name: string;
  members: Array<{ id: string; handle: string; displayName: string }>;
}>> {
  const currentUser = await ensureCurrentUser();
  const circles = await prisma.circle.findMany({
    where: { ownerUserId: currentUser.id },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              handle: true,
              displayName: true,
            },
          },
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  return circles.map((circle) => ({
    id: circle.id,
    name: circle.name,
    members: circle.members.map((member) => ({
      id: member.user.id,
      handle: member.user.handle,
      displayName: member.user.displayName,
    })),
  }));
}
