import {
  CATEGORY_LABEL,
  CATEGORY_ORDER,
  type Category,
  type CategoryListSettings,
  type CategorySlug,
  type Circle,
  type CircleMember,
  type Item,
  type Recommendation,
  type SearchResult,
  type User,
  type UserItem,
  type UserTasteBlurb,
  normalizeQuery,
  toCategory,
  toCategorySlug,
} from "@/lib/domain";

export const CURRENT_USER_ID = "user_me";

export const users: User[] = [
  {
    id: "user_me",
    handle: "me",
    displayName: "You",
    createdAt: "2025-11-04T12:00:00.000Z",
  },
  {
    id: "user_rin",
    handle: "rin",
    displayName: "Rin Sato",
    createdAt: "2025-10-10T11:00:00.000Z",
  },
  {
    id: "user_omar",
    handle: "omar",
    displayName: "Omar Lee",
    createdAt: "2025-09-12T08:00:00.000Z",
  },
];

export const circles: Circle[] = [
  { id: "circle_family", ownerUserId: CURRENT_USER_ID, name: "Family" },
  { id: "circle_film", ownerUserId: CURRENT_USER_ID, name: "Film club" },
];

export const circleMembers: CircleMember[] = [
  { circleId: "circle_family", userId: CURRENT_USER_ID, role: "owner" },
  { circleId: "circle_family", userId: "user_rin", role: "member" },
  { circleId: "circle_film", userId: CURRENT_USER_ID, role: "owner" },
  { circleId: "circle_film", userId: "user_omar", role: "member" },
  { circleId: "circle_film", userId: "user_rin", role: "member" },
];

export const categoryListSettings: CategoryListSettings[] = CATEGORY_ORDER.map(
  (category) => ({
    userId: CURRENT_USER_ID,
    category,
    visibility: "CIRCLE",
    circleId: "circle_film",
    unlistedToken: null,
  }),
);

export const items: Item[] = [
  {
    id: "itm_movie_arrival",
    category: "MOVIE",
    provider: "TMDB",
    providerId: "329865",
    title: "Arrival",
    year: 2016,
    creators: ["Denis Villeneuve"],
    posterUrl: null,
    thumbUrl: null,
    description: "A linguist enters first contact and changes how time feels.",
    tags: ["first contact", "linguistics", "emotion"],
  },
  {
    id: "itm_movie_drive",
    category: "MOVIE",
    provider: "TMDB",
    providerId: "64690",
    title: "Drive",
    year: 2011,
    creators: ["Nicolas Winding Refn"],
    posterUrl: null,
    thumbUrl: null,
    description: "A detached driver drifts through neon and danger.",
    tags: ["noir", "synth", "crime"],
  },
  {
    id: "itm_tv_bear",
    category: "TV",
    provider: "TMDB",
    providerId: "136315",
    title: "The Bear",
    year: 2022,
    creators: ["Christopher Storer"],
    posterUrl: null,
    thumbUrl: null,
    description: "A chef tries to repair a kitchen and his own pace.",
    tags: ["work", "family", "stress"],
  },
  {
    id: "itm_music_nfr",
    category: "MUSIC",
    provider: "MUSICBRAINZ",
    providerId: "nfr-2019",
    title: "Norman Fucking Rockwell!",
    year: 2019,
    creators: ["Lana Del Rey"],
    posterUrl: null,
    thumbUrl: null,
    description: "Soft California despair over cinematic ballads.",
    tags: ["singer-songwriter", "melancholic"],
  },
  {
    id: "itm_anime_monster",
    category: "ANIME",
    provider: "ANILIST",
    providerId: "19",
    title: "Monster",
    year: 2004,
    creators: ["Naoki Urasawa"],
    posterUrl: null,
    thumbUrl: null,
    description: "A surgeon follows the consequences of one decision.",
    tags: ["thriller", "ethics", "slow burn"],
  },
  {
    id: "itm_book_earthsea",
    category: "BOOK",
    provider: "OPEN_LIBRARY",
    providerId: "OL82563W",
    title: "A Wizard of Earthsea",
    year: 1968,
    creators: ["Ursula K. Le Guin"],
    posterUrl: null,
    thumbUrl: null,
    description: "A young mage learns language, pride, and consequence.",
    tags: ["coming of age", "fantasy"],
  },
  {
    id: "itm_game_outerwilds",
    category: "GAME",
    provider: "RAWG",
    providerId: "4200",
    title: "Outer Wilds",
    year: 2019,
    creators: ["Mobius Digital"],
    posterUrl: null,
    thumbUrl: null,
    description: "A tiny solar system where curiosity is progression.",
    tags: ["exploration", "time loop", "space"],
  },
  {
    id: "itm_book_manual_nightwatch",
    category: "BOOK",
    provider: "MANUAL",
    providerId: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    title: "Night Watch",
    year: 2002,
    creators: ["Terry Pratchett"],
    posterUrl: null,
    thumbUrl: null,
    description: null,
    tags: [],
  },
];

