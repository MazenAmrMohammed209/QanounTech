import DashboardClient from "./dashboard-client"

export default function OfficeDashboardPage() {
  const role = "office"
  return <DashboardClient role={role} />
}
