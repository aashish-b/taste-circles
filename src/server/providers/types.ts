import type { Category, Provider } from "@/lib/domain";

export interface NormalizedSearchResult {
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
}

export interface ParsedCandidate {
  category: Category;
  provider: Provider;
  providerId: string;
}

export interface ProviderAdapter {
  category: Category;
  provider: Provider;
  search: (query: string) => Promise<NormalizedSearchResult[]>;
  getById: (
    providerId: string,
    hintTitle?: string,
  ) => Promise<NormalizedSearchResult | null>;
  parseInput?: (queryOrUrl: string) => ParsedCandidate[];
}
