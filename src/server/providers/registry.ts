import { normalizeQuery, type Category, type Provider } from "@/lib/domain";
import { providerFixtures } from "@/server/providers/fixtures";
import type {
  NormalizedSearchResult,
  ParsedCandidate,
  ProviderAdapter,
} from "@/server/providers/types";

const providerByCategory: Record<Category, Provider> = {
  TV: "TMDB",
  MOVIE: "TMDB",
  MUSIC: "MUSICBRAINZ",
  ANIME: "ANILIST",
  BOOK: "OPEN_LIBRARY",
  GAME: "RAWG",
};

const REMOTE_ENABLED = process.env.NODE_ENV !== "test" && process.env.NO_REMOTE_SEARCH !== "1";
const REMOTE_CACHE_TTL_MS = 15 * 60 * 1000;
const REMOTE_CACHE_MAX = 500;
const RESULT_LIMIT = 12;
const MIN_TOKEN_LENGTH = 3;
const LOW_SIGNAL_TOKENS = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "into",
  "onto",
  "over",
  "under",
  "this",
  "that",
  "there",
  "will",
  "have",
  "has",
  "had",
  "was",
  "were",
  "are",
  "you",
  "your",
  "their",
  "our",
  "its",
  "not",
  "but",
  "can",
  "all",
  "any",
  "who",
  "what",
  "when",
  "where",
  "why",
  "how",
]);

interface SearchCacheEntry {
  expiresAt: number;
  results: NormalizedSearchResult[];
}

interface DetailCacheEntry {
  expiresAt: number;
  result: NormalizedSearchResult | null;
}

const remoteSearchCache = new Map<string, SearchCacheEntry>();
const remoteDetailCache = new Map<string, DetailCacheEntry>();

function normalizeForMatch(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripHtml(input: string | null | undefined): string | null {
  if (!input) {
    return null;
  }
  const cleaned = input
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.length > 0 ? cleaned : null;
}

function tokenize(value: string): string[] {
  return normalizeForMatch(value)
    .split(" ")
    .filter((token) => token.length >= MIN_TOKEN_LENGTH)
    .filter((token) => !LOW_SIGNAL_TOKENS.has(token));
}

function scoreMatch(entry: NormalizedSearchResult, query: string): number {
  const normalizedQuery = normalizeForMatch(query);
  if (!normalizedQuery) {
    return 0;
  }

  const title = normalizeForMatch(entry.title);
  const creatorBlob = normalizeForMatch(entry.creators.join(" "));
  const blob = `${title} ${creatorBlob} ${normalizeForMatch(entry.providerId)}`.trim();

  let score = 0;

  if (title === normalizedQuery) {
    score += 120;
  }
  if (title.startsWith(normalizedQuery)) {
    score += 90;
  }
  if (title.includes(normalizedQuery)) {
    score += 75;
  }
  if (blob.includes(normalizedQuery)) {
    score += 45;
  }

  const queryTokens = tokenize(normalizedQuery);
  if (queryTokens.length > 0) {
    const matchedTokenCount = queryTokens.filter((token) => blob.includes(token)).length;
    if (matchedTokenCount === queryTokens.length) {
      score += 40 + matchedTokenCount * 8;
    } else if (matchedTokenCount > 0) {
      score += matchedTokenCount * 5;
    }
  }

  return score;
}

function yearFromDate(input: string | null | undefined): number | null {
  if (!input) {
    return null;
  }
  const match = input.match(/^(\d{4})/);
  return match ? Number(match[1]) : null;
}

function extractMovieCreator(text: string | null | undefined): string | null {
  if (!text) {
    return null;
  }

  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return null;
  }

  const patterns = [/directed by ([^,.;]+)/i, /(?:film|movie)\s+by\s+([^,.;]+)/i];
  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (!match?.[1]) {
      continue;
    }
    const cleaned = match[1].trim().replace(/\s+\(.+\)$/, "");
    if (cleaned.length > 0) {
      return cleaned;
    }
  }

  return null;
}

function toAiringStatus(status: string | null | undefined): "ONGOING" | "FINISHED" | null {
  const normalized = normalizeForMatch(status ?? "");
  if (!normalized) {
    return null;
  }
  if (normalized.includes("running") || normalized.includes("in development")) {
    return "ONGOING";
  }
  if (normalized.includes("ended") || normalized.includes("canceled")) {
    return "FINISHED";
  }
  return null;
}

