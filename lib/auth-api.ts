import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/**
 * Resolve the authenticated user for API routes:
 * 1) Bearer `session_<uuid>` after verifying the user exists in next_auth.users
 *
 * Rejects random strings, JWT-shaped tokens, and tampered IDs.
 */
export async function requireApiUserId(
  request: Request
): Promise<{ ok: true; userId: string } | { ok: false; response: NextResponse }> {

  const header = request.headers.get("authorization")
  if (!header?.startsWith("Bearer ")) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    }
  }

  const raw = header.slice(7).trim()

  if (raw.includes(".")) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    }
  }

  if (!raw.startsWith("session_")) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    }
  }

  const id = raw.slice("session_".length)
  if (!UUID_RE.test(id)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    }
  }

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("id", id)
    .single()

  if (!user?.id) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    }
  }

  return { ok: true, userId: user.id }
}
