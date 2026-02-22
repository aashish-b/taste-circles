"use client";

import { useMemo, useState } from "react";

import { ListRow } from "@/components/media/list-row";
import { EmptyState, SkeletonRows } from "@/components/ui/states";
import {
  CATEGORY_LABEL,
  STATUS_LABEL,
  type Category,
  type CategoryListEntry,
  type UserItemStatus,
} from "@/lib/domain";

const FILTERS: Array<"ALL" | "STARRED" | UserItemStatus> = [
  "ALL",
  "STARRED",
  "FINISHED",
  "STARTED",
  "DROPPED",
];

type SortMode = "UPDATED" | "TITLE";

function filterLabel(value: "ALL" | "STARRED" | UserItemStatus): string {
  if (value === "ALL") {
    return "All";
  }
  if (value === "STARRED") {
    return "Starred";
  }
  return STATUS_LABEL[value];
}

export function CategoryListView({
  displayName,
  category,
  entries,
}: {
  displayName: string;
  category: Category;
  entries: CategoryListEntry[];
}): JSX.Element {
  const [activeFilter, setActiveFilter] = useState<"ALL" | "STARRED" | UserItemStatus>("ALL");
  const [sortMode, setSortMode] = useState<SortMode>("UPDATED");

  const filtered = useMemo(() => {
    const next = entries.filter((entry) => {
      if (activeFilter === "ALL") {
        return true;
      }
      if (activeFilter === "STARRED") {
        return entry.userItem.starred;
      }
      return entry.userItem.status === activeFilter;
    });

    if (sortMode === "TITLE") {
      return [...next].sort((left, right) => left.item.title.localeCompare(right.item.title));
    }

    return [...next].sort((left, right) =>
      right.userItem.updatedAt.localeCompare(left.userItem.updatedAt),
    );
  }, [activeFilter, entries, sortMode]);

  return (
    <section className="category-list">
      <header className="page-head">
        <div>
          <p className="eyebrow">{displayName}</p>
          <h1>{CATEGORY_LABEL[category]}</h1>
        </div>
        <a className="button" href="/search">
          Add item
        </a>
      </header>

      <div className="filters-row" role="toolbar" aria-label="List filters">
        {FILTERS.map((filter) => (
          <button
            key={filter}
            className={filter === activeFilter ? "segmented active" : "segmented"}
            type="button"
            onClick={() => setActiveFilter(filter)}
          >
            {filterLabel(filter)}
          </button>
        ))}
      </div>

      <div className="sort-row">
        <label className="field-inline">
          <span>Sort</span>
          <select
            value={sortMode}
            onChange={(event) => setSortMode(event.target.value as SortMode)}
          >
            <option value="UPDATED">Updated</option>
            <option value="TITLE">Title</option>
          </select>
        </label>
      </div>

      {entries.length === 0 ? (
        <EmptyState
          title="No entries yet"
          body="Use Add item to start this category list."
          actionLabel="Go to search"
          actionHref="/search"
        />
      ) : null}

      {entries.length > 0 && filtered.length === 0 ? (
        <EmptyState
          title="No matches for this filter"
          body="Try another filter or add more items."
        />
      ) : null}

      {entries.length > 0 ? (
        <div className="rows-stack">
          {filtered.map(({ item, userItem }) => (
            <ListRow
              key={`${item.id}-${userItem.userId}`}
              item={item}
              userItem={userItem}
              href={`/item/${item.id}`}
            />
          ))}
        </div>
      ) : null}

      <details className="state-sample">
        <summary>Loading state preview</summary>
        <SkeletonRows rows={3} />
      </details>
    </section>
  );
}
