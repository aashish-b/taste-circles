export type Category = "TV" | "MOVIE" | "MUSIC" | "ANIME" | "BOOK" | "GAME";
export type Provider =
  | "TMDB"
  | "OPEN_LIBRARY"
  | "MUSICBRAINZ"
  | "ANILIST"
  | "RAWG"
  | "MANUAL";
export type UserItemStatus = "NONE" | "STARTED" | "FINISHED" | "DROPPED";
export type RecommendationState =
  | "SENT"
  | "ACK_STARTED"
  | "ACK_FINISHED"
  | "ACK_DROPPED";
export type ListVisibility = "PRIVATE" | "UNLISTED_LINK" | "CIRCLE" | "PUBLIC";
export type VerdictScore = 1 | 2 | 3 | 4 | 5;

export type CategorySlug =
  | "tv"
  | "movies"
  | "music"
  | "anime"
  | "books"
  | "games";

export interface User {
  id: string;
  handle: string;
  displayName: string;
  createdAt: string;
}

export interface Item {
  id: string;
  category: Category;
  provider: Provider;
  providerId: string;
  title: string;
  year: number | null;
  creators: string[];
  posterUrl: string | null;
  thumbUrl: string | null;
  description: string | null;
  airingStatus?: "ONGOING" | "FINISHED" | null;
  seasonCount?: number | null;
  episodeCount?: number | null;
  tags: string[];
}

export interface UserItem {
  userId: string;
  itemId: string;
  starred: boolean;
  status: UserItemStatus;
  verdictScore: VerdictScore | null;
  impactAge: number | null;
  noteOneLiner: string | null;
  updatedAt: string;
}

export interface CategoryListEntry {
  item: Item;
  userItem: UserItem;
}

export interface Recommendation {
  id: string;
  fromUserId: string;
  toUserId: string;
  itemId: string;
  state: RecommendationState;
  recipientVerdictScore: VerdictScore | null;
  excellent: boolean;
  incompatible: boolean;
  parentRecommendationId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RecommendationWithNames {
  recommendation: Recommendation;
  fromName: string;
  toName: string;
}

export interface CategoryListSettings {
  userId: string;
  category: Category;
  visibility: ListVisibility;
  circleId: string | null;
  unlistedToken: string | null;
}

export interface UserTasteBlurb {
  userId: string;
  text: string | null;
  isVisible: boolean;
  status: "NONE" | "PENDING" | "READY" | "ERROR";
  provider: string | null;
  model: string | null;
  promptVersion: number;
  generatedAt: string | null;
  updatedAt: string;
  errorMessage: string | null;
}

export interface TasteWaveCategoryMetric {
  category: Category;
  total: number;
  finished: number;
  started: number;
  dropped: number;
  starred: number;
  avgVerdictScore: number | null;
  lastVerdictScore: VerdictScore | null;
  lastUpdatedAt: string | null;
}

export interface CategoryProfileHighlight {
  category: Category;
  total: number;
  ratedCount: number;
  finishedCount: number;
  startedCount: number;
  droppedCount: number;
  lastItemTitle: string | null;
  lastUpdatedAt: string | null;
}

export interface ProfileNextAction {
  id: "inbox" | "rate" | "finish";
  label: string;
  href: string;
}

export interface CircleMemberPulse {
  id: string;
  handle: string;
  displayName: string;
  sentByYou: number;
  receivedFromThem: number;
  lastExchangeAt: string | null;
}

export interface CirclePulse {
  id: string;
  name: string;
  sentByYou: number;
  receivedFromThem: number;
  members: CircleMemberPulse[];
}

export interface Circle {
  id: string;
  ownerUserId: string;
  name: string;
}

export interface CircleMember {
  circleId: string;
  userId: string;
  role: "owner" | "member";
}

export interface SearchResult {
  category: Category;
  provider: Provider;
  providerId: string;
  title: string;
  year: number | null;
  creators: string[];
  posterUrl?: string | null;
  thumbUrl: string | null;
  description?: string | null;
  airingStatus?: "ONGOING" | "FINISHED" | null;
  seasonCount?: number | null;
  episodeCount?: number | null;
  source: "DB" | "PROVIDER";
}

export const CATEGORY_ORDER: Category[] = [
  "TV",
  "MOVIE",
  "MUSIC",
  "ANIME",
  "BOOK",
  "GAME",
];

export const CATEGORY_SLUGS: CategorySlug[] = [
  "tv",
  "movies",
  "music",
  "anime",
  "books",
  "games",
];

export const CATEGORY_BY_SLUG: Record<CategorySlug, Category> = {
  tv: "TV",
  movies: "MOVIE",
  music: "MUSIC",
  anime: "ANIME",
  books: "BOOK",
  games: "GAME",
};

export const SLUG_BY_CATEGORY: Record<Category, CategorySlug> = {
  TV: "tv",
  MOVIE: "movies",
  MUSIC: "music",
  ANIME: "anime",
  BOOK: "books",
  GAME: "games",
};

export const CATEGORY_LABEL: Record<Category, string> = {
  TV: "TV",
  MOVIE: "Movies",
  MUSIC: "Music",
  ANIME: "Anime",
  BOOK: "Books",
  GAME: "Games",
};

export const STATUS_LABEL: Record<UserItemStatus, string> = {
  NONE: "Not started",
  STARTED: "Started",
  FINISHED: "Finished",
  DROPPED: "Dropped",
};

export const RECOMMENDATION_STATE_LABEL: Record<RecommendationState, string> = {
  SENT: "Sent",
  ACK_STARTED: "Started",
  ACK_FINISHED: "Finished",
  ACK_DROPPED: "Dropped",
};

export const VERDICT_LABEL: Record<VerdictScore, string> = {
  1: "Time theft",
  2: "Not for me",
  3: "Decent, not lasting",
  4: "Hit hard",
  5: "Life-altering",
};

export function parseCategorySlug(value: string): CategorySlug | null {
  const normalized = value.trim().toLowerCase();
  return CATEGORY_SLUGS.find((slug) => slug === normalized) ?? null;
}

export function toCategory(value: CategorySlug): Category {
  return CATEGORY_BY_SLUG[value];
}

export function toCategorySlug(value: Category): CategorySlug {
  return SLUG_BY_CATEGORY[value];
}

export function getVerdictLabel(score: VerdictScore | null): string | null {
  if (!score) {
    return null;
  }
  return VERDICT_LABEL[score];
}

export function formatCreators(creators: string[]): string {
  if (creators.length === 0) {
    return "Unknown creator";
  }
  if (creators.length === 1) {
    return creators[0];
  }
  if (creators.length === 2) {
    return `${creators[0]} and ${creators[1]}`;
  }
  return `${creators[0]} +${creators.length - 1}`;
}

export function normalizeQuery(input: string): string {
  return input.trim().toLowerCase();
}

export const NOTE_ONE_LINER_MAX_LENGTH = 160;
