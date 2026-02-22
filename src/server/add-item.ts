import { type Category, type Item, type UserItem } from "@/lib/domain";
import { upsertItemAndUserItemForCurrentUser } from "@/server/repositories";

export interface AddItemInput {
  category: Category;
  provider: Item["provider"];
  providerId: string;
  title: string;
  year?: number | null;
  creators?: string[];
  posterUrl?: string | null;
  thumbUrl?: string | null;
  description?: string | null;
  airingStatus?: "ONGOING" | "FINISHED" | null;
  seasonCount?: number | null;
  episodeCount?: number | null;
  noteOneLiner?: string | null;
  defaultStatus?: UserItem["status"];
}

export async function upsertItemAndUserItem(
  input: AddItemInput,
): ReturnType<typeof upsertItemAndUserItemForCurrentUser> {
  return upsertItemAndUserItemForCurrentUser(input);
}
