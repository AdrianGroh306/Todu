import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export default async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  // Exclude API routes and static assets from auth middleware
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)"
  ]
};
