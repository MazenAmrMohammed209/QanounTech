"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Badge } from "@/components/ui/badge"
import { TaskCard } from "@/components/task-card"
import { useState, useEffect } from "react"
import { useUser } from "@/hooks/use-user"
import { createClient } from "@/utils/supabase/client"
import { updateTaskStatusAction } from "@/app/actions/tasks"
import { toast } from "sonner"

export default function LawyerTasksPage() {
    const { user: localUser, loading: userLoading } = useUser()
    const [tasks, setTasks] = useState<any[]>([])
    const [cases, setCases] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    
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

            console.log("USER ID:", user.id)

            const { data: userTasks, error: tasksError } = await supabase
                .from("tasks")
                .select("*")
                .eq("assigned_to", user.id)
                .order("created_at", { ascending: false })

            console.log("FETCHED TASKS:", userTasks)
            userTasks?.forEach(t => console.log("TASK assigned_to:", t.assigned_to))

            if (tasksError) throw tasksError
            const fetchedTasks = userTasks || []
            setTasks(fetchedTasks)

            const caseIds = fetchedTasks
              .map(t => t.case_id)
              .filter(id => id !== null && id !== undefined)

            if (caseIds.length > 0) {
                const { data: relatedCases, error: casesError } = await supabase
                    .from("cases")
                    .select("*")
                    .in("id", caseIds)

                if (casesError) throw casesError
                setCases(relatedCases || [])
            } else {
                setCases([])
            }
        } catch (error) {
            console.error("Error loading tasks:", error)
            toast.error("حدث خطأ أثناء جلب المهام")
        } finally {
            setLoading(false)
        }
    }

    const handleStartTask = async (taskId: string) => {
        try {
            const res = await updateTaskStatusAction(taskId, "in_progress")
            if (res.error) {
                toast.error(res.error)
            } else {
                toast.success("تم بدء المهمة")
                await loadData()
            }
        } catch (error) {
            toast.error("حدث خطأ")
        }
    }

    const handleCompleteTask = async (taskId: string) => {
        try {
            const res = await updateTaskStatusAction(taskId, "completed")
            if (res.error) {
                toast.error(res.error)
            } else {
                toast.success("تم إكمال المهمة")
                await loadData()
            }
        } catch (error) {
            toast.error("حدث خطأ")
        }
    }

    const STATUS_MAP = {
        pending: "قيد الانتظار",
        in_progress: "قيد العمل",
        completed: "مكتملة",
    }

    const normalize = (s: string) => s?.toLowerCase().trim()
    
    console.log("STATUS VALUES:", tasks.map(t => t.status))

    const todoTasks = tasks.filter((t) => normalize(t.status) === "pending")
    const inProgressTasks = tasks.filter((t) => normalize(t.status) === "in_progress")
    const doneTasks = tasks.filter((t) => normalize(t.status) === "completed")

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
                        <h1 className="text-3xl font-bold text-foreground">المهام</h1>
                        <p className="text-muted-foreground mt-1">المهام الخاصة بك المرتبطة بالقضايا</p>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-10 text-muted-foreground">جاري تحميل المهام...</div>
                ) : tasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[50vh] text-muted-foreground">
                        <p className="text-xl">لا توجد مهام مسندة إليك حتى الآن</p>
                    </div>
                ) : (
                    <div className="grid lg:grid-cols-3 gap-6">
                        {/* To Do Column */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between pb-2 border-b border-border">
                                <h3 className="font-semibold flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-destructive" />
                                    قيد الانتظار
                                </h3>
                                <Badge variant="secondary">{todoTasks.length}</Badge>
                            </div>

                            {todoTasks.map(task => (
                                <TaskCard 
                                    key={task.id} 
                                    task={task}
                                    caseName={cases.find(c => c.id === task.case_id)?.title || "بدون قضية"}
                                    assigneeName="أنت"
                                    hideEdit={true}
                                    onStart={handleStartTask}
                                />
                            ))}
                        </div>

                        {/* In Progress Column */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between pb-2 border-b border-border">
                                <h3 className="font-semibold flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-accent" />
                                    قيد العمل
                                </h3>
                                <Badge variant="secondary">{inProgressTasks.length}</Badge>
                            </div>

                            {inProgressTasks.map(task => (
                                <TaskCard 
                                    key={task.id} 
                                    task={task}
                                    caseName={cases.find(c => c.id === task.case_id)?.title || "بدون قضية"}
                                    assigneeName="أنت"
                                    hideEdit={true}
                                    onComplete={handleCompleteTask}
                                />
                            ))}
                        </div>

                        {/* Completed Column */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between pb-2 border-b border-border">
                                <h3 className="font-semibold flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                                    مكتملة
                                </h3>
                                <Badge variant="secondary">{doneTasks.length}</Badge>
                            </div>

                            {doneTasks.map(task => (
                                <TaskCard 
                                    key={task.id} 
                                    task={task}
                                    caseName={cases.find(c => c.id === task.case_id)?.title || "بدون قضية"}
                                    assigneeName="أنت"
                                    hideEdit={true}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}
