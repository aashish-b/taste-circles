"use client";

import { useEffect, useMemo, useState } from "react";

import { ListRow } from "@/components/media/list-row";
import { EmptyState, ErrorState, SkeletonRows } from "@/components/ui/states";
import {
  CATEGORY_BY_SLUG,
  CATEGORY_LABEL,
  type Category,
  type CategoryListEntry,
  type CategorySlug,
  type Item,
  type SearchResult,
  type UserItem,
  VERDICT_LABEL,
  type VerdictScore,
} from "@/lib/domain";
import {
  clearQueuedManualAdds,
  enqueueManualAdd,
  getQueuedManualAdds,
  type QueuedManualAdd,
} from "@/lib/offline-queue";

interface SearchApiResponse {
  dbResults: SearchResult[];
  providerResults: SearchResult[];
}

interface CategoryEntriesResponse {
  entries: CategoryListEntry[];
}

const categorySlugs = Object.keys(CATEGORY_BY_SLUG) as CategorySlug[];
const VERDICT_SCORES: VerdictScore[] = [1, 2, 3, 4, 5];

function parseVerdictScore(rawValue: string): VerdictScore | null {
  const parsed = Number.parseInt(rawValue, 10);
  if (!Number.isInteger(parsed)) {
    return null;
  }
  return VERDICT_SCORES.includes(parsed as VerdictScore) ? (parsed as VerdictScore) : null;
}

function buildManualFallback(query: string, category: Category): SearchResult {
  return {
    category,
    provider: "MANUAL",
    providerId: "manual-fallback",
    title: query,
    year: null,
    creators: [],
    posterUrl: null,
    thumbUrl: null,
    description: null,
    airingStatus: null,
    seasonCount: null,
    episodeCount: null,
    source: "DB",
  };
}

