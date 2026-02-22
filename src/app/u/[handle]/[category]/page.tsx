import { notFound } from "next/navigation";

import { CategoryListView } from "@/components/media/category-list-view";
import { parseCategorySlug, toCategory } from "@/lib/domain";
import { getUserByHandle, listCategoryEntriesForUser } from "@/server/repositories";

export const dynamic = "force-dynamic";

export default async function CategoryListPage({
  params,
}: {
  params: { handle: string; category: string };
}): Promise<JSX.Element> {
  const categorySlug = parseCategorySlug(params.category);
  const user = await getUserByHandle(params.handle);

  if (!categorySlug || !user) {
    notFound();
  }

  const category = toCategory(categorySlug);
  const entries = await listCategoryEntriesForUser(user.id, category);

  return (
    <CategoryListView
      displayName={user.displayName}
      category={category}
      entries={entries}
    />
  );
}
