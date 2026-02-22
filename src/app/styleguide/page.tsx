import { EntryCard } from "@/components/media/entry-card";
import { ListRow } from "@/components/media/list-row";
import { RecommendationCard } from "@/components/media/recommendation-card";
import {
  Chip,
  ExcellentChip,
  IncompatibleChip,
  RecommendationStateChip,
  StatusChip,
  VerdictChip,
} from "@/components/ui/chip";
import { Sheet } from "@/components/ui/sheet";
import { EmptyState, ErrorState, SkeletonRows } from "@/components/ui/states";
import {
  CURRENT_USER_ID,
  getItemById,
  getRecommendationsForInbox,
  getUserItem,
} from "@/lib/mock-data";

export default function StyleguidePage(): JSX.Element {
  const item = getItemById("itm_movie_arrival");
  const userItem = getUserItem(CURRENT_USER_ID, "itm_movie_arrival");
  const recommendation = getRecommendationsForInbox(CURRENT_USER_ID)[0];

  if (!item || !userItem || !recommendation) {
    return <ErrorState title="Missing styleguide fixtures" body="Seed data did not load." />;
  }

  return (
    <section className="stack">
      <header className="page-head">
        <div>
          <p className="eyebrow">Design system</p>
          <h1>Styleguide</h1>
        </div>
      </header>

      <article className="card stack">
        <h2>List row</h2>
        <ListRow item={item} userItem={userItem} href="#" />
      </article>

      <article className="card stack">
        <h2>Chips</h2>
        <div className="chip-grid">
          <Chip>Neutral</Chip>
          <StatusChip status="FINISHED" />
          <RecommendationStateChip state="ACK_STARTED" />
          <VerdictChip verdictScore={1} />
          <ExcellentChip value />
          <IncompatibleChip value />
        </div>
      </article>

      <article className="card stack">
        <h2>Sheet</h2>
        <Sheet title="Example sheet" triggerLabel="Open sheet">
          <p>This is the shared drawer/sheet component used for edit/recommend/share actions.</p>
        </Sheet>
      </article>

      <article className="card stack">
        <h2>Entry card</h2>
        <EntryCard userItem={userItem} />
      </article>

      <article className="card stack">
        <h2>Recommendation card</h2>
        <RecommendationCard recommendation={recommendation} />
      </article>

      <article className="card stack">
        <h2>States</h2>
        <EmptyState title="Empty" body="No content available yet." />
        <ErrorState title="Error" body="A recoverable error happened." />
        <SkeletonRows rows={2} />
      </article>
    </section>
  );
}
