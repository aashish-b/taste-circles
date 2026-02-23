import { ProfileView } from "@/components/profile/profile-view";
import {
  getCategoryHighlightsForUser,
  getCurrentUser,
  getPendingInboxCountForUser,
  getTasteBlurbForUser,
  getTasteWaveMetricsForUser,
} from "@/server/repositories";
import {
  CATEGORY_ORDER,
  type Category,
  type CategoryProfileHighlight,
  type ProfileNextAction,
  toCategorySlug,
} from "@/lib/domain";

export const dynamic = "force-dynamic";

function buildNextActions(input: {
  userHandle: string;
  categoryHighlights: Record<Category, CategoryProfileHighlight>;
  pendingInboxCount: number;
}): ProfileNextAction[] {
  const actions: ProfileNextAction[] = [];

  if (input.pendingInboxCount > 0) {
    actions.push({
      id: "inbox",
      label: `Respond to ${input.pendingInboxCount} recommendation${input.pendingInboxCount === 1 ? "" : "s"}`,
      href: "/inbox",
    });
  }

  const rankedByUnrated = CATEGORY_ORDER.map((category) => {
    const highlight = input.categoryHighlights[category];
    return {
      category,
      unratedCount: Math.max(0, highlight.total - highlight.ratedCount),
    };
  }).sort((left, right) => right.unratedCount - left.unratedCount);
  const topUnrated = rankedByUnrated[0];
  if (topUnrated && topUnrated.unratedCount > 0) {
    actions.push({
      id: "rate",
      label: `Rate ${topUnrated.unratedCount} unrated in ${topUnrated.category}`,
      href: `/u/${input.userHandle}/${toCategorySlug(topUnrated.category)}`,
    });
  }

  const rankedByStarted = CATEGORY_ORDER.map((category) => ({
    category,
    startedCount: input.categoryHighlights[category].startedCount,
  })).sort((left, right) => right.startedCount - left.startedCount);
  const topStarted = rankedByStarted[0];
  if (topStarted && topStarted.startedCount > 0) {
    actions.push({
      id: "finish",
      label: `Finish ${topStarted.startedCount} started in ${topStarted.category}`,
      href: `/u/${input.userHandle}/${toCategorySlug(topStarted.category)}`,
    });
  }

  return actions.slice(0, 2);
}

export default async function MePage(): Promise<JSX.Element> {
  const user = await getCurrentUser();
  const [categoryHighlights, tasteBlurb, waveMetrics, pendingInboxCount] = await Promise.all([
    getCategoryHighlightsForUser(user.id),
    getTasteBlurbForUser(user.id),
    getTasteWaveMetricsForUser(user.id),
    getPendingInboxCountForUser(user.id),
  ]);
  const nextActions = buildNextActions({
    userHandle: user.handle,
    categoryHighlights,
    pendingInboxCount,
  });

  return (
    <ProfileView
      user={user}
      isOwnProfile
      categoryHighlights={categoryHighlights}
      tasteBlurb={tasteBlurb}
      waveMetrics={waveMetrics}
      nextActions={nextActions}
    />
  );
}