export const userItems: UserItem[] = [
  {
    userId: CURRENT_USER_ID,
    itemId: "itm_movie_arrival",
    starred: true,
    status: "FINISHED",
    verdictScore: 1,
    impactAge: 24,
    noteOneLiner: "Every rewatch lands harder.",
    updatedAt: "2026-01-14T19:33:00.000Z",
  },
  {
    userId: CURRENT_USER_ID,
    itemId: "itm_movie_drive",
    starred: false,
    status: "FINISHED",
    verdictScore: 3,
    impactAge: 23,
    noteOneLiner: null,
    updatedAt: "2026-01-12T13:22:00.000Z",
  },
  {
    userId: CURRENT_USER_ID,
    itemId: "itm_tv_bear",
    starred: true,
    status: "STARTED",
    verdictScore: null,
    impactAge: null,
    noteOneLiner: null,
    updatedAt: "2026-01-20T15:15:00.000Z",
  },
  {
    userId: CURRENT_USER_ID,
    itemId: "itm_music_nfr",
    starred: true,
    status: "FINISHED",
    verdictScore: 2,
    impactAge: 27,
    noteOneLiner: "My late-night default.",
    updatedAt: "2026-01-19T16:20:00.000Z",
  },
  {
    userId: CURRENT_USER_ID,
    itemId: "itm_anime_monster",
    starred: false,
    status: "DROPPED",
    verdictScore: 4,
    impactAge: null,
    noteOneLiner: "Great craft, wrong season for me.",
    updatedAt: "2026-01-10T10:00:00.000Z",
  },
  {
    userId: CURRENT_USER_ID,
    itemId: "itm_book_earthsea",
    starred: true,
    status: "FINISHED",
    verdictScore: 2,
    impactAge: 16,
    noteOneLiner: "Still clean and wise.",
    updatedAt: "2026-01-16T18:20:00.000Z",
  },
  {
    userId: CURRENT_USER_ID,
    itemId: "itm_game_outerwilds",
    starred: true,
    status: "FINISHED",
    verdictScore: 1,
    impactAge: 25,
    noteOneLiner: "The ending felt earned.",
    updatedAt: "2026-01-18T18:20:00.000Z",
  },
  {
    userId: CURRENT_USER_ID,
    itemId: "itm_book_manual_nightwatch",
    starred: false,
    status: "NONE",
    verdictScore: null,
    impactAge: null,
    noteOneLiner: null,
    updatedAt: "2026-01-11T09:20:00.000Z",
  },
];

export const recommendations: Recommendation[] = [
  {
    id: "rec_001",
    fromUserId: "user_rin",
    toUserId: CURRENT_USER_ID,
    itemId: "itm_movie_arrival",
    state: "ACK_FINISHED",
    recipientVerdictScore: 1,
    excellent: true,
    incompatible: false,
    parentRecommendationId: null,
    createdAt: "2026-01-01T12:00:00.000Z",
    updatedAt: "2026-01-15T12:00:00.000Z",
  },
  {
    id: "rec_002",
    fromUserId: CURRENT_USER_ID,
    toUserId: "user_omar",
    itemId: "itm_game_outerwilds",
    state: "ACK_STARTED",
    recipientVerdictScore: null,
    excellent: false,
    incompatible: false,
    parentRecommendationId: null,
    createdAt: "2026-01-10T12:00:00.000Z",
    updatedAt: "2026-01-10T13:00:00.000Z",
  },
  {
    id: "rec_003",
    fromUserId: "user_omar",
    toUserId: CURRENT_USER_ID,
    itemId: "itm_anime_monster",
    state: "ACK_DROPPED",
    recipientVerdictScore: 5,
    excellent: false,
    incompatible: true,
    parentRecommendationId: null,
    createdAt: "2026-01-05T12:00:00.000Z",
    updatedAt: "2026-01-11T12:00:00.000Z",
  },
];

