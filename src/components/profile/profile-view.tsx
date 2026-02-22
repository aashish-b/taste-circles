import { VerdictWave } from "@/components/profile/verdict-wave";
import {
  CATEGORY_LABEL,
  type Category,
  type TasteWaveCategoryMetric,
  toCategorySlug,
  type User,
  type UserTasteBlurb,
} from "@/lib/domain";
import { EmptyState } from "@/components/ui/states";

export function ProfileView({
  user,
  isOwnProfile,
  summary,
  tasteBlurb,
  waveMetrics,
}: {
  user: User;
  isOwnProfile: boolean;
  summary: Record<Category, number>;
  tasteBlurb: UserTasteBlurb | null;
  waveMetrics: TasteWaveCategoryMetric[];
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

      <VerdictWave metrics={waveMetrics} />

      <section className="card">
        <h2>Category lists</h2>
        <div className="category-grid">
          {Object.entries(summary).map(([category, count]) => (
            <a
              className="category-tile"
              key={category}
              href={`/u/${user.handle}/${toCategorySlug(category as keyof typeof CATEGORY_LABEL)}`}
            >
              <span className="category-name">
                {CATEGORY_LABEL[category as keyof typeof CATEGORY_LABEL]}
              </span>
              <span className="category-count">{count} items</span>
            </a>
          ))}
        </div>
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
