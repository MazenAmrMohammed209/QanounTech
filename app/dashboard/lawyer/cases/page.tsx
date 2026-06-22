"use client"

import { useState, useEffect } from "react"
import { useUser } from "@/hooks/use-user"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, FileText, Clock, Users } from "lucide-react"
import { createClient } from "@/utils/supabase/client"

export default function LawyerCasesPage() {
    const { user: localUser, loading: userLoading } = useUser()
    const [cases, setCases] = useState<any[]>([])
    const [tasks, setTasks] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

    const supabase = createClient()

    useEffect(() => {
        loadData()
    }, [localUser, userLoading])

    const loadData = async () => {
        if (userLoading) {
            setLoading(true)
            return
        }

        if (!localUser?.id) {
            console.log("No authenticated user found.")
            setLoading(false)
            return
        }

        const user = localUser

        try {
            setLoading(true)

            // STEP 1: FETCH TASKS
            const { data: fetchedTasks, error: tasksError } = await supabase
                .from("tasks")
                .select("*")
                .or(`assigned_to.eq.${user.id},lawyer_id.eq.${user.id}`)

            console.log("TASKS:", fetchedTasks, tasksError)
            console.log("TASK COUNT:", fetchedTasks?.length)

            if (tasksError) throw tasksError

            const validTasks = fetchedTasks || []
            setTasks(validTasks)

            // STEP 2: FETCH CASES (LINKED BY TASKS)
            const caseIds = validTasks
              .map(t => t.case_id)
              .filter(id => id !== null && id !== undefined)

            if (caseIds.length > 0) {
                const { data: fetchedCases, error: casesError } = await supabase
                    .from("cases")
                    .select("*")
                    .in("id", caseIds)

                console.log("CASES:", fetchedCases)
                if (casesError) throw casesError
                setCases(fetchedCases || [])
            } else {
                setCases([])
            }
        } catch (error) {
            console.error("Error loading cases:", error)
        } finally {
            setLoading(false)
        }
    }

    const filteredCases = cases.filter(c =>
        c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.case_number?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // if (loading) {
    //     return (
    //         <DashboardLayout role="lawyer">
    //             <div className="p-6 flex justify-center items-center h-[60vh]">
    //                 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-magenta"></div>
    //             </div>
    //         </DashboardLayout>
    //     )
    // }

    return (
        <DashboardLayout role="lawyer">
            <div className="p-6 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">القضايا</h1>
                        <p className="text-muted-foreground mt-1">القضايا المرتبطة بالمهام المسندة إليك</p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <CardTitle>قائمة القضايا</CardTitle>
                                <CardDescription>عرض وتصفية القضايا المرتبطة بك</CardDescription>
                            </div>
                            <div className="relative w-full sm:w-72">
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="البحث عن قضية..."
                                    className="pr-9"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {loading ? (
                            <div className="text-center py-10 text-muted-foreground">جاري تحميل القضايا...</div>
                        ) : filteredCases.length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground">
                                <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                                <p className="font-medium">لا توجد قضايا لعرضها</p>
                            </div>
                        ) : (
                            filteredCases.map((caseItem) => {
                                const caseTasks = tasks.filter(t => t.case_id === caseItem.id)
                                const progress = caseItem.progress ?? 0
                                return (
                                    <div key={caseItem.id} className="border border-border rounded-lg p-5 hover:border-purple/50 transition-colors">
                                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h4 className="font-semibold text-lg text-foreground">{caseItem.title}</h4>
                                                    <Badge variant="outline" className="bg-accent/10 text-accent">
                                                        {caseItem.status === "active" ? "نشطة" : "مغلقة"}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                    {caseItem.case_number && (
                                                        <span className="flex items-center gap-1"><FileText className="h-4 w-4" /> رقم القضية: {caseItem.case_number}</span>
                                                    )}
                                                    <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {caseItem.category || "عام"}</span>
                                                </div>
                                            </div>
                                            <div className="w-full md:w-48">
                                                <div className="flex items-center justify-between text-sm mb-1">
                                                    <span className="text-muted-foreground">إنجاز المهام</span>
                                                    <span className="font-medium">{progress}%</span>
                                                </div>
                                                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full transition-all duration-500 bg-gradient-to-r from-purple to-pink"
                                                        style={{ width: `${progress}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-secondary/20 rounded-md p-4 mt-4">
                                            <h5 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                                <Users className="h-4 w-4 text-purple" />
                                                مهامك في هذه القضية ({caseTasks.length})
                                            </h5>
                                            <div className="grid sm:grid-cols-2 gap-3">
                                                {caseTasks.map((task) => {
                                                    const isCompleted = task.status === "completed" || task.status === "done"
                                                    return (
                                                        <div key={task.id} className="flex items-center justify-between bg-background p-2 rounded border border-border text-sm">
                                                            <div className="flex items-center gap-3">
                                                                <span className={isCompleted ? "line-through text-muted-foreground" : ""}>
                                                                    {task.title}
                                                                </span>
                                                            </div>
                                                            <Badge variant="outline" className="text-xs bg-secondary">
                                                                {isCompleted ? "مكتملة" : "قيد العمل"}
                                                            </Badge>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    )
}
