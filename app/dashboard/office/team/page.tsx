import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mail, Phone, TrendingUp, Briefcase, Award, Search } from "lucide-react"
import { fetchTeamAction } from "@/app/actions/team"
import { fetchCasesAction } from "@/app/actions/cases"
import { fetchTasksAction } from "@/app/actions/tasks"
import { AddMemberDialog, DeleteMemberButton } from "./client-components"

function getInitial(name: string) {
    return name?.charAt(0).toUpperCase() || "?"
}

export default async function OfficeTeamPage() {
    const { data: members } = await fetchTeamAction()
    const { data: casesData } = await fetchCasesAction()
    const { data: tasksData } = await fetchTasksAction()
    
    const cases = casesData || []
    const tasks = tasksData || []
    
    const teamMembers = (members || []).map((member: any) => ({
        ...member,
        cases_count: cases.filter((c: any) => c.assigned_lawyer === member.id).length,
        tasks_count: tasks.filter((t: any) => t.assigned_to === member.id).length
    }))

    return (
        <DashboardLayout role="office">
            <div className="p-6 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">فريق العمل</h1>
                        <p className="text-muted-foreground mt-1">
                            إدارة المحامين وتقييم أدائهم (العدد: {teamMembers.length})
                        </p>
                    </div>
                    <AddMemberDialog />
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {teamMembers.length === 0 ? (
                        <div className="col-span-full text-center py-10 bg-secondary/10 rounded-lg">
                            <Search className="h-12 w-12 mx-auto mb-3 opacity-30 text-muted-foreground" />
                            <p className="text-muted-foreground font-medium">لا يوجد أعضاء فريق</p>
                            <p className="text-sm text-muted-foreground mt-1">قم بإضافة أعضاء جدد لتمثيل مكتبك</p>
                        </div>
                    ) : (
                        teamMembers.map((member: any) => (
                            <Link key={member.id} href={`/dashboard/office/lawyers/${member.id}`} className="block">
                            <Card className="hover:shadow-md transition-shadow group">
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl bg-purple text-white">
                                                {getInitial(member.full_name)}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg">{member.full_name}</h3>
                                                <p className="text-sm text-muted-foreground">{member.role}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <Badge variant="outline" className="bg-secondary/30 border-muted/50">
                                                {member.specialization || "عام"}
                                            </Badge>
                                            <DeleteMemberButton memberId={member.id} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div className="bg-secondary/20 p-3 rounded-lg text-center">
                                            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                                                <Briefcase className="w-4 h-4" />
                                                <span className="text-xs">القضايا</span>
                                            </div>
                                            <p className="font-semibold text-lg">{member.cases_count}</p>
                                        </div>
                                        <div className="bg-secondary/20 p-3 rounded-lg text-center">
                                            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                                                <TrendingUp className="w-4 h-4" />
                                                <span className="text-xs">المهام</span>
                                            </div>
                                            <p className="font-semibold text-lg" dir="ltr">{member.tasks_count}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3 pt-4 border-t border-border">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="flex items-center gap-2 text-muted-foreground">
                                                <Award className="w-4 h-4 text-magenta" /> التقييم العام
                                            </span>
                                            <span className="font-medium text-foreground">جديد</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="flex items-center gap-2 text-muted-foreground">
                                                <Mail className="w-4 h-4" /> البريد
                                            </span>
                                            <span className="truncate max-w-[150px]">{member.email || "—"}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="flex items-center gap-2 text-muted-foreground">
                                                <Phone className="w-4 h-4" /> الهاتف
                                            </span>
                                            <span dir="ltr">{member.phone || "—"}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </DashboardLayout>
    )
}
