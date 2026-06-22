import { createClient } from "@/utils/supabase/middleware"
import type { NextRequest } from "next/server"

export function middleware(req: NextRequest) {
  return createClient(req)
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images).*)",
  ],
}
