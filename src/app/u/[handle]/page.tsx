import { notFound } from "next/navigation";

import { ProfileView } from "@/components/profile/profile-view";
import {
  getCategoryHighlightsForUser,
  getCurrentUser,
  getTasteBlurbForUser,
  getTasteWaveMetricsForUser,
  getUserByHandle,
} from "@/server/repositories";

export const dynamic = "force-dynamic";

export default async function UserProfilePage({
  params,
}: {
  params: { handle: string };
}): Promise<JSX.Element> {
  const [user, currentUser] = await Promise.all([
    getUserByHandle(params.handle),
    getCurrentUser(),
  ]);

  if (!user) {
    notFound();
  }

  const [categoryHighlights, tasteBlurb, waveMetrics] = await Promise.all([
    getCategoryHighlightsForUser(user.id),
    getTasteBlurbForUser(user.id),
    getTasteWaveMetricsForUser(user.id),
  ]);

  return (
    <ProfileView
      user={user}
      isOwnProfile={user.id === currentUser.id}
      categoryHighlights={categoryHighlights}
      tasteBlurb={tasteBlurb}
      waveMetrics={waveMetrics}
    />
  );
}
