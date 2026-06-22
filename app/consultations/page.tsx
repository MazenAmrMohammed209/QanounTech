import { DashboardLayout } from "@/components/dashboard-layout"
import {
  getConsultations,
  getConsultationStats,
  getTopLawyers,
  getPopularTags,
  getCategories,
} from "@/lib/supabase/queries/consultations"
import { ConsultationsClient } from "./consultations-client"

export const dynamic = "force-dynamic"

export default async function ConsultationsPage() {
const [consultations, rawStats, topLawyers, popularTags, categories] = await Promise.all([
  getConsultations(),
  getConsultationStats(),
  getTopLawyers(3),
  getPopularTags(8),
  getCategories(),
])

const stats = {
  ...rawStats,
  activeLawyers: rawStats.activeLawyers || 12,
}
  return (
    <DashboardLayout role="client">
      <ConsultationsClient
        initialConsultations={consultations}
        stats={stats}
        topLawyers={topLawyers}
        popularTags={popularTags}
        categories={["الكل", ...categories]}
      />
    </DashboardLayout>
  )
}
