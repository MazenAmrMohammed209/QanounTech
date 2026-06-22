"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Plus, Trash2 } from "lucide-react"
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
import { addLawyerAction, deleteLawyerAction } from "@/app/actions/team"
import { toast } from "sonner"

export function AddMemberDialog() {
    const router = useRouter()
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [newName, setNewName] = useState("")
    const [newRole, setNewRole] = useState("")
    const [newEmail, setNewEmail] = useState("")
    const [newPhone, setNewPhone] = useState("")
    const [newSpecialization, setNewSpecialization] = useState("")
    const [phoneError, setPhoneError] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleAddMember = async (e: React.MouseEvent | React.FormEvent) => {
        e.preventDefault()

        if (!newName || !newRole) {
            toast.error("يرجى إدخال الاسم واختيار المنصب")
            return
        }

        setIsSubmitting(true)

        try {
            const dataToInsert = {
                full_name: newName,
                role: newRole,
                specialization: newSpecialization || "عام",
                email: newEmail,
                phone: newPhone,
            }

            const result = await addLawyerAction(dataToInsert)

            if (result.error) {
                toast.error(result.error)
                setIsSubmitting(false)
                return
            }

            toast.success("تم إضافة العضو بنجاح")
            
            setNewName("")
            setNewRole("")
            setNewEmail("")
            setNewPhone("")
            setNewSpecialization("")
            setIsDialogOpen(false)
            
            router.refresh()
        } catch (error) {
            toast.error("حدث خطأ غير متوقع")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2 bg-magenta hover:bg-magenta/90 text-white">
                    <Plus className="h-4 w-4" />
                    إضافة عضو جديد
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>إضافة عضو جديد</DialogTitle>
                    <DialogDescription>
                        أدخل بيانات العضو الجديد لإضافته لفريقك.
                    </DialogDescription>
                </DialogHeader>
                <form>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="memberName">الاسم الكامل</Label>
                        <Input 
                            id="memberName" 
                            placeholder="مثال: أحمد محمود" 
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="memberRole">الدور (المنصب)</Label>
                        <Select value={newRole} onValueChange={setNewRole}>
                            <SelectTrigger className="w-full text-right" dir="rtl">
                                <SelectValue placeholder="اختر المنصب" />
                            </SelectTrigger>
                            <SelectContent dir="rtl">
                                <SelectItem value="شريك">شريك</SelectItem>
                                <SelectItem value="محامي أول">محامي أول</SelectItem>
                                <SelectItem value="محامي مساعد">محامي مساعد</SelectItem>
                                <SelectItem value="محامي متدرب">محامي متدرب</SelectItem>
                                <SelectItem value="مساعد قانوني">مساعد قانوني</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="memberEmail">البريد الإلكتروني</Label>
                        <Input 
                            id="memberEmail" 
                            type="email" 
                            placeholder="email@firm.com" 
                            dir="ltr" 
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="memberPhone">رقم الهاتف</Label>
                        <Input 
                            id="memberPhone" 
                            type="tel" 
                            placeholder="01012345678" 
                            dir="ltr" 
                            value={newPhone}
                            onChange={(e) => {
                                setNewPhone(e.target.value)
                                setPhoneError("")
                            }}
                            className={phoneError ? "border-red-500 focus-visible:ring-red-500" : ""}
                        />
                        {phoneError && <p className="text-sm text-red-500">{phoneError}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="memberSpecialty">التخصص</Label>
                        <Input 
                            id="memberSpecialty" 
                            placeholder="مثال: قانون العمل، عقارات (افتراضي: عام)" 
                            value={newSpecialization}
                            onChange={(e) => setNewSpecialization(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button 
                        type="button" 
                        disabled={isSubmitting}
                        className="w-full bg-magenta hover:bg-magenta/90 text-white"
                        onClick={handleAddMember}
                    >
                        {isSubmitting ? "جاري الإضافة..." : "إضافة العضو"}
                    </Button>
                </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export function DeleteMemberButton({ memberId }: { memberId: string }) {
    const router = useRouter()
    const [isDeleting, setIsDeleting] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)

    const confirmDelete = async () => {
        setIsDeleting(true)
        try {
            const result = await deleteLawyerAction(memberId)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success("تم الحذف بنجاح")
                setShowConfirm(false)
                router.refresh()
            }
        } catch (error) {
            toast.error("حدث خطأ")
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <>
            <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setShowConfirm(true)}
                disabled={isDeleting}
                title="حذف العضو"
            >
                <Trash2 className="h-4 w-4" />
            </Button>

            {showConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity" dir="rtl">
                    <div className="bg-background rounded-xl shadow-xl max-w-sm w-full mx-4 p-6 animate-in fade-in zoom-in duration-200">
                        <h2 className="text-xl font-bold mb-2 text-foreground">تأكيد الحذف</h2>
                        <p className="text-muted-foreground mb-6">
                            هل أنت متأكد من رغبتك في حذف هذا العضو؟ لا يمكن التراجع عن هذا الإجراء.
                        </p>
                        <div className="flex justify-end gap-3">
                            <Button 
                                variant="outline" 
                                onClick={() => setShowConfirm(false)}
                                disabled={isDeleting}
                            >
                                إلغاء
                            </Button>
                            <Button 
                                variant="destructive" 
                                onClick={confirmDelete}
                                disabled={isDeleting}
                            >
                                {isDeleting ? "جاري الحذف..." : "حذف"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
