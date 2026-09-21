import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, FileDown, Plus, Printer } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { exportCsv, printPage } from "@/lib/export";
import { newId, todayISO, useStore } from "@/lib/store";
import type { FollowUpEntry } from "@/lib/types";

export const Route = createFileRoute("/students/$id")({
  head: () => ({
    meta: [
      { title: "سجل الطالبة — منصة التوجيه الطلابي" },
      { name: "description", content: "السجل الزمني لإجراءات المتابعة الخاصة بالطالبة." },
      { property: "og:title", content: "سجل الطالبة — منصة التوجيه الطلابي" },
      { property: "og:description", content: "السجل الزمني لإجراءات المتابعة الخاصة بالطالبة." },
    ],
  }),
  component: StudentDetail,
});

function StudentDetail() {
  const { id } = Route.useParams();
  const { data, setData, logActivity } = useStore();
  const student = data.students.find((s) => s.id === id);
  const [action, setAction] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(todayISO());

  if (!student) {
    return (
      <AppShell title="الطالبة غير موجودة">
        <Card>
          <CardContent className="flex flex-col items-start gap-3 pt-6">
            <p className="text-sm text-muted-foreground">لم يتم العثور على هذا الملف.</p>
            <Button asChild variant="outline">
              <Link to="/students">
                <ArrowRight /> العودة إلى الطالبات
              </Link>
            </Button>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  function addEntry() {
    if (!action.trim()) {
      toast.error("الرجاء إدخال الإجراء");
      return;
    }
    const entry: FollowUpEntry = { id: newId("t"), date, action, note };
    setData((prev) => ({
      ...prev,
      students: prev.students.map((s) =>
        s.id === id
          ? { ...s, timeline: [entry, ...s.timeline], lastAction: action, nextDate: s.nextDate }
          : s,
      ),
    }));
    logActivity(`تسجيل متابعة للطالبة ${student?.name ?? ""}: ${action}`);
    setAction("");
    setNote("");
    setDate(todayISO());
    toast.success("تم تسجيل المتابعة");
  }

  const csvRows = student.timeline.map((t) => ({
    التاريخ: t.date,
    الإجراء: t.action,
    الملاحظات: t.note,
  }));

  return (
    <AppShell
      title={student.name}
      subtitle={`${student.grade} / ${student.section} — ${student.category}`}
      actions={
        <>
          <Button asChild variant="ghost">
            <Link to="/students">
              <ArrowRight /> العودة
            </Link>
          </Button>
          <Button variant="outline" onClick={printPage}>
            <Printer /> طباعة
          </Button>
          <Button variant="outline" onClick={() => { exportCsv(`سجل-${student.name}`, csvRows); toast.success("تم تصدير الملف"); }}>
            <FileDown /> تصدير
          </Button>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="p-5">
          <p className="text-xs text-muted-foreground">سبب المتابعة</p>
          <p className="mt-1 text-sm font-medium">{student.reason || "—"}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-muted-foreground">المستوى</p>
          <p className="mt-1 text-sm font-medium">{student.level}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-muted-foreground">آخر إجراء</p>
          <p className="mt-1 text-sm font-medium">{student.lastAction || "—"}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-muted-foreground">الحالة</p>
          <div className="mt-1">
            <Badge variant="secondary">{student.status}</Badge>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">تسجيل إجراء متابعة جديد</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[160px_1fr_1fr_auto] md:items-end">
          <div className="space-y-2">
            <Label>التاريخ</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>الإجراء</Label>
            <Input
              value={action}
              onChange={(e) => setAction(e.target.value)}
              placeholder="مثال: جلسة إرشادية فردية"
            />
          </div>
          <div className="space-y-2">
            <Label>ملاحظات</Label>
            <Textarea rows={1} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <Button onClick={addEntry}>
            <Plus /> تسجيل
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">السجل الزمني للمتابعة</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="relative space-y-6 border-e border-border pe-6">
            {student.timeline.map((t) => (
              <li key={t.id} className="relative">
                <span className="absolute -end-[31px] top-1 size-2.5 rounded-full border-2 border-background bg-primary" />
                <p className="text-xs text-muted-foreground">{t.date}</p>
                <p className="font-medium">{t.action}</p>
                {t.note && <p className="text-sm text-muted-foreground">{t.note}</p>}
              </li>
            ))}
            {student.timeline.length === 0 && (
              <li className="text-sm text-muted-foreground">لا توجد إجراءات مسجلة بعد.</li>
            )}
          </ol>
        </CardContent>
      </Card>
    </AppShell>
  );
}