async function fetchJson<T>(url: string, timeoutMs = 4500): Promise<T | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "taste-circles/0.1 (server-search)",
      },
      signal: controller.signal,
      cache: "no-store",
    });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function setSearchCache(category: Category, query: string, results: NormalizedSearchResult[]): void {
  const key = `${category}:${normalizeForMatch(query)}`;
  if (remoteSearchCache.size >= REMOTE_CACHE_MAX) {
    const firstKey = remoteSearchCache.keys().next().value;
    if (firstKey) {
      remoteSearchCache.delete(firstKey);
    }
  }
  remoteSearchCache.set(key, {
    expiresAt: Date.now() + REMOTE_CACHE_TTL_MS,
    results,
  });
}

function getSearchCache(category: Category, query: string): NormalizedSearchResult[] | null {
  const key = `${category}:${normalizeForMatch(query)}`;
  const hit = remoteSearchCache.get(key);
  if (!hit) {
    return null;
  }
  if (hit.expiresAt <= Date.now()) {
    remoteSearchCache.delete(key);
    return null;
  }
  return hit.results;
}

function setDetailCache(
  category: Category,
  providerId: string,
  hintTitle: string,
  result: NormalizedSearchResult | null,
): void {
  const key = `${category}:${providerId}:${normalizeForMatch(hintTitle)}`;
  if (remoteDetailCache.size >= REMOTE_CACHE_MAX) {
    const firstKey = remoteDetailCache.keys().next().value;
    if (firstKey) {
      remoteDetailCache.delete(firstKey);
    }
  }
  remoteDetailCache.set(key, {
    expiresAt: Date.now() + REMOTE_CACHE_TTL_MS,
    result,
  });
}

function getDetailCache(
  category: Category,
  providerId: string,
  hintTitle: string,
): NormalizedSearchResult | null | undefined {
  const key = `${category}:${providerId}:${normalizeForMatch(hintTitle)}`;
  const hit = remoteDetailCache.get(key);
  if (!hit) {
    return undefined;
  }
  if (hit.expiresAt <= Date.now()) {
    remoteDetailCache.delete(key);
    return undefined;
  }
  return hit.result;
}

