import { notFound } from "next/navigation";

import { EntryCard } from "@/components/media/entry-card";
import { RecommendationCard } from "@/components/media/recommendation-card";
import { Sheet } from "@/components/ui/sheet";
import { EmptyState } from "@/components/ui/states";
import { formatCreators } from "@/lib/domain";
import { getItemDetailForCurrentUser } from "@/server/repositories";

export const dynamic = "force-dynamic";

export default async function ItemDetailPage({
  params,
}: {
  params: { itemId: string };
}): Promise<JSX.Element> {
  const detail = await getItemDetailForCurrentUser(params.itemId);
  if (!detail) {
    notFound();
  }

  const { item, userItem, recommendations } = detail;
  const airingLabel =
    item.airingStatus === "FINISHED"
      ? "Finished airing"
      : item.airingStatus === "ONGOING"
        ? "Ongoing"
        : "Airing status unknown";
  const seasonEpisodeLabel =
    item.seasonCount || item.episodeCount
      ? `${item.seasonCount ?? "?"} seasons, ${item.episodeCount ?? "?"} episodes`
      : "Season/episode counts unavailable";
  const description =
    item.description ?? "Simple description is not available yet for this item.";

  return (
    <section className="item-detail-page">
      <header className="item-header card">
        <div className="item-cover" aria-hidden="true">
          {item.posterUrl || item.thumbUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className="item-cover-image"
              src={item.posterUrl ?? item.thumbUrl ?? ""}
              alt={`${item.title} poster`}
              loading="lazy"
            />
          ) : (
            item.title.slice(0, 1).toUpperCase()
          )}
        </div>
        <div>
          <p className="eyebrow">{item.category}</p>
          <h1 className="title-serif">{item.title}</h1>
          <p className="muted">
            {item.year ?? "Year unknown"} - {formatCreators(item.creators)}
          </p>
          {item.category === "TV" ? (
            <div className="item-tv-meta">
              <span className="chip chip-neutral">{airingLabel}</span>
              <span className="chip chip-neutral">{seasonEpisodeLabel}</span>
            </div>
          ) : null}
          <p className="item-description-clamped">{description}</p>
        </div>
      </header>

      <EntryCard userItem={userItem} />

      <section className="card stack">
        <header className="section-head">
          <h2>Recommendations</h2>
          <Sheet title="Recommend item" triggerLabel="Recommend">
            <form className="sheet-form" action="#">
              <label className="field">
                <span>Recipients</span>
                <input placeholder="Search circles or handles" />
              </label>
              <label className="field">
                <span>Optional one-liner</span>
                <input maxLength={160} placeholder="One line, optional" />
              </label>
              <button className="button" type="button">
                Send recommendation
              </button>
            </form>
          </Sheet>
        </header>

        {recommendations.length === 0 ? (
          <EmptyState
            title="No recommendations yet"
            body="Send this to one or more people from circles."
          />
        ) : (
          <div className="stack">
            {recommendations.map(({ recommendation, fromName, toName }) => (
              <RecommendationCard
                key={recommendation.id}
                recommendation={recommendation}
                fromName={fromName}
                toName={toName}
                compact
              />
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
