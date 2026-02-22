import { ProfileView } from "@/components/profile/profile-view";
import {
  getCategorySummaryForUser,
  getCurrentUser,
  getTasteBlurbForUser,
} from "@/server/repositories";

export const dynamic = "force-dynamic";

export default async function MePage(): Promise<JSX.Element> {
  const user = await getCurrentUser();
  const [summary, tasteBlurb] = await Promise.all([
    getCategorySummaryForUser(user.id),
    getTasteBlurbForUser(user.id),
  ]);

  return (
    <ProfileView
      user={user}
      isOwnProfile
      summary={summary}
      tasteBlurb={tasteBlurb}
    />
  );
}
