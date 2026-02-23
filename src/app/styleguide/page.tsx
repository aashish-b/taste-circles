import { EntryCard } from "@/components/media/entry-card";
import { ListRow } from "@/components/media/list-row";
import { RecommendationCard } from "@/components/media/recommendation-card";
import { VerdictWave } from "@/components/profile/verdict-wave";
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
import { VerdictScale } from "@/components/ui/verdict-scale";
import {
  CURRENT_USER_ID,
  getItemById,
  getRecommendationsForInbox,
  getUserItem,
} from "@/lib/mock-data";
import { type TasteWaveCategoryMetric } from "@/lib/domain";

const STYLEGUIDE_WAVE_METRICS: TasteWaveCategoryMetric[] = [
  {
    category: "TV",
    total: 12,
    finished: 7,
    started: 3,
    dropped: 2,
    starred: 4,
    avgVerdictScore: 4.3,
    lastVerdictScore: 5,
    lastUpdatedAt: new Date().toISOString(),
  },
  {
    category: "MOVIE",
    total: 16,
    finished: 9,
    started: 2,
    dropped: 5,
    starred: 2,
    avgVerdictScore: 3.1,
    lastVerdictScore: 3,
    lastUpdatedAt: new Date().toISOString(),
  },
  {
    category: "MUSIC",
    total: 8,
    finished: 2,
    started: 1,
    dropped: 0,
    starred: 5,
    avgVerdictScore: 4.8,
    lastVerdictScore: 5,
    lastUpdatedAt: new Date().toISOString(),
  },
  {
    category: "ANIME",
    total: 6,
    finished: 3,
    started: 1,
    dropped: 2,
    starred: 2,
    avgVerdictScore: 2.4,
    lastVerdictScore: 2,
    lastUpdatedAt: new Date().toISOString(),
  },
  {
    category: "BOOK",
    total: 0,
    finished: 0,
    started: 0,
    dropped: 0,
    starred: 0,
    avgVerdictScore: null,
    lastVerdictScore: null,
    lastUpdatedAt: null,
  },
  {
    category: "GAME",
    total: 4,
    finished: 2,
    started: 1,
    dropped: 1,
    starred: 1,
    avgVerdictScore: 3.7,
    lastVerdictScore: 4,
    lastUpdatedAt: new Date().toISOString(),
  },
];

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
        <h2>Verdict scale</h2>
        <VerdictScale selected={4} />
      </article>

      <article className="card stack">
        <h2>Entry card</h2>
        <EntryCard userItem={userItem} />
      </article>

      <article className="card stack">
        <h2>Recommendation card</h2>
        <RecommendationCard recommendation={recommendation} />
      </article>

      <VerdictWave metrics={STYLEGUIDE_WAVE_METRICS} />

      <article className="card stack">
        <h2>States</h2>
        <EmptyState title="Empty" body="No content available yet." />
        <ErrorState title="Error" body="A recoverable error happened." />
        <SkeletonRows rows={2} />
      </article>
    </section>
  );
}
