import { notFound } from "next/navigation";

import { ProfileView } from "@/components/profile/profile-view";
import {
  getCategorySummaryForUser,
  getCurrentUser,
  getTasteBlurbForUser,
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

  const [summary, tasteBlurb] = await Promise.all([
    getCategorySummaryForUser(user.id),
    getTasteBlurbForUser(user.id),
  ]);

  return (
    <ProfileView
      user={user}
      isOwnProfile={user.id === currentUser.id}
      summary={summary}
      tasteBlurb={tasteBlurb}
    />
  );
}
