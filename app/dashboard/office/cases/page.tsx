"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Plus, FileText, Clock, Users, CheckCircle2 } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
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
import { Textarea } from "@/components/ui/textarea"

import { useState, useEffect } from "react"
import { addCaseAction, fetchCasesAction } from "@/app/actions/cases"
import { fetchTeamAction } from "@/app/actions/team"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

const CASE_TYPES = [
    "أحوال شخصية",
    "قانون العمل",
    "مدني",
    "جنائي",
    "شركات",
    "عقارات",
]

export default function OfficeCasesPage() {
    const [cases, setCases] = useState<any[]>([])
    const [lawyers, setLawyers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Form states
    const [title, setTitle] = useState("")
    const [clientName, setClientName] = useState("")
    const [caseType, setCaseType] = useState("")
    const [assignee, setAssignee] = useState("unassigned")
    const [description, setDescription] = useState("")
    const [sessionDate, setSessionDate] = useState("")
    const [search, setSearch] = useState("")

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        try {
            const [casesRes, teamRes] = await Promise.all([
                fetchCasesAction(),
                fetchTeamAction()
            ])

            if (casesRes.data) {
                setCases(casesRes.data)
            }

            if (teamRes.data) {
                setLawyers(teamRes.data)
            }
        } catch (error) {
            console.error("Error loading cases:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleAddCase = async (e: React.MouseEvent | React.FormEvent) => {
        e.preventDefault()
        console.log("BUTTON CLICKED")

        if (!title || !clientName || !caseType) {
            toast.error("يرجى ملء الحقول المطلوبة (العنوان، العميل، نوع القضية)")
            return
        }

        setIsSubmitting(true)
        try {
            const dataToInsert = {
                title,
                client_name: clientName,
                case_type: caseType,
                assigned_lawyer: assignee === "unassigned" ? undefined : assignee,
                description,
                session_date: sessionDate || undefined,
            }
            console.log("data", dataToInsert)

            const res = await addCaseAction(dataToInsert)

            if (res.error) {
                console.log("error", res.error)
                toast.error(res.error)
            } else {
                toast.success("تم إضافة القضية بنجاح")
                setIsDialogOpen(false)
                setTitle("")
                setClientName("")
                setCaseType("")
                setAssignee("unassigned")
                setDescription("")
                setSessionDate("")
                await loadData()
            }
        } catch (error) {
            console.log("error", error)
            toast.error("حدث خطأ غير متوقع")
        } finally {
            setIsSubmitting(false)
        }
    }
    const filteredCases = cases.filter((c) =>
        (c.title || "").toLowerCase().includes(search.toLowerCase()) ||
        (c.client_name || "").toLowerCase().includes(search.toLowerCase())
    )

    return (
        <DashboardLayout role="office">
            <div className="p-6 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">قضايا المكتب</h1>
                        <p className="text-muted-foreground mt-1">متابعة جميع القضايا وتوزيع المهام على فريق العمل</p>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2 bg-magenta hover:bg-magenta/90 text-white">
                                <Plus className="h-4 w-4" />
                                إضافة قضية جديدة
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>إضافة قضية جديدة</DialogTitle>
                                <DialogDescription>
                                    أدخل تفاصيل القضية الجديدة للمكتب.
                                </DialogDescription>
                            </DialogHeader>
                            <form>
                                <div className="grid gap-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="title">عنوان القضية <span className="text-red-500">*</span></Label>
                                        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثال: استحواذ شركة التقنية" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="client">اسم العميل <span className="text-red-500">*</span></Label>
                                        <Input id="client" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="اسم العميل أو الشركة" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="type">نوع القضية <span className="text-red-500">*</span></Label>
                                        <input
                                            list="case-types"
                                            id="type"
                                            value={caseType}
                                            onChange={(e) => setCaseType(e.target.value)}
                                            placeholder="اختر أو اكتب نوع القضية"
                                            className="w-full rounded-lg border border-input px-3 py-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-magenta/50"
                                            dir="rtl"
                                        />
                                        <datalist id="case-types">
                                            {CASE_TYPES.map((type) => (
                                                <option key={type} value={type} />
                                            ))}
                                        </datalist>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="assignee">تعيين محامي</Label>
                                        <Select value={assignee || "unassigned"} onValueChange={setAssignee}>
                                            <SelectTrigger className="w-full text-right" dir="rtl">
                                                <SelectValue placeholder="اختر المحامي المسؤول" />
                                            </SelectTrigger>
                                            <SelectContent dir="rtl">
                                                <SelectItem value="unassigned">بدون تعيين</SelectItem>
                                                {lawyers.filter(l => l?.id || l?.lawyer_id).map((l, index) => (
                                                    <SelectItem key={l.id || l.lawyer_id || `lawyer-${index}`} value={l.id || l.lawyer_id}>
                                                        {l.full_name || l.lawyers?.full_name || "بدون اسم"}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="description">وصف مختصر (خياري)</Label>
                                        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="تفاصيل موجزة عن القضية" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="date">تاريخ الجلسة</Label>
                                        <Input id="date" type="date" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button
                                        type="button"
                                        disabled={isSubmitting}
                                        className="w-full bg-magenta hover:bg-magenta/90 text-white"
                                        onClick={handleAddCase}
                                    >
                                        {isSubmitting ? "جاري الإضافة..." : "إضافة القضية"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <CardTitle>سجل القضايا</CardTitle>
                                <CardDescription>إدارة ومراقبة التقدم في قضايا المكتب</CardDescription>
                            </div>
                            <div className="relative w-full sm:w-72">
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="البحث عن قضية أو عميل..."
                                    className="pr-9"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {loading ? (
                            <div className="text-center py-10 text-muted-foreground">جاري تحميل القضايا...</div>
                        ) : cases.length === 0 && search === "" ? (
                            <div className="text-center py-10 text-muted-foreground">لا يوجد قضايا حالياً</div>
                        ) : cases.length > 0 && filteredCases.length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground">لا توجد نتائج</div>
                        ) : (
                            filteredCases.map((caseItem, idx) => {
                                const statusColor = caseItem.status === "نشطة" ? "accent" : caseItem.status === "مستعجلة" ? "destructive" : "purple";
                                const progress = caseItem.progress || 0;
                                let progressColor = "bg-green-500";
                                if (progress < 30) progressColor = "bg-red-500";
                                else if (progress <= 70) progressColor = "bg-yellow-500";

                                return (
                                    <div key={caseItem.id} className="border border-border rounded-lg p-5 hover:border-magenta/50 transition-colors">
                                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h4 className="font-semibold text-lg text-foreground">{caseItem.title}</h4>
                                                    <Badge className={`bg-${statusColor} text-white border-transparent`}>
                                                        {caseItem.status || "قيد المراجعة"}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                                                    <span className="flex items-center gap-1"><FileText className="h-4 w-4" /> قضية #{caseItem.id?.substring(0, 6) || idx}</span>
                                                    <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {caseItem.case_type}</span>
                                                    <span className="flex items-center gap-1 text-magenta">
                                                        <Users className="h-4 w-4" />
                                                        المحامي: {lawyers.find(l => l.id === caseItem.assigned_lawyer)?.full_name || caseItem.lawyer?.full_name || "غير معين"}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="w-full md:w-48">
                                                <div className="flex items-center justify-between text-sm mb-1">
                                                    <span className="text-muted-foreground">نسبة الإنجاز الكلية</span>
                                                    <span className="font-medium">{progress}%</span>
                                                </div>
                                                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                                    <div className={`h-full ${progressColor} transition-all duration-300`} style={{ width: `${progress}%` }} />
                                                </div>
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
