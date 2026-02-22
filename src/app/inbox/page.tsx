import { RecommendationCard } from "@/components/media/recommendation-card";
import { EmptyState } from "@/components/ui/states";
import { getInboxForCurrentUser } from "@/server/repositories";

export const dynamic = "force-dynamic";

export default async function InboxPage(): Promise<JSX.Element> {
  const feed = await getInboxForCurrentUser();

  return (
    <section className="stack">
      <header className="page-head">
        <div>
          <p className="eyebrow">Recommendations</p>
          <h1>Inbox</h1>
        </div>
      </header>

      {feed.length === 0 ? (
        <EmptyState title="Inbox is clear" body="Recommendations sent to you show up here." />
      ) : (
        <div className="stack">
          {feed.map(({ recommendation, fromName, toName }) => (
            <RecommendationCard
              key={recommendation.id}
              recommendation={recommendation}
              fromName={fromName}
              toName={toName}
            />
          ))}
        </div>
      )}
    </section>
  );
}
