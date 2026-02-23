import { VerdictWave } from "@/components/profile/verdict-wave";
import {
  CATEGORY_ORDER,
  CATEGORY_LABEL,
  type Category,
  type CategoryProfileHighlight,
  type ProfileNextAction,
  type TasteWaveCategoryMetric,
  toCategorySlug,
  type User,
  type UserTasteBlurb,
} from "@/lib/domain";
import { EmptyState } from "@/components/ui/states";

export function ProfileView({
  user,
  isOwnProfile,
  categoryHighlights,
  tasteBlurb,
  waveMetrics,
  nextActions = [],
}: {
  user: User;
  isOwnProfile: boolean;
  categoryHighlights: Record<Category, CategoryProfileHighlight>;
  tasteBlurb: UserTasteBlurb | null;
  waveMetrics: TasteWaveCategoryMetric[];
  nextActions?: ProfileNextAction[];
}): JSX.Element {
  return (
    <section className="profile-page">
      <header className="page-head profile-head">
        <div>
          <p className="eyebrow">@{user.handle}</p>
          <h1>{user.displayName}</h1>
        </div>
        <div className="profile-actions">
          {isOwnProfile ? (
            <>
              <a className="button button-quiet" href="/settings">
                Settings
              </a>
              <button className="button button-secondary button-accent-soft" type="button">
                Generate taste nugget
              </button>
            </>
          ) : (
            <>
              <button className="button button-secondary" type="button">
                Add to circle
              </button>
              <button className="button" type="button">
                Invite
              </button>
            </>
          )}
        </div>
      </header>

      {isOwnProfile ? (
        <section className="card next-actions-card">
          <header className="section-head">
            <h2>Next actions</h2>
          </header>
          {nextActions.length > 0 ? (
            <div className="button-row">
              {nextActions.map((action) => (
                <a key={action.id} className="button" href={action.href}>
                  {action.label}
                </a>
              ))}
            </div>
          ) : (
            <p className="muted">No urgent actions right now. Your lists are in good shape.</p>
          )}
        </section>
      ) : null}

      <section className="card taste-card">
        <h2>Category lists</h2>
        <div className="category-grid">
          {CATEGORY_ORDER.map((category) => {
            const highlight = categoryHighlights[category];
            const ratedPercent =
              highlight.total > 0
                ? Math.round((highlight.ratedCount / highlight.total) * 100)
                : 0;
            const finishedPercent =
              highlight.total > 0
                ? Math.round((highlight.finishedCount / highlight.total) * 100)
                : 0;

            let toneClass = "category-tile-empty";
            if (highlight.total > 0 && ratedPercent >= 75) {
              toneClass = "category-tile-strong";
            } else if (highlight.total > 0 && ratedPercent >= 40) {
              toneClass = "category-tile-mid";
            } else if (highlight.total > 0) {
              toneClass = "category-tile-light";
            }

            return (
              <a
                className={`category-tile ${toneClass}`}
                key={category}
                href={`/u/${user.handle}/${toCategorySlug(category as keyof typeof CATEGORY_LABEL)}`}
              >
                <span className="category-name">
                  {CATEGORY_LABEL[category as keyof typeof CATEGORY_LABEL]}
                </span>
                <span className="category-count">{highlight.total} items</span>
                <span className="category-metric">
                  {ratedPercent}% rated · {finishedPercent}% finished
                </span>
                <span className="category-last">
                  {highlight.lastItemTitle ? `Last: ${highlight.lastItemTitle}` : "No items yet"}
                </span>
              </a>
            );
          })}
        </div>
      </section>

      <VerdictWave metrics={waveMetrics} />

      <section className="card taste-card">
        <h2>Taste nugget</h2>
        {tasteBlurb?.status === "READY" && tasteBlurb.text && tasteBlurb.isVisible ? (
          <p>{tasteBlurb.text}</p>
        ) : (
          <EmptyState
            title="No blurb yet"
            body="Generation is manual and cached. Trigger from this profile when you want to refresh it."
          />
        )}
      </section>

      {isOwnProfile ? (
        <section className="card">
          <h2>Visibility</h2>
          <p className="muted">
            One list per category. Visibility can be private, unlisted link, circle, or public.
          </p>
        </section>
      ) : null}
    </section>
  );
}
