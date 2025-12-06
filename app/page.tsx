import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TodoList } from "@/components/todos/todo-list";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  return <TodoList />;
}
