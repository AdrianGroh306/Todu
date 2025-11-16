import { auth } from "@clerk/nextjs/server";
import { TodosClient } from "./todos-client";

export default async function TodosPage() {
  const { userId } = await auth();

  if (!userId) {
    // Middleware should handle redirects, but return null to satisfy the type system.
    return null;
  }

  return <TodosClient />;
}
