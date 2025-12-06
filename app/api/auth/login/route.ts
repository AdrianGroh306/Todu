import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const identifier = typeof body?.identifier === "string" ? body.identifier.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!identifier || !password) {
      return NextResponse.json({ error: "Identifier and password are required" }, { status: 400 });
    }

    // Resolve identifier to email if needed
    let email = identifier;
    if (!identifier.includes("@")) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, username")
        .ilike("username", identifier)
        .single();

      if (profileError || !profile) {
        return NextResponse.json({ error: "Benutzername nicht gefunden" }, { status: 404 });
      }

      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      if (authError || !authUsers?.users) {
        return NextResponse.json({ error: "Fehler bei der Benutzersuche" }, { status: 500 });
      }

      const authUser = authUsers.users.find((u) => u.id === profile.id);
      if (!authUser?.email) {
        return NextResponse.json({ error: "E-Mail nicht gefunden" }, { status: 404 });
      }

      email = authUser.email;
    }

    // Sign in with server client to set cookies
    const serverSupabase = await createClient();
    const { data: signInData, error: signInError } = await serverSupabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError || !signInData?.user) {
      return NextResponse.json({ error: signInError?.message ?? "Anmeldung fehlgeschlagen" }, { status: 400 });
    }

    return NextResponse.json({
      user: {
        id: signInData.user.id,
        email: signInData.user.email,
      },
    });
  } catch (error) {
    console.error("POST /api/auth/login failed", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
