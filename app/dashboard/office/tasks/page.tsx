"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, CheckSquare, Clock, Users, ArrowUpRight, Pencil } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { 
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { TaskCard } from "@/components/task-card"
import { useState, useEffect } from "react"
import { addTaskAction, fetchTasksAction, updateTaskStatusAction, updateTaskAssigneeAction } from "@/app/actions/tasks"
import { fetchTeamAction } from "@/app/actions/team"
import { fetchCasesAction } from "@/app/actions/cases"
import { toast } from "sonner"

export default function OfficeTasksPage() {
    const [tasks, setTasks] = useState<any[]>([])
    const [lawyers, setLawyers] = useState<any[]>([])
    const [cases, setCases] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const [newTitle, setNewTitle] = useState("")
    const [newDeadline, setNewDeadline] = useState("")
    const [newAssignee, setNewAssignee] = useState("unassigned")
    const [selectedCase, setSelectedCase] = useState("unassigned")

    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [taskToEdit, setTaskToEdit] = useState<any>(null)
    const [editAssignee, setEditAssignee] = useState<string>("unassigned")
    const [isUpdating, setIsUpdating] = useState(false)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        try {
            const [tasksRes, teamRes, casesRes] = await Promise.all([
                fetchTasksAction(),
                fetchTeamAction(),
                fetchCasesAction(),
            ])
            if (tasksRes.data) setTasks(tasksRes.data)
            if (teamRes.data) setLawyers(teamRes.data)
            if (casesRes.data) setCases(casesRes.data)
        } catch (error) {
            console.error("Error loading data:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleAddTask = async (e: React.MouseEvent | React.FormEvent) => {
        e.preventDefault()
        console.log("BUTTON CLICKED")

        if (!newTitle || !newAssignee || newAssignee === "unassigned") {
            toast.error("يرجى ملء الحقول المطلوبة (العنوان والمسؤول)")
            return
        }

        setIsSubmitting(true)
        try {
    const dataToInsert = {
        title: newTitle,
        due_date: newDeadline || undefined,
        assigned_to: newAssignee === "unassigned" ? null : newAssignee,
        case_id: selectedCase === "unassigned" ? undefined : selectedCase,
    }
    console.log("data", dataToInsert)

    const res = await addTaskAction(dataToInsert as any)

    if (res.error) {
                console.log("error", res.error)
                toast.error(res.error)
            } else {
                toast.success("تم إضافة المهمة بنجاح")
                setIsDialogOpen(false)
                setNewTitle("")
                setNewDeadline("")
                setNewAssignee("unassigned")
                setSelectedCase("unassigned")
                await loadData()
            }
        } catch (error) {
            console.log("error", error)
            toast.error("حدث خطأ غير متوقع")
        } finally {
            setIsSubmitting(false)
        }
    }

    const startTask = async (taskId: string) => {
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

    const completeTask = async (taskId: string) => {
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

    const handleOpenEditModal = (task: any) => {
        setTaskToEdit(task)
        setEditAssignee(task.assigned_to || "unassigned")
        setIsEditModalOpen(true)
    }

    const handleUpdateAssignee = async () => {
        if (!taskToEdit) return
        setIsUpdating(true)
        try {
            const finalAssignee = editAssignee === "unassigned" ? null : editAssignee
            const res = await updateTaskAssigneeAction(taskToEdit.id, finalAssignee)
            if (res.error) {
                toast.error(res.error)
            } else {
                toast.success("تم تحديث المسؤول عن المهمة")
                setIsEditModalOpen(false)
                await loadData()
            }
        } catch (error) {
            toast.error("حدث خطأ")
        } finally {
            setIsUpdating(false)
        }
    }

    const todoTasks = tasks.filter(t => t.status === "pending" || t.status === "todo")
    const inProgressTasks = tasks.filter(t => t.status === "in_progress")
    const doneTasks = tasks.filter(t => t.status === "completed" || t.status === "done")

    return (
        <DashboardLayout role="office">
            <div className="p-6 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">مهام المكتب</h1>
                        <p className="text-muted-foreground mt-1">إدارة وتوزيع المهام على فريق المحامين</p>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2 bg-magenta hover:bg-magenta/90 text-white">
                                <Plus className="h-4 w-4" />
                                تعيين مهمة جديدة
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>تعيين مهمة جديدة</DialogTitle>
                                <DialogDescription>
                                    قم بإنشاء مهمة جديدة وتعيينها لأحد أفراد فريقك.
                                </DialogDescription>
                            </DialogHeader>
                            <form>
                                <div className="grid gap-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="task-title">عنوان المهمة <span className="text-red-500">*</span></Label>
                                        <Input id="task-title" placeholder="مثال: مراجعة المستندات" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="deadline">تاريخ الاستحقاق</Label>
                                        <Input id="deadline" type="date" value={newDeadline} onChange={(e) => setNewDeadline(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="case">ربط بقضية</Label>
                                        <Select value={selectedCase || "unassigned"} onValueChange={setSelectedCase}>
                                            <SelectTrigger className="w-full text-right" dir="rtl">
                                                <SelectValue placeholder="اختر القضية (خياري)" />
                                            </SelectTrigger>
                                            <SelectContent dir="rtl">
                                                <SelectItem value="unassigned">بدون قضية</SelectItem>
                                                {cases.filter(c => c?.id).map((c) => (
                                                    <SelectItem key={c.id} value={c.id}>
                                                        {c.title}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="assignee">تعيين إلى <span className="text-red-500">*</span></Label>
                                        <Select value={newAssignee || "unassigned"} onValueChange={setNewAssignee}>
                                            <SelectTrigger className="w-full text-right" dir="rtl">
                                                <SelectValue placeholder="اختر المحامي" />
                                            </SelectTrigger>
                                            <SelectContent dir="rtl">
                                                <SelectItem value="unassigned">غير معين</SelectItem>
                                                {lawyers.map((l, index) => (
                                                    <SelectItem
                                                        key={l.id || `lawyer-${index}`}
                                                        value={l.id}
                                                    >
                                                        {l.full_name || "بدون اسم"}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button
                                        type="button"
                                        disabled={isSubmitting}
                                        className="w-full bg-magenta hover:bg-magenta/90 text-white"
                                        onClick={handleAddTask}
                                    >
                                        {isSubmitting ? "جاري الإضافة..." : "إضافة المهمة"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>تعديل المهمة</DialogTitle>
                                <DialogDescription>
                                    تغيير المحامي المسؤول عن هذه المهمة.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-assignee">المحامي المسؤول</Label>
                                    <Select value={editAssignee || "unassigned"} onValueChange={setEditAssignee}>
                                        <SelectTrigger className="w-full text-right" dir="rtl">
                                            <SelectValue placeholder="اختر المحامي" />
                                        </SelectTrigger>
                                        <SelectContent dir="rtl">
                                            <SelectItem value="unassigned">غير معين</SelectItem>
                                            {lawyers.map((l, index) => (
                                                <SelectItem
                                                    key={`edit-${l.id || "lawyer"}-${index}`}
                                                    value={l.id}
                                                >
                                                    {l.full_name || "بدون اسم"}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    type="button"
                                    disabled={isUpdating}
                                    className="w-full bg-magenta hover:bg-magenta/90 text-white"
                                    onClick={handleUpdateAssignee}
                                >
                                    {isUpdating ? "جاري الحفظ..." : "حفظ التغييرات"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

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

                        {loading ? (
                            <div className="text-center py-8 text-muted-foreground text-sm">جاري التحميل...</div>
                        ) : todoTasks.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground text-sm">لا توجد مهام</div>
                        ) : (
                            todoTasks.map(task => (
                                <TaskCard 
                                    key={task.id} 
                                    task={task}
                                    caseName={cases.find(c => c.id === task.case_id)?.title || task.case?.title || "بدون قضية"}
                                    assigneeName={lawyers.find(l => l.id === task.assigned_to)?.full_name || task.lawyer?.full_name || "غير معين"}
                                    onEdit={handleOpenEditModal}
                                    onStart={startTask}
                                />
                            ))
                        )}
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

                        {loading ? (
                            <div className="text-center py-8 text-muted-foreground text-sm">جاري التحميل...</div>
                        ) : inProgressTasks.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground text-sm">لا توجد مهام</div>
                        ) : (
                            inProgressTasks.map(task => (
                                <TaskCard 
                                    key={task.id} 
                                    task={task}
                                    caseName={cases.find(c => c.id === task.case_id)?.title || task.case?.title || "بدون قضية"}
                                    assigneeName={lawyers.find(l => l.id === task.assigned_to)?.full_name|| task.lawyer?.full_name || "غير معين"}
                                    onEdit={handleOpenEditModal}
                                    onComplete={completeTask}
                                />
                            ))
                        )}
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

                        {loading ? (
                            <div className="text-center py-8 text-muted-foreground text-sm">جاري التحميل...</div>
                        ) : doneTasks.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground text-sm">لا توجد مهام</div>
                        ) : (
                            doneTasks.map(task => (
                                <TaskCard 
                                    key={task.id} 
                                    task={task}
                                    caseName={cases.find(c => c.id === task.case_id)?.title || task.case?.title || "بدون قضية"}
                                    assigneeName={lawyers.find(l => l.id === task.assigned_to)?.full_name || task.lawyer?.full_name || "غير معين"}
                                    hideEdit={true}
                                />
                            ))
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