export const tasteBlurbs: UserTasteBlurb[] = [
  {
    userId: CURRENT_USER_ID,
    text: "You chase precise emotion and patient worldbuilding. Arrival, Outer Wilds, and Earthsea suggest you reward ideas that land with tenderness instead of spectacle.",
    isVisible: true,
    status: "READY",
    provider: "stub-llm",
    model: "foundation-v1",
    promptVersion: 1,
    generatedAt: "2026-01-19T10:00:00.000Z",
    updatedAt: "2026-01-19T10:00:00.000Z",
    errorMessage: null,
  },
  {
    userId: "user_rin",
    text: null,
    isVisible: true,
    status: "NONE",
    provider: null,
    model: null,
    promptVersion: 1,
    generatedAt: null,
    updatedAt: "2026-01-18T12:00:00.000Z",
    errorMessage: null,
  },
];

export interface EnrichedListItem {
  item: Item;
  userItem: UserItem;
}

export function getUserByHandle(handle: string): User | null {
  return users.find((user) => user.handle.toLowerCase() === handle.toLowerCase()) ?? null;
}

export function getCurrentUser(): User {
  return users.find((user) => user.id === CURRENT_USER_ID) ?? users[0];
}

export function getTasteBlurbForUser(userId: string): UserTasteBlurb | null {
  return tasteBlurbs.find((entry) => entry.userId === userId) ?? null;
}

export function getCategorySummaryForUser(userId: string): Record<Category, number> {
  return CATEGORY_ORDER.reduce<Record<Category, number>>((accumulator, category) => {
    const count = userItems.filter((entry) => {
      const item = items.find((candidate) => candidate.id === entry.itemId);
      return entry.userId === userId && item?.category === category;
    }).length;
    accumulator[category] = count;
    return accumulator;
  }, {
    TV: 0,
    MOVIE: 0,
    MUSIC: 0,
    ANIME: 0,
    BOOK: 0,
    GAME: 0,
  });
}

export function getListItemsForUserAndCategory(
  userId: string,
  categorySlug: CategorySlug,
): EnrichedListItem[] {
  const category = toCategory(categorySlug);
  return userItems
    .filter((entry) => entry.userId === userId)
    .map((entry) => ({
      userItem: entry,
      item: items.find((candidate) => candidate.id === entry.itemId),
    }))
    .filter((entry): entry is { item: Item; userItem: UserItem } => Boolean(entry.item))
    .filter((entry) => entry.item.category === category);
}

export function getItemById(itemId: string): Item | null {
  return items.find((item) => item.id === itemId) ?? null;
}

export function getUserItem(userId: string, itemId: string): UserItem | null {
  return (
    userItems.find((entry) => entry.userId === userId && entry.itemId === itemId) ?? null
  );
}

export function getRecommendationsForInbox(userId: string): Recommendation[] {
  return recommendations
    .filter((entry) => entry.toUserId === userId)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export function getRecommendationsForItem(itemId: string): Recommendation[] {
  return recommendations
    .filter((entry) => entry.itemId === itemId)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export function getUserNameById(userId: string): string {
  return users.find((entry) => entry.id === userId)?.displayName ?? "Unknown";
}

export function getCircleDetailsForOwner(ownerUserId: string): Array<{
  circle: Circle;
  members: User[];
}> {
  return circles
    .filter((circle) => circle.ownerUserId === ownerUserId)
    .map((circle) => {
      const members = circleMembers
        .filter((entry) => entry.circleId === circle.id)
        .map((entry) => users.find((candidate) => candidate.id === entry.userId))
        .filter((entry): entry is User => Boolean(entry));
      return { circle, members };
    });
}

export function searchItemsInCache(
  query: string,
  category: Category,
  limit = 8,
): SearchResult[] {
  const normalized = normalizeQuery(query);
  if (!normalized) {
    return [];
  }
  return items
    .filter((item) => item.category === category)
    .filter((item) => {
      const titleHit = normalizeQuery(item.title).includes(normalized);
      const creatorHit = item.creators.some((creator) =>
        normalizeQuery(creator).includes(normalized),
      );
      return titleHit || creatorHit;
    })
    .slice(0, limit)
    .map((item) => ({
      category: item.category,
      provider: item.provider,
      providerId: item.providerId,
      title: item.title,
      year: item.year,
      creators: item.creators,
      thumbUrl: item.thumbUrl,
      source: "DB",
    }));
}

export function listCategoryLinks(handle: string): Array<{
  category: Category;
  label: string;
  href: string;
}> {
  return CATEGORY_ORDER.map((category) => ({
    category,
    label: CATEGORY_LABEL[category],
    href: `/u/${handle}/${toCategorySlug(category)}`,
  }));
}
