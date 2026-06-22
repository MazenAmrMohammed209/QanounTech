import { supabaseAdmin as supabase } from "@/lib/supabase-admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return Response.json({ error: "Email and password are required" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    console.log("Login API - Attempting login for:", normalizedEmail);

    const { data, error } = await supabase
      .schema("next_auth")
      .from("users")
      .select("*")
      .eq("email", normalizedEmail);

    if (error) {
      console.error("Login API - Database error:", error);
      return Response.json({ error: "Database error occurred" }, { status: 500 });
    }

    if (!data || data.length === 0) {
      console.log("Login API - User not found");
      return Response.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const user = data[0];

    if (user.password !== trimmedPassword) {
      console.log("Login API - Password mismatch");
      return Response.json({ error: "Invalid credentials" }, { status: 401 });
    }

    console.log("Login API - Login successful");
    return Response.json({ user });
  } catch (err) {
    console.error("Login API - Server error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