async function addOnServer(result: SearchResult, verdictScore: VerdictScore): Promise<void> {
  const response = await fetch("/api/items/add", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      category: result.category,
      provider: result.provider,
      providerId: result.providerId,
      title: result.title,
      year: result.year,
      creators: result.creators,
      posterUrl: result.posterUrl ?? null,
      thumbUrl: result.thumbUrl ?? null,
      description: result.description ?? null,
      airingStatus: result.airingStatus ?? null,
      seasonCount: result.seasonCount ?? null,
      episodeCount: result.episodeCount ?? null,
      verdictScore,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to add item (${response.status})`);
  }
}

async function fetchCategoryEntries(category: Category): Promise<CategoryListEntry[]> {
  const response = await fetch(`/api/lists/category?category=${category}`);
  if (!response.ok) {
    throw new Error("Failed to load category entries");
  }
  const payload = (await response.json()) as CategoryEntriesResponse;
  return payload.entries ?? [];
}

export function GlobalSearchPanel({
  currentUserId,
  initialCategorySlug = "movies",
  initialCategoryEntries,
}: {
  currentUserId: string;
  initialCategorySlug?: CategorySlug;
  initialCategoryEntries: CategoryListEntry[];
}): JSX.Element {
  const [query, setQuery] = useState("");
  const [categorySlug, setCategorySlug] = useState<CategorySlug>(initialCategorySlug);
  const [dbResults, setDbResults] = useState<SearchResult[]>([]);
  const [providerResults, setProviderResults] = useState<SearchResult[]>([]);
  const [isLoadingProviders, setIsLoadingProviders] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [offlineBanner, setOfflineBanner] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [canonicalRows, setCanonicalRows] = useState<CategoryListEntry[]>(initialCategoryEntries);
  const [pendingVerdicts, setPendingVerdicts] = useState<Record<string, VerdictScore | undefined>>(
    {},
  );

  const category = CATEGORY_BY_SLUG[categorySlug];

  useEffect(() => {
    if (typeof navigator === "undefined") {
      return;
    }

    const syncOnlineState = (): void => {
      setIsOnline(navigator.onLine);
      if (!navigator.onLine) {
        setOfflineBanner("Offline-saved locally, will sync.");
      }
    };

    syncOnlineState();
    window.addEventListener("online", syncOnlineState);
    window.addEventListener("offline", syncOnlineState);
    return () => {
      window.removeEventListener("online", syncOnlineState);
      window.removeEventListener("offline", syncOnlineState);
    };
  }, []);

  useEffect(() => {
    fetchCategoryEntries(category)
      .then((entries) => {
        setCanonicalRows(entries);
      })
      .catch(() => {
        setFetchError("Could not load your existing items for this category.");
      });
  }, [category]);

  useEffect(() => {
    const normalized = query.trim();
    if (!normalized) {
      setDbResults([]);
      setProviderResults([]);
      setFetchError(null);
      return;
    }

    let canceled = false;
    setIsLoadingProviders(true);
    setFetchError(null);

    fetch(`/api/search?q=${encodeURIComponent(normalized)}&category=${category}`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Provider search failed");
        }
        const payload = (await response.json()) as SearchApiResponse;
        if (!canceled) {
          setDbResults(payload.dbResults ?? []);
          setProviderResults(payload.providerResults ?? []);
        }
      })
      .catch(() => {
        if (!canceled) {
          setFetchError("Could not reach provider search. You can still add manually.");
          setDbResults([]);
          setProviderResults([]);
        }
      })
      .finally(() => {
        if (!canceled) {
          setIsLoadingProviders(false);
        }
      });

    return () => {
      canceled = true;
    };
  }, [query, category]);

  useEffect(() => {
    if (!isOnline) {
      return;
    }
    const queue = getQueuedManualAdds();
    if (queue.length === 0) {
      return;
    }

    (async () => {
      const pending: QueuedManualAdd[] = [];
      for (const entry of queue) {
        if (!entry.verdictScore || !VERDICT_SCORES.includes(entry.verdictScore)) {
          pending.push(entry);
          continue;
        }
        try {
          await addOnServer({
            category: entry.category,
            provider: entry.provider,
            providerId: entry.providerId,
            title: entry.title,
            year: entry.year,
            creators: entry.creators,
            posterUrl: null,
            thumbUrl: null,
            description: null,
            airingStatus: null,
            seasonCount: null,
            episodeCount: null,
            source: "DB",
          }, entry.verdictScore);
        } catch {
          pending.push(entry);
        }
      }

      if (pending.length === 0) {
        clearQueuedManualAdds();
        setOfflineBanner("Reconnected and synced offline additions.");
        setCanonicalRows(await fetchCategoryEntries(category));
      }
    })().catch(() => {
      setOfflineBanner("Could not flush offline queue yet.");
    });
  }, [isOnline, category]);

  const unifiedResults = useMemo(() => {
    const combined = [...dbResults];
    for (const entry of providerResults) {
      const duplicate = combined.find(
        (candidate) =>
          candidate.provider === entry.provider && candidate.providerId === entry.providerId,
      );
      if (!duplicate) {
        combined.push(entry);
      }
    }
    return combined;
  }, [dbResults, providerResults]);

  const existingRows = useMemo(
    () =>
      [...canonicalRows].sort(
        (left, right) =>
          new Date(right.userItem.updatedAt).getTime() - new Date(left.userItem.updatedAt).getTime(),
      ),
    [canonicalRows],
  );

  async function addResult(
    result: SearchResult,
    verdictScore: VerdictScore | undefined,
    verdictKey: string,
  ): Promise<void> {
    if (!verdictScore) {
      setFetchError("Pick a verdict before adding.");
      return;
    }

    if (!isOnline && result.provider === "MANUAL") {
      enqueueManualAdd({
        userId: currentUserId,
        category,
        provider: "MANUAL",
        providerId: `queued-${Date.now()}`,
        title: result.title,
        year: result.year,
        creators: result.creators,
        verdictScore,
        createdAt: new Date().toISOString(),
      });
      setOfflineBanner("Offline-saved locally, will sync.");
      setPendingVerdicts((current) => ({ ...current, [verdictKey]: undefined }));
      return;
    }

    try {
      await addOnServer(result, verdictScore);
      setOfflineBanner(`Added ${result.title}.`);
      setCanonicalRows(await fetchCategoryEntries(category));
      setPendingVerdicts((current) => ({ ...current, [verdictKey]: undefined }));
    } catch {
      if (result.provider === "MANUAL") {
        enqueueManualAdd({
          userId: currentUserId,
          category,
          provider: "MANUAL",
          providerId: `queued-${Date.now()}`,
          title: result.title,
          year: result.year,
          creators: result.creators,
          verdictScore,
          createdAt: new Date().toISOString(),
        });
        setOfflineBanner("Offline-saved locally, will sync.");
        setPendingVerdicts((current) => ({ ...current, [verdictKey]: undefined }));
      } else {
        setFetchError("Add failed for provider result. Try manual fallback.");
      }
    }
  }

  const manualFallback = query.trim() ? buildManualFallback(query.trim(), category) : null;
  const manualVerdictKey = manualFallback
    ? `${manualFallback.category}-${manualFallback.provider}-${manualFallback.title.toLowerCase()}`
    : null;
  const manualVerdictScore = manualVerdictKey ? pendingVerdicts[manualVerdictKey] : undefined;

  return (
    <section className="search-page stack">
      <header className="page-head">
        <div>
          <p className="eyebrow">Universal add</p>
          <h1>Search and add</h1>
        </div>
      </header>

      {offlineBanner ? <p className="offline-banner">{offlineBanner}</p> : null}

      <div className="search-layout">
        <div className="search-main stack">
          <div className="card stack">
            <label className="field">
              <span>Category</span>
              <select
                value={categorySlug}
                onChange={(event) => setCategorySlug(event.target.value as CategorySlug)}
              >
                {categorySlugs.map((slug) => (
                  <option key={slug} value={slug}>
                    {CATEGORY_LABEL[CATEGORY_BY_SLUG[slug]]}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Title, creator, URL, or provider ID</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search or paste a URL"
              />
            </label>
          </div>

          {fetchError ? <ErrorState title="Provider fetch failed" body={fetchError} /> : null}

          {isLoadingProviders ? <SkeletonRows rows={3} /> : null}

          <section className="card stack">
            <h2>Results</h2>
            {query.trim().length === 0 ? (
              <EmptyState
                title="Start with a search"
                body="DB matches appear immediately, provider matches follow."
              />
            ) : null}

            {query.trim().length > 0 && unifiedResults.length === 0 && !isLoadingProviders ? (
              <EmptyState
                title="No matches"
                body="Use manual add below to avoid blocking."
              />
            ) : null}

            <div className="search-result-list">
              {unifiedResults.map((result) => {
                const verdictKey = `${result.category}-${result.provider}-${result.providerId}`;
                const selectedVerdict = pendingVerdicts[verdictKey];
                const fauxItem: Item = {
                  id: `${result.provider}-${result.providerId}`,
                  category: result.category,
                  provider: result.provider,
                  providerId: result.providerId,
                  title: result.title,
                  year: result.year,
                  creators: result.creators,
                  posterUrl: result.posterUrl ?? null,
                  thumbUrl: result.thumbUrl,
                  description: result.description ?? null,
                  airingStatus: result.airingStatus ?? null,
                  seasonCount: result.seasonCount ?? null,
                  episodeCount: result.episodeCount ?? null,
                  tags: [],
                };

                const fauxUserItem: UserItem = {
                  userId: currentUserId,
                  itemId: fauxItem.id,
                  starred: false,
                  status: "NONE",
                  verdictScore: selectedVerdict ?? null,
                  impactAge: null,
                  noteOneLiner: null,
                  updatedAt: new Date().toISOString(),
                };

                return (
                  <div className="search-result-row" key={`${result.provider}-${result.providerId}`}>
                    <ListRow item={fauxItem} userItem={fauxUserItem} href="#" />
                    <div className="search-result-controls">
                      <label className="field-inline">
                        <span>Verdict</span>
                        <select
                          value={selectedVerdict ?? ""}
                          onChange={(event) => {
                            const next = parseVerdictScore(event.target.value);
                            setPendingVerdicts((current) => ({
                              ...current,
                              [verdictKey]: next ?? undefined,
                            }));
                          }}
                        >
                          <option value="">Rate to add</option>
                          {VERDICT_SCORES.map((score) => (
                            <option key={score} value={score}>
                              {score}
                              {" - "}
                              {VERDICT_LABEL[score]}
                            </option>
                          ))}
                        </select>
                      </label>
                      <button
                        className="button"
                        type="button"
                        disabled={!selectedVerdict}
                        onClick={() => void addResult(result, selectedVerdict, verdictKey)}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                );
              })}

              {manualFallback ? (
                <div className="search-result-row manual-row">
                  <div>
                    <p className="manual-title">Add manually: {manualFallback.title}</p>
                    <p className="muted">This always works, even if providers fail.</p>
                  </div>
                  <div className="search-result-controls">
                    <label className="field-inline">
                      <span>Verdict</span>
                      <select
                        value={manualVerdictScore ?? ""}
                        onChange={(event) => {
                          if (!manualVerdictKey) {
                            return;
                          }
                          const next = parseVerdictScore(event.target.value);
                          setPendingVerdicts((current) => ({
                            ...current,
                            [manualVerdictKey]: next ?? undefined,
                          }));
                        }}
                      >
                        <option value="">Rate to add</option>
                        {VERDICT_SCORES.map((score) => (
                          <option key={score} value={score}>
                            {score}
                            {" - "}
                            {VERDICT_LABEL[score]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      className="button button-secondary"
                      type="button"
                      disabled={!manualVerdictScore || !manualVerdictKey}
                      onClick={() => {
                        if (!manualVerdictKey) {
                          return;
                        }
                        void addResult(manualFallback, manualVerdictScore, manualVerdictKey);
                      }}
                    >
                      Add manual
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        </div>

        <aside className="card stack search-existing-panel">
          <header className="search-existing-header">
            <h2>Your existing items</h2>
            <p className="muted">
              {CATEGORY_LABEL[category]} - newest first
            </p>
          </header>
          {existingRows.length === 0 ? (
            <EmptyState title="No entries yet" body="Once added, they appear here immediately." />
          ) : (
            <div className="search-existing-scroll">
              {existingRows.map(({ item, userItem }) => (
                <ListRow key={item.id} item={item} userItem={userItem} href={`/item/${item.id}`} />
              ))}
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
