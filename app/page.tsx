import { auth } from "@clerk/nextjs/server";
import { TodoList } from "@/components/todos/todo-list";

export default async function HomePage() {
  // Skip auth check if Clerk is not configured
  const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (clerkKey) {
    const { userId } = await auth();
    if (!userId) {
      // Middleware handles redirects
      return null;
    }
  }

  return <TodoList />;
}