function buildLocalResults(category: Category, query: string): NormalizedSearchResult[] {
  return providerFixtures
    .filter((item) => item.category === category)
    .filter((entry) => entry.provider === providerByCategory[category])
    .map((entry) => ({
      entry,
      score: scoreMatch(entry, query),
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      return left.entry.title.localeCompare(right.entry.title);
    })
    .map((entry) => entry.entry);
}

function sortByRelevance(
  results: NormalizedSearchResult[],
  query: string,
): NormalizedSearchResult[] {
  return [...results]
    .sort((left, right) => {
      const scoreDiff = scoreMatch(right, query) - scoreMatch(left, query);
      if (scoreDiff !== 0) {
        return scoreDiff;
      }

      const rightYear = right.year ?? -Infinity;
      const leftYear = left.year ?? -Infinity;
      if (rightYear !== leftYear) {
        return rightYear - leftYear;
      }

      return left.title.localeCompare(right.title);
    })
    .slice(0, RESULT_LIMIT);
}

function mergeResults(
  primary: NormalizedSearchResult[],
  secondary: NormalizedSearchResult[],
): NormalizedSearchResult[] {
  const seen = new Set<string>();
  const out: NormalizedSearchResult[] = [];

  const pushUnique = (entry: NormalizedSearchResult): void => {
    const key = `${entry.provider}:${entry.providerId}`;
    const titleKey = normalizeForMatch(entry.title);
    if (seen.has(key) || seen.has(`title:${titleKey}`)) {
      return;
    }
    seen.add(key);
    seen.add(`title:${titleKey}`);
    out.push(entry);
  };

  primary.forEach(pushUnique);
  secondary.forEach(pushUnique);

  return out.slice(0, RESULT_LIMIT);
}

function mapTvMazeResults(payload: Array<{
  show?: {
    id?: number;
    name?: string;
    premiered?: string | null;
    summary?: string | null;
    status?: string | null;
    network?: { name?: string | null } | null;
    webChannel?: { name?: string | null } | null;
    image?: { medium?: string | null; original?: string | null } | null;
  };
}>): NormalizedSearchResult[] {
  return payload
    .map((entry) => entry.show)
    .filter((show): show is NonNullable<typeof show> => Boolean(show?.id && show?.name))
    .map((show) => ({
      category: "TV" as const,
      provider: "TMDB" as const,
      providerId: `tvmaze-${show.id}`,
      title: show.name ?? "Unknown",
      year: yearFromDate(show.premiered),
      creators: [show.network?.name, show.webChannel?.name].filter(
        (value): value is string => Boolean(value),
      ),
      posterUrl: show.image?.original ?? show.image?.medium ?? null,
      thumbUrl: show.image?.medium ?? show.image?.original ?? null,
      description: stripHtml(show.summary),
      airingStatus: toAiringStatus(show.status),
      seasonCount: null,
      episodeCount: null,
    }));
}

function mapItunesMovieResults(payload: {
  results?: Array<{
    trackId?: number;
    trackName?: string;
    releaseDate?: string;
    artistName?: string;
    artworkUrl100?: string;
    longDescription?: string;
    shortDescription?: string;
  }>;
}): NormalizedSearchResult[] {
  return (payload.results ?? [])
    .filter((entry) => Boolean(entry.trackId && entry.trackName))
    .map((entry) => {
      const description = entry.longDescription ?? entry.shortDescription ?? null;
      const inferredCreator = extractMovieCreator(description);
      return {
        category: "MOVIE" as const,
        provider: "TMDB" as const,
        providerId: `itunes-movie-${entry.trackId}`,
        title: entry.trackName ?? "Unknown",
        year: yearFromDate(entry.releaseDate),
        creators: entry.artistName ? [entry.artistName] : inferredCreator ? [inferredCreator] : [],
        posterUrl: entry.artworkUrl100 ?? null,
        thumbUrl: entry.artworkUrl100 ?? null,
        description,
        airingStatus: null,
        seasonCount: null,
        episodeCount: null,
      };
    });
}

function mapWikidataMovieResults(payload: {
  search?: Array<{
    id?: string;
    label?: string;
    description?: string;
  }>;
}): NormalizedSearchResult[] {
  return (payload.search ?? [])
    .filter((entry) => Boolean(entry.id && entry.label))
    .filter((entry) => {
      const description = normalizeForMatch(entry.description ?? "");
      return description.includes("film") || description.includes("movie");
    })
    .map((entry) => {
      const description = entry.description ?? "";
      const yearMatch = description.match(/\b(18|19|20)\d{2}\b/);
      const creator = extractMovieCreator(description);

      return {
        category: "MOVIE" as const,
        provider: "TMDB" as const,
        providerId: `wikidata-movie-${entry.id}`,
        title: entry.label ?? "Unknown",
        year: yearMatch ? Number(yearMatch[0]) : null,
        creators: creator ? [creator] : [],
        posterUrl: null,
        thumbUrl: null,
        description: entry.description ?? null,
        airingStatus: null,
        seasonCount: null,
        episodeCount: null,
      };
    });
}

function mapItunesMusicResults(payload: {
  results?: Array<{
    collectionId?: number;
    collectionName?: string;
    releaseDate?: string;
    artistName?: string;
    artworkUrl100?: string;
  }>;
}): NormalizedSearchResult[] {
  return (payload.results ?? [])
    .filter((entry) => Boolean(entry.collectionId && entry.collectionName))
    .map((entry) => ({
      category: "MUSIC" as const,
      provider: "MUSICBRAINZ" as const,
      providerId: `itunes-music-${entry.collectionId}`,
      title: entry.collectionName ?? "Unknown",
      year: yearFromDate(entry.releaseDate),
      creators: entry.artistName ? [entry.artistName] : [],
      posterUrl: entry.artworkUrl100 ?? null,
      thumbUrl: entry.artworkUrl100 ?? null,
      description: null,
      airingStatus: null,
      seasonCount: null,
      episodeCount: null,
    }));
}

function mapOpenLibraryResults(payload: {
  docs?: Array<{
    key?: string;
    title?: string;
    first_publish_year?: number;
    author_name?: string[];
    cover_i?: number;
  }>;
}): NormalizedSearchResult[] {
  return (payload.docs ?? [])
    .filter((entry) => Boolean(entry.key && entry.title))
    .map((entry) => ({
      category: "BOOK" as const,
      provider: "OPEN_LIBRARY" as const,
      providerId: (entry.key ?? "").replace("/works/", ""),
      title: entry.title ?? "Unknown",
      year: entry.first_publish_year ?? null,
      creators: (entry.author_name ?? []).slice(0, 3),
      posterUrl: entry.cover_i ? `https://covers.openlibrary.org/b/id/${entry.cover_i}-L.jpg` : null,
      thumbUrl: entry.cover_i ? `https://covers.openlibrary.org/b/id/${entry.cover_i}-S.jpg` : null,
      description: null,
      airingStatus: null,
      seasonCount: null,
      episodeCount: null,
    }));
}

function mapJikanResults(payload: {
  data?: Array<{
    mal_id?: number;
    title?: string;
    title_english?: string | null;
    year?: number | null;
    synopsis?: string | null;
    aired?: { from?: string | null };
    status?: string | null;
    episodes?: number | null;
    studios?: Array<{ name?: string }>;
    images?: { jpg?: { image_url?: string | null; large_image_url?: string | null } };
  }>;
}): NormalizedSearchResult[] {
  return (payload.data ?? [])
    .filter((entry) => Boolean(entry.mal_id && (entry.title || entry.title_english)))
    .map((entry) => ({
      category: "ANIME" as const,
      provider: "ANILIST" as const,
      providerId: `mal-${entry.mal_id}`,
      title: entry.title_english ?? entry.title ?? "Unknown",
      year: entry.year ?? yearFromDate(entry.aired?.from),
      creators: (entry.studios ?? [])
        .map((studio) => studio.name)
        .filter((name): name is string => Boolean(name))
        .slice(0, 3),
      posterUrl: entry.images?.jpg?.large_image_url ?? entry.images?.jpg?.image_url ?? null,
      thumbUrl: entry.images?.jpg?.image_url ?? null,
      description: entry.synopsis ?? null,
      airingStatus: toAiringStatus(entry.status),
      seasonCount: null,
      episodeCount: entry.episodes ?? null,
    }));
}

function mapSteamResults(payload: {
  items?: Array<{
    id?: number;
    name?: string;
    tiny_image?: string;
  }>;
}): NormalizedSearchResult[] {
  return (payload.items ?? [])
    .filter((entry) => Boolean(entry.id && entry.name))
    .map((entry) => ({
      category: "GAME" as const,
      provider: "RAWG" as const,
      providerId: `steam-${entry.id}`,
      title: entry.name ?? "Unknown",
      year: null,
      creators: [],
      posterUrl: entry.tiny_image ?? null,
      thumbUrl: entry.tiny_image ?? null,
      description: null,
      airingStatus: null,
      seasonCount: null,
      episodeCount: null,
    }));
}

function parseTvMazeId(providerId: string): string | null {
  if (providerId.startsWith("tvmaze-")) {
    return providerId.slice("tvmaze-".length);
  }
  if (/^\d+$/.test(providerId)) {
    return providerId;
  }
  return null;
}

async function fetchTvMazeShowById(id: string): Promise<NormalizedSearchResult | null> {
  const payload = await fetchJson<{
    id?: number;
    name?: string;
    premiered?: string | null;
    summary?: string | null;
    status?: string | null;
    network?: { name?: string | null } | null;
    webChannel?: { name?: string | null } | null;
    image?: { medium?: string | null; original?: string | null } | null;
    _embedded?: { episodes?: Array<{ season?: number }> };
  }>(`https://api.tvmaze.com/shows/${id}?embed[]=episodes`);

  if (!payload?.id || !payload.name) {
    return null;
  }

  const episodes = payload._embedded?.episodes ?? [];
  const seasonSet = new Set<number>();
  for (const episode of episodes) {
    if (typeof episode.season === "number") {
      seasonSet.add(episode.season);
    }
  }

  return {
    category: "TV",
    provider: "TMDB",
    providerId: `tvmaze-${payload.id}`,
    title: payload.name,
    year: yearFromDate(payload.premiered),
    creators: [payload.network?.name, payload.webChannel?.name].filter(
      (value): value is string => Boolean(value),
    ),
    posterUrl: payload.image?.original ?? payload.image?.medium ?? null,
    thumbUrl: payload.image?.medium ?? payload.image?.original ?? null,
    description: stripHtml(payload.summary),
    airingStatus: toAiringStatus(payload.status),
    seasonCount: seasonSet.size > 0 ? seasonSet.size : null,
    episodeCount: episodes.length > 0 ? episodes.length : null,
  };
}

async function fetchTvMazeDetail(
  providerId: string,
  hintTitle?: string,
): Promise<NormalizedSearchResult | null> {
  const directId = parseTvMazeId(providerId);
  if (directId) {
    const byId = await fetchTvMazeShowById(directId);
    if (byId) {
      return byId;
    }
  }

  if (!hintTitle) {
    return null;
  }

  const payload = await fetchJson<Array<{ show?: { id?: number; name?: string } }>>(
    `https://api.tvmaze.com/search/shows?q=${encodeURIComponent(hintTitle)}`,
  );

  if (!payload || payload.length === 0) {
    return null;
  }

  const normalizedHint = normalizeForMatch(hintTitle);
  const best = payload
    .map((entry) => entry.show)
    .filter((show): show is { id: number; name?: string } => Boolean(show?.id))
    .sort((left, right) => {
      const leftExact = normalizeForMatch(left.name ?? "") === normalizedHint ? 1 : 0;
      const rightExact = normalizeForMatch(right.name ?? "") === normalizedHint ? 1 : 0;
      return rightExact - leftExact;
    })[0];

  if (!best) {
    return null;
  }

  return fetchTvMazeShowById(String(best.id));
}

async function searchRemote(category: Category, query: string): Promise<NormalizedSearchResult[]> {
  const cached = getSearchCache(category, query);
  if (cached) {
    return cached;
  }

  let remoteResults: NormalizedSearchResult[] = [];
  const encoded = encodeURIComponent(query.trim());

  if (category === "TV") {
    const payload = await fetchJson<Array<{ show?: unknown }>>(
      `https://api.tvmaze.com/search/shows?q=${encoded}`,
    );
    if (payload) {
      remoteResults = mapTvMazeResults(
        payload as Array<{
          show?: {
            id?: number;
            name?: string;
            premiered?: string | null;
            summary?: string | null;
            status?: string | null;
            network?: { name?: string | null } | null;
            webChannel?: { name?: string | null } | null;
            image?: { medium?: string | null; original?: string | null } | null;
          };
        }>,
      );
    }
  } else if (category === "MOVIE") {
    const [itunesPayload, wikidataPayload] = await Promise.all([
      fetchJson<{ results?: unknown[] }>(
        `https://itunes.apple.com/search?term=${encoded}&media=movie&entity=movie&limit=25`,
      ),
      fetchJson<{ search?: unknown[] }>(
        `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encoded}&language=en&format=json&type=item&limit=20`,
      ),
    ]);

    const itunesResults = itunesPayload
      ? mapItunesMovieResults(
          itunesPayload as {
            results?: Array<{
              trackId?: number;
              trackName?: string;
              releaseDate?: string;
              artistName?: string;
              artworkUrl100?: string;
              longDescription?: string;
              shortDescription?: string;
            }>;
          },
        )
      : [];

    const wikidataResults = wikidataPayload
      ? mapWikidataMovieResults(
          wikidataPayload as {
            search?: Array<{
              id?: string;
              label?: string;
              description?: string;
            }>;
          },
        )
      : [];

    remoteResults = mergeResults(itunesResults, wikidataResults);
  } else if (category === "MUSIC") {
    const payload = await fetchJson<{ results?: unknown[] }>(
      `https://itunes.apple.com/search?term=${encoded}&media=music&entity=album&limit=25`,
    );
    if (payload) {
      remoteResults = mapItunesMusicResults(
        payload as {
          results?: Array<{
            collectionId?: number;
            collectionName?: string;
            releaseDate?: string;
            artistName?: string;
            artworkUrl100?: string;
          }>;
        },
      );
    }
  } else if (category === "BOOK") {
    const payload = await fetchJson<{ docs?: unknown[] }>(
      `https://openlibrary.org/search.json?q=${encoded}&limit=25`,
    );
    if (payload) {
      remoteResults = mapOpenLibraryResults(
        payload as {
          docs?: Array<{
            key?: string;
            title?: string;
            first_publish_year?: number;
            author_name?: string[];
            cover_i?: number;
          }>;
        },
      );
    }
  } else if (category === "ANIME") {
    const payload = await fetchJson<{ data?: unknown[] }>(
      `https://api.jikan.moe/v4/anime?q=${encoded}&limit=25`,
    );
    if (payload) {
      remoteResults = mapJikanResults(
        payload as {
          data?: Array<{
            mal_id?: number;
            title?: string;
            title_english?: string | null;
            year?: number | null;
            synopsis?: string | null;
            aired?: { from?: string | null };
            status?: string | null;
            episodes?: number | null;
            studios?: Array<{ name?: string }>;
            images?: { jpg?: { image_url?: string | null; large_image_url?: string | null } };
          }>;
        },
      );
    }
  } else if (category === "GAME") {
    const payload = await fetchJson<{ items?: unknown[] }>(
      `https://store.steampowered.com/api/storesearch/?term=${encoded}&l=english&cc=us`,
    );
    if (payload) {
      remoteResults = mapSteamResults(
        payload as {
          items?: Array<{
            id?: number;
            name?: string;
            tiny_image?: string;
          }>;
        },
      );
    }
  }

  setSearchCache(category, query, remoteResults);
  return remoteResults;
}

function getProviderUrlHints(): Array<{
  pattern: RegExp;
  category: Category;
  provider: Provider;
}> {
  return [
    {
      pattern: /themoviedb\.org\/(movie|tv)\/(\d+)/i,
      category: "MOVIE",
      provider: "TMDB",
    },
    {
      pattern: /openlibrary\.org\/(works|books)\/([^/?#]+)/i,
      category: "BOOK",
      provider: "OPEN_LIBRARY",
    },
    {
      pattern: /musicbrainz\.org\/release\/([^/?#]+)/i,
      category: "MUSIC",
      provider: "MUSICBRAINZ",
    },
    {
      pattern: /anilist\.co\/anime\/(\d+)/i,
      category: "ANIME",
      provider: "ANILIST",
    },
    {
      pattern: /rawg\.io\/games\/([^/?#]+)/i,
      category: "GAME",
      provider: "RAWG",
    },
  ];
}

function parseWithHints(input: string): ParsedCandidate[] {
  return getProviderUrlHints()
    .map((hint) => {
      const match = input.match(hint.pattern);
      if (!match) {
        return null;
      }
      const providerId = match[2] ?? match[1];
      return {
        category: hint.category,
        provider: hint.provider,
        providerId,
      } as ParsedCandidate;
    })
    .filter((candidate): candidate is ParsedCandidate => Boolean(candidate));
}

function createAdapter(category: Category): ProviderAdapter {
  const provider = providerByCategory[category];
  return {
    category,
    provider,
    search: async (query: string) => {
      const normalized = normalizeQuery(query);
      if (!normalized) {
        return [];
      }

      const localResults = buildLocalResults(category, normalized);
      if (!REMOTE_ENABLED) {
        return localResults.slice(0, RESULT_LIMIT);
      }

      const remoteResults = await searchRemote(category, normalized);
      return sortByRelevance(mergeResults(remoteResults, localResults), normalized);
    },
    getById: async (providerId: string, hintTitle?: string) => {
      const localHit = providerFixtures.find(
        (entry) =>
          entry.category === category &&
          entry.provider === provider &&
          entry.providerId === providerId,
      );

      if (!REMOTE_ENABLED) {
        return localHit ?? null;
      }

      if (category !== "TV") {
        return localHit ?? null;
      }

      const hint = hintTitle ?? "";
      const cacheHit = getDetailCache(category, providerId, hint);
      if (cacheHit !== undefined) {
        return cacheHit ?? localHit ?? null;
      }

      const detailed = await fetchTvMazeDetail(providerId, hintTitle);
      setDetailCache(category, providerId, hint, detailed);
      return detailed ?? localHit ?? null;
    },
    parseInput: (queryOrUrl: string) => parseWithHints(queryOrUrl),
  };
}

const adapters: ProviderAdapter[] = [
  createAdapter("TV"),
  createAdapter("MOVIE"),
  createAdapter("MUSIC"),
  createAdapter("ANIME"),
  createAdapter("BOOK"),
  createAdapter("GAME"),
];

export function getAdapter(category: Category): ProviderAdapter {
  return adapters.find((adapter) => adapter.category === category) ?? createAdapter(category);
}

export async function searchProviders(
  category: Category,
  query: string,
): Promise<NormalizedSearchResult[]> {
  const adapter = getAdapter(category);
  return adapter.search(query);
}

export async function getProviderDetails(
  category: Category,
  providerId: string,
  hintTitle?: string,
): Promise<NormalizedSearchResult | null> {
  const adapter = getAdapter(category);
  return adapter.getById(providerId, hintTitle);
}

export function parseProviderInput(queryOrUrl: string): ParsedCandidate[] {
  return adapters.flatMap((adapter) => adapter.parseInput?.(queryOrUrl) ?? []);
}
