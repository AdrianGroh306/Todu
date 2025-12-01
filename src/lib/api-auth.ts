import { auth } from "@clerk/nextjs/server";
import { clerkUserIdToUuid } from "./user-id";

export class UnauthorizedError extends Error {}

const DEV_USER_ID = "00000000-0000-0000-0000-000000000001";

export async function getUserId(): Promise<string> {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return DEV_USER_ID;
  }

  const session = await auth();
  if (!session?.userId) {
    throw new UnauthorizedError("Unauthorized");
  }
  return clerkUserIdToUuid(session.userId);
}
