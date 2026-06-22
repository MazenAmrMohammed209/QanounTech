"use client"

import type React from "react"

// Deprecated: NextAuth SessionProvider removed.
// This is now a simple passthrough component for backward compatibility.
export function SessionProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
