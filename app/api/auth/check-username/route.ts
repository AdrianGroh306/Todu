import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { username } = await request.json();

  if (!username || typeof username !== "string") {
    return Response.json(
      { error: "Username is required" },
      { status: 400 }
    );
  }

  if (username.length < 2 || username.length > 20) {
    return Response.json(
      { error: "Username must be between 2 and 20 characters" },
      { status: 400 }
    );
  }

  // Check if username is alphanumeric and underscores only
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return Response.json(
      { error: "Username can only contain letters, numbers, and underscores" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // Check if username already exists
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username.toLowerCase())
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 = no rows found, which is what we want
    return Response.json(
      { error: "Database error" },
      { status: 500 }
    );
  }

  if (data) {
    return Response.json(
      { available: false },
      { status: 200 }
    );
  }

  return Response.json(
    { available: true },
    { status: 200 }
  );
}
