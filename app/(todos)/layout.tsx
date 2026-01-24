import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { ActiveListProviderWithData } from "@/features/shared/providers/active-list-provider-with-data";
import { getLists } from "@/lib/data/lists";
import { getTodosForList } from "@/lib/data/todos";
import { ACTIVE_LIST_STORAGE_KEY } from "@/features/shared/constants/storage";

export default async function TodosLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const lists = await getLists();
  const cookieStore = await cookies();
  const storedActiveListId = cookieStore.get(ACTIVE_LIST_STORAGE_KEY)?.value ?? null;
  const initialActiveListId =
    storedActiveListId && lists.some((list) => list.id === storedActiveListId)
      ? storedActiveListId
      : lists[0]?.id ?? null;
  const initialTodos = await getTodosForList(initialActiveListId);

  return (
    <ActiveListProviderWithData
      initialLists={lists}
      initialActiveListId={initialActiveListId}
      initialTodos={initialTodos}
    >
      {children}
    </ActiveListProviderWithData>
  );
}
