"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

interface ExportButtonProps {
  teamMembers: Array<{
    specialty: string | null
    city: string | null
    cases_completed: number
    experience_years: number
    rating: number
  }>
  cases: Array<{
    case_number: string
    title: string
    category: string
    status: string
  }>
}

export function ExportButton({ teamMembers, cases }: ExportButtonProps) {
  const handleExport = () => {
    const BOM = "\uFEFF"
    let csv = BOM + "التقرير الشامل للمكتب\n\n"

    // Team section
    csv += "أعضاء الفريق\n"
    csv += "التخصص,المدينة,القضايا المنجزة,سنوات الخبرة,التقييم\n"
    teamMembers.forEach((m) => {
      csv += `${m.specialty || "-"},${m.city || "-"},${m.cases_completed},${m.experience_years},${m.rating}\n`
    })

    csv += "\nالقضايا\n"
    csv += "رقم القضية,العنوان,التصنيف,الحالة\n"
    cases.forEach((c) => {
      csv += `${c.case_number},${c.title},${c.category},${c.status}\n`
    })

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "office_report.csv"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <Button onClick={handleExport} className="gap-2 bg-green-600 hover:bg-green-700 text-white">
      <Download className="h-4 w-4" />
      تصدير تقرير (Excel)
    </Button>
  )
}
