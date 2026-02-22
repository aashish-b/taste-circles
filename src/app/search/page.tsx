import { GlobalSearchPanel } from "@/components/media/global-search-panel";
import {
  CATEGORY_ORDER,
  type Category,
  toCategorySlug,
} from "@/lib/domain";
import {
  getCategorySummaryForUser,
  getCurrentUser,
  listCategoryEntriesForUser,
} from "@/server/repositories";

export const dynamic = "force-dynamic";

function pickDefaultCategory(summary: Record<Category, number>): Category {
  let bestCategory: Category = "MOVIE";
  let bestCount = -1;

  for (const category of CATEGORY_ORDER) {
    const count = summary[category] ?? 0;
    if (count > bestCount) {
      bestCount = count;
      bestCategory = category;
    }
  }

  return bestCategory;
}

export default async function SearchPage(): Promise<JSX.Element> {
  const user = await getCurrentUser();
  const summary = await getCategorySummaryForUser(user.id);
  const defaultCategory = pickDefaultCategory(summary);
  const initialCategoryEntries = await listCategoryEntriesForUser(user.id, defaultCategory);

  return (
    <GlobalSearchPanel
      currentUserId={user.id}
      initialCategorySlug={toCategorySlug(defaultCategory)}
      initialCategoryEntries={initialCategoryEntries}
    />
  );
}
