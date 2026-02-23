"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

import { ListRow } from "@/components/media/list-row";
import { VerdictScale } from "@/components/ui/verdict-scale";
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

interface AddApiResponse {
  item: Item;
  userItem: UserItem;
}

const categorySlugs = Object.keys(CATEGORY_BY_SLUG) as CategorySlug[];
const VERDICT_SCORES: VerdictScore[] = [1, 2, 3, 4, 5];

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

function isManualFallbackResult(result: SearchResult): boolean {
  return result.provider === "MANUAL" && result.providerId === "manual-fallback";
}

async function addOnServer(
  result: SearchResult,
  verdictScore: VerdictScore,
): Promise<AddApiResponse> {
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

  return (await response.json()) as AddApiResponse;
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
  const [activeResultIndex, setActiveResultIndex] = useState(-1);
  const [lastAdded, setLastAdded] = useState<{ itemId: string; title: string } | null>(null);
  const [recentlyAddedKey, setRecentlyAddedKey] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

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
    const onWindowKeyDown = (event: globalThis.KeyboardEvent): void => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      const target = event.target as HTMLElement | null;
      const isTypingElement =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        target?.isContentEditable;
      if (isTypingElement) {
        return;
      }

      event.preventDefault();
      searchInputRef.current?.focus();
    };

    window.addEventListener("keydown", onWindowKeyDown);
    return () => {
      window.removeEventListener("keydown", onWindowKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!recentlyAddedKey) {
      return;
    }

    const timer = window.setTimeout(() => {
      setRecentlyAddedKey(null);
    }, 420);

    return () => {
      window.clearTimeout(timer);
    };
  }, [recentlyAddedKey]);

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

  const trimmedQuery = query.trim();
  const manualFallback = trimmedQuery ? buildManualFallback(trimmedQuery, category) : null;
  const manualVerdictKey = manualFallback
    ? `${manualFallback.category}-${manualFallback.provider}-${manualFallback.title.toLowerCase()}`
    : null;
  const manualVerdictScore = manualVerdictKey ? pendingVerdicts[manualVerdictKey] : undefined;
  const actionableResults = useMemo(
    () => (manualFallback ? [...unifiedResults, manualFallback] : [...unifiedResults]),
    [manualFallback, unifiedResults],
  );

  useEffect(() => {
    if (trimmedQuery.length === 0 || actionableResults.length === 0) {
      setActiveResultIndex(-1);
      return;
    }
    setActiveResultIndex(0);
  }, [actionableResults.length, categorySlug, trimmedQuery]);

  function getVerdictKey(result: SearchResult): string {
    if (isManualFallbackResult(result) && manualVerdictKey) {
      return manualVerdictKey;
    }
    return `${result.category}-${result.provider}-${result.providerId}`;
  }

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
      setLastAdded(null);
      setPendingVerdicts((current) => ({ ...current, [verdictKey]: undefined }));
      searchInputRef.current?.focus();
      return;
    }

    try {
      const added = await addOnServer(result, verdictScore);
      setOfflineBanner(`Added ${result.title}.`);
      setLastAdded({ itemId: added.item.id, title: added.item.title });
      setRecentlyAddedKey(verdictKey);
      setFetchError(null);
      setCanonicalRows(await fetchCategoryEntries(category));
      setPendingVerdicts((current) => ({ ...current, [verdictKey]: undefined }));
      searchInputRef.current?.focus();
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
        setLastAdded(null);
        setPendingVerdicts((current) => ({ ...current, [verdictKey]: undefined }));
      } else {
        setFetchError("Add failed for provider result. Try manual fallback.");
      }
    }
  }

  function handleSearchInputKeyDown(event: ReactKeyboardEvent<HTMLInputElement>): void {
    if (actionableResults.length === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveResultIndex((current) => (current + 1) % actionableResults.length);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveResultIndex((current) =>
        current <= 0 ? actionableResults.length - 1 : current - 1,
      );
      return;
    }
    if (event.key === "Enter" && activeResultIndex >= 0) {
      event.preventDefault();
      const activeResult = actionableResults[activeResultIndex];
      if (!activeResult) {
        return;
      }
      const verdictKey = getVerdictKey(activeResult);
      const verdictScore = pendingVerdicts[verdictKey];
      void addResult(activeResult, verdictScore, verdictKey);
    }
  }

  return (
    <section className={`search-page stack search-context-${categorySlug}`}>
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
            <div className="field">
              <span>Category</span>
              <div className="filters-row search-category-terms">
                {categorySlugs.map((slug) => (
                  <button
                    key={slug}
                    className={categorySlug === slug ? "segmented active" : "segmented"}
                    type="button"
                    onClick={() => setCategorySlug(slug)}
                  >
                    {CATEGORY_LABEL[CATEGORY_BY_SLUG[slug]]}
                  </button>
                ))}
              </div>
            </div>

            <label className="field">
              <span>Title, creator, URL, or provider ID</span>
              <input
                ref={searchInputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={handleSearchInputKeyDown}
                placeholder="Search or paste a URL"
              />
            </label>
            <p className="muted search-shortcut">Tip: press / to focus, arrows to move, Enter to add.</p>
          </div>

          {fetchError ? <ErrorState title="Provider fetch failed" body={fetchError} /> : null}

          {isLoadingProviders ? <SkeletonRows rows={3} /> : null}

          <section className="card stack">
            <h2>Results</h2>
            {lastAdded ? (
              <p className="inline-success">
                Added {lastAdded.title}.{" "}
                <a href={`/item/${lastAdded.itemId}`}>
                  Open item
                </a>
              </p>
            ) : null}

            {trimmedQuery.length === 0 ? (
              <EmptyState
                title="Start with a search"
                body="DB matches appear immediately, provider matches follow."
              />
            ) : null}

            {trimmedQuery.length > 0 && unifiedResults.length === 0 && !isLoadingProviders ? (
              <EmptyState
                title="No matches"
                body="Use manual add below to avoid blocking."
              />
            ) : null}

            <div className="search-result-list">
              {unifiedResults.map((result, index) => {
                const verdictKey = getVerdictKey(result);
                const selectedVerdict = pendingVerdicts[verdictKey];
                const rowClasses = [
                  "search-result-row",
                  activeResultIndex === index ? "search-result-row-active" : "",
                  recentlyAddedKey === verdictKey ? "search-result-row-added" : "",
                ]
                  .filter(Boolean)
                  .join(" ");
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
                  <div
                    className={rowClasses}
                    key={`${result.provider}-${result.providerId}`}
                    onMouseEnter={() => setActiveResultIndex(index)}
                  >
                    <ListRow item={fauxItem} userItem={fauxUserItem} href="#" />
                    <div className="search-result-controls">
                      <div className="verdict-selector-row">
                        <span className="muted">Verdict</span>
                        <VerdictScale
                          selected={selectedVerdict}
                          onSelect={(score) => {
                            setPendingVerdicts((current) => ({
                              ...current,
                              [verdictKey]: score,
                            }));
                          }}
                        />
                      </div>
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
                <div
                  className={[
                    "search-result-row manual-row",
                    activeResultIndex === unifiedResults.length ? "search-result-row-active" : "",
                    manualVerdictKey && recentlyAddedKey === manualVerdictKey
                      ? "search-result-row-added"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onMouseEnter={() => setActiveResultIndex(unifiedResults.length)}
                >
                  <div>
                    <p className="manual-title">Add manually: {manualFallback.title}</p>
                    <p className="muted">This always works, even if providers fail.</p>
                  </div>
                  <div className="search-result-controls">
                    <div className="verdict-selector-row">
                      <span className="muted">Verdict</span>
                      <VerdictScale
                        selected={manualVerdictScore}
                        onSelect={(score) => {
                          if (!manualVerdictKey) {
                            return;
                          }
                          setPendingVerdicts((current) => ({
                            ...current,
                            [manualVerdictKey]: score,
                          }));
                        }}
                      />
                    </div>
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
