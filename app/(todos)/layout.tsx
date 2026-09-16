import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { ActiveListProviderWithData } from "@/features/shared/providers/active-list-provider-with-data";
import { ModalManagerProvider } from "@/features/shared/providers/modal-manager-provider";
import { getAuthUserId } from "@/lib/api-auth";
import { getLists } from "@/lib/data/lists";
import { getTodosForList } from "@/lib/data/todos";
import { ACTIVE_LIST_STORAGE_KEY } from "@/features/shared/constants/storage";

export default async function TodosLayout({ children }: { children: React.ReactNode }) {
  const [userId, cookieStore] = await Promise.all([getAuthUserId(), cookies()]);

  if (!userId) {
    redirect("/sign-in");
  }

  const storedActiveListId = cookieStore.get(ACTIVE_LIST_STORAGE_KEY)?.value ?? null;

  // Fetch todos for the remembered list in parallel; only used once membership is confirmed.
  const [lists, speculativeTodos] = await Promise.all([
    getLists(userId),
    getTodosForList(storedActiveListId),
  ]);

  const storedIsValid =
    storedActiveListId !== null && lists.some((list) => list.id === storedActiveListId);
  const initialActiveListId = storedIsValid ? storedActiveListId : lists[0]?.id ?? null;
  const initialTodos = storedIsValid
    ? speculativeTodos
    : await getTodosForList(initialActiveListId);

  return (
    <ActiveListProviderWithData
      initialLists={lists}
      initialActiveListId={initialActiveListId}
      initialTodos={initialTodos}
    >
      <ModalManagerProvider>{children}</ModalManagerProvider>
    </ActiveListProviderWithData>
  );
}
