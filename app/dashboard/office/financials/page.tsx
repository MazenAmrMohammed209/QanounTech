"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DollarSign, ArrowUp, ArrowDown, Download, FileText, CreditCard } from "lucide-react"

export default function OfficeFinancialsPage() {
    const handleExport = () => {
        const csvContent = "data:text/csv;charset=utf-8,\uFEFF"
            + "التقرير المالي للمكتب\n\n"
            + "إجمالي الإيرادات,$124,500\n"
            + "المصروفات,$42,300\n"
            + "مستحقات غير محصلة,$28,900\n\n"
            + "أحدث الفواتير\n"
            + "رقم الفاتورة,العميل,التاريخ,المبلغ,الحالة\n"
            + "INV-2024-128,شركة التقنية المتقدمة,12 مارس 2024,$15,000,متأخرة\n"
            + "INV-2024-129,أحمد بن خالد,10 مارس 2024,$3,500,مدفوعة\n"
            + "INV-2024-130,مجموعة العقارية,08 مارس 2024,$22,000,مدفوعة\n"
            + "INV-2024-131,سارة محمد,05 مارس 2024,$1,200,بانتظار الدفع\n"
            + "INV-2024-132,مؤسسة الأفق للخدمات,01 مارس 2024,$8,500,مدفوعة\n";

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "financial_report.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <DashboardLayout role="office">
            <div className="p-6 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">الماليات والفاتورة</h1>
                        <p className="text-muted-foreground mt-1">نظرة عامة على الإيرادات والمصروفات والفواتير</p>
                    </div>
                    <Button onClick={handleExport} className="gap-2 bg-green-600 hover:bg-green-700 text-white">
                        <Download className="h-4 w-4" />
                        تصدير التقرير (Excel)
                    </Button>
                </div>

                {/* Top Financial Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-gradient-to-br from-magenta/5 to-transparent border-magenta/20">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start">
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-muted-foreground">إجمالي الإيرادات (هذا الشهر)</p>
                                    <p className="text-3xl font-bold" dir="ltr">$124,500</p>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-magenta/10 flex items-center justify-center">
                                    <DollarSign className="w-5 h-5 text-magenta" />
                                </div>
                            </div>
                            <div className="mt-4 flex items-center text-sm text-green-500 gap-1">
                                <ArrowUp className="w-4 h-4" />
                                <span>+12.5% مقارنة بالشهر الماضي</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start">
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-muted-foreground">المصروفات</p>
                                    <p className="text-3xl font-bold" dir="ltr">$42,300</p>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                                    <CreditCard className="w-5 h-5 text-destructive" />
                                </div>
                            </div>
                            <div className="mt-4 flex items-center text-sm text-destructive gap-1">
                                <ArrowUp className="w-4 h-4" />
                                <span>+4.2% مقارنة بالشهر الماضي</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start">
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-muted-foreground">مستحقات غير محصلة</p>
                                    <p className="text-3xl font-bold" dir="ltr">$28,900</p>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                                    <FileText className="w-5 h-5 text-orange-500" />
                                </div>
                            </div>
                            <div className="mt-4 flex items-center text-sm text-green-500 gap-1">
                                <ArrowDown className="w-4 h-4" />
                                <span>-2.1% مقارنة بالشهر الماضي</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Invoices and Charts */}
                <div className="grid lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>أحدث الفواتير</CardTitle>
                            <CardDescription>الفواتير الصادرة حديثاً وحالتها</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-right">
                                    <thead className="bg-secondary/50 text-muted-foreground">
                                        <tr>
                                            <th className="px-4 py-3 rounded-r-lg font-medium">رقم الفاتورة</th>
                                            <th className="px-4 py-3 font-medium">العميل</th>
                                            <th className="px-4 py-3 font-medium">التاريخ</th>
                                            <th className="px-4 py-3 font-medium">المبلغ</th>
                                            <th className="px-4 py-3 rounded-l-lg font-medium">الحالة</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[
                                            { id: "INV-2024-128", client: "شركة التقنية المتقدمة", date: "12 مارس 2024", amount: "$15,000", status: "متأخرة", statusColor: "destructive" },
                                            { id: "INV-2024-129", client: "أحمد بن خالد", date: "10 مارس 2024", amount: "$3,500", status: "مدفوعة", statusColor: "accent" },
                                            { id: "INV-2024-130", client: "مجموعة العقارية", date: "08 مارس 2024", amount: "$22,000", status: "مدفوعة", statusColor: "accent" },
                                            { id: "INV-2024-131", client: "سارة محمد", date: "05 مارس 2024", amount: "$1,200", status: "بانتظار الدفع", statusColor: "orange-500" },
                                            { id: "INV-2024-132", client: "مؤسسة الأفق للخدمات", date: "01 مارس 2024", amount: "$8,500", status: "مدفوعة", statusColor: "accent" },
                                        ].map((invoice, idx) => (
                                            <tr key={idx} className="border-b border-border hover:bg-secondary/20 transition-colors">
                                                <td className="px-4 py-4 font-medium text-magenta" dir="ltr">{invoice.id}</td>
                                                <td className="px-4 py-4">{invoice.client}</td>
                                                <td className="px-4 py-4 text-muted-foreground">{invoice.date}</td>
                                                <td className="px-4 py-4 font-semibold" dir="ltr">{invoice.amount}</td>
                                                <td className="px-4 py-4 text-left">
                                                    <Badge className={`bg-${invoice.statusColor}/10 text-${invoice.statusColor} border-${invoice.statusColor}/20 break-keep`}>
                                                        {invoice.status}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>توزيع الإيرادات</CardTitle>
                            <CardDescription>الإيرادات حسب مجال الممارسة القانونية</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {[
                                { label: "قانون الشركات", value: "45%", amount: "$56,000", color: "bg-magenta" },
                                { label: "قانون العمل", value: "25%", amount: "$31,100", color: "bg-purple" },
                                { label: "عقارات", value: "20%", amount: "$24,900", color: "bg-accent" },
                                { label: "قضايا عامة", value: "10%", amount: "$12,500", color: "bg-orange-500" },
                            ].map((item, idx) => (
                                <div key={idx} className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-medium">{item.label}</span>
                                        <span className="font-semibold" dir="ltr">{item.amount}</span>
                                    </div>
                                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                        <div className={`h-full ${item.color}`} style={{ width: item.value }} />
                                    </div>
                                    <p className="text-xs text-muted-foreground">{item.value}</p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    )
}
