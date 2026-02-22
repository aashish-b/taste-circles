import { GlobalSearchPanel } from "@/components/media/global-search-panel";
import {
  getCurrentUser,
  listCategoryEntriesForUser,
} from "@/server/repositories";

export const dynamic = "force-dynamic";

export default async function SearchPage(): Promise<JSX.Element> {
  const user = await getCurrentUser();
  const initialCategoryEntries = await listCategoryEntriesForUser(user.id, "MOVIE");

  return (
    <GlobalSearchPanel
      currentUserId={user.id}
      initialCategoryEntries={initialCategoryEntries}
    />
  );
}
