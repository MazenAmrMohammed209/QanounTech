import { ClientLayout } from "@/components/client-layout"
import { createClient } from "@supabase/supabase-js"
import { DiscoveryClient } from "./discovery-client"

export const revalidate = 0; // ensure dynamic rendering

export default async function DiscoveryPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
  )

  const { data: lawyers } = await supabase.from("lawyers").select("*")
  const { data: offices } = await supabase.from("offices").select("*")

  console.log("=== SERVER FETCH ===")
  console.log("LAWYERS:", lawyers)
  console.log("OFFICES:", offices)

  // Basic stats placeholder
  const platformStats = {
    lawyersCount: lawyers?.length || 0,
    officesCount: offices?.length || 0,
    completedCases: 0
  }

  return (
    <ClientLayout>
      <DiscoveryClient
        initialLawyers={lawyers || []}
        initialOffices={offices || []}
        platformStats={platformStats}
      />
    </ClientLayout>
  )
}
