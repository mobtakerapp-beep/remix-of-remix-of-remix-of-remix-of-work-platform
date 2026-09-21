import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, FileDown, Pencil, Plus, Printer, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { exportCsv, printPage } from "@/lib/export";
import { newId, todayISO, useStore } from "@/lib/store";
import { STUDENT_CATEGORIES } from "@/lib/seed";
import type { Student, StudentCategory } from "@/lib/types";

export const Route = createFileRoute("/students")({
  head: () => ({
    meta: [
      { title: "متابعة الطالبات — منصة التوجيه الطلابي" },
      {
        name: "description",
        content: "متابعة الطالبات حسب التصنيفات: الموهوبات، المتفوقات، كثيرات الغياب، والتأخر.",
      },
      { property: "og:title", content: "متابعة الطالبات — منصة التوجيه الطلابي" },
      {
        property: "og:description",
        content: "متابعة الطالبات حسب التصنيفات: الموهوبات، المتفوقات، كثيرات الغياب، والتأخر.",
      },
    ],
  }),
  component: StudentsPage,
});

const STATUS_OPTIONS = ["مفتوحة", "قيد المتابعة", "مغلقة"] as const;
const LEVEL_OPTIONS = ["بسيط", "متوسط", "مرتفع"] as const;

const LEVEL_TONE: Record<string, string> = {
  "بسيط": "bg-success/15 text-success",
  "متوسط": "bg-warning/15 text-warning",
  "مرتفع": "bg-destructive/10 text-destructive",
};

function emptyStudent(): Student {
  return {
    id: newId("s"),
    name: "",
    grade: "",
    section: "",
    category: "كثيرات الغياب",
    reason: "",
    startDate: todayISO(),
    level: "متوسط",
    lastAction: "",
    nextDate: "",
    status: "مفتوحة",
    timeline: [],
  };
}

function StudentsPage() {
  const { data, setData, logActivity } = useStore();
  const [category, setCategory] = useState<StudentCategory | "الكل">("الكل");
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draft, setDraft] = useState<Student>(emptyStudent);
  const [isNew, setIsNew] = useState(false);

  const filtered = useMemo(() => {
    return data.students.filter(
      (s) =>
        (category === "الكل" || s.category === category) &&
        (!query || s.name.includes(query) || s.grade.includes(query) || s.reason.includes(query)),
    );
  }, [data.students, category, query]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { "الكل": data.students.length };
    for (const c of STUDENT_CATEGORIES) {
      map[c] = data.students.filter((s) => s.category === c).length;
    }
    return map;
  }, [data.students]);

  function saveStudent() {
    if (!draft.name.trim()) {
      toast.error("الرجاء إدخال اسم الطالبة");
      return;
    }
    setData((prev) => ({
      ...prev,
      students: prev.students.some((s) => s.id === draft.id)
        ? prev.students.map((s) => (s.id === draft.id ? draft : s))
        : [draft, ...prev.students],
    }));
    logActivity(isNew ? `إضافة طالبة جديدة: ${draft.name}` : `تحديث بيانات الطالبة: ${draft.name}`);
    toast.success(isNew ? "تمت الإضافة" : "تم الحفظ");
    setDialogOpen(false);
  }

  function removeStudent(id: string) {
    const s = data.students.find((x) => x.id === id);
    setData((prev) => ({ ...prev, students: prev.students.filter((x) => x.id !== id) }));
    logActivity(`حذف ملف الطالبة: ${s?.name ?? ""}`);
    toast.success("تم الحذف");
  }

  const csvRows = filtered.map((s) => ({
    الاسم: s.name,
    الصف: s.grade,
    الشعبة: s.section,
    التصنيف: s.category,
    السبب: s.reason,
    "تاريخ البدء": s.startDate,
    المستوى: s.level,
    "آخر إجراء": s.lastAction,
    "الموعد القادم": s.nextDate,
    الحالة: s.status,
  }));

  return (
    <AppShell
      title="متابعة الطالبات"
      subtitle="تصنيف الطالبات ومتابعة الحالات وتسجيل الإجراءات"
      actions={
        <>
          <Button
            onClick={() => {
              setDraft(emptyStudent());
              setIsNew(true);
              setDialogOpen(true);
            }}
          >
            <Plus /> إضافة طالبة
          </Button>
          <Button variant="outline" onClick={printPage}>
            <Printer /> طباعة
          </Button>
          <Button variant="outline" onClick={() => { exportCsv("متابعة-الطالبات", csvRows); toast.success("تم تصدير الملف"); }}>
            <FileDown /> تصدير
          </Button>
        </>
      }
    >
      <div className="flex flex-wrap gap-2">
        {(["الكل", ...STUDENT_CATEGORIES] as const).map((c) => (
          <Button
            key={c}
            size="sm"
            variant={category === c ? "default" : "outline"}
            onClick={() => setCategory(c)}
          >
            {c} ({counts[c] ?? 0})
          </Button>
        ))}
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="بحث بالاسم أو الصف أو السبب..."
          className="pe-9"
        />
      </div>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-start">
                <th className="px-4 py-3 text-start font-semibold">الطالبة</th>
                <th className="px-4 py-3 text-start font-semibold">الصف/الشعبة</th>
                <th className="px-4 py-3 text-start font-semibold">التصنيف</th>
                <th className="px-4 py-3 text-start font-semibold">السبب</th>
                <th className="px-4 py-3 text-start font-semibold">المستوى</th>
                <th className="px-4 py-3 text-start font-semibold">آخر إجراء</th>
                <th className="px-4 py-3 text-start font-semibold">الموعد القادم</th>
                <th className="px-4 py-3 text-start font-semibold">الحالة</th>
                <th className="px-4 py-3 text-start font-semibold">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-b border-border/60 hover:bg-muted/40">
                  <td className="px-4 py-3 font-medium">
                    <Link
                      to="/students/$id"
                      params={{ id: s.id }}
                      className="hover:text-primary hover:underline"
                    >
                      {s.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{s.grade} / {s.section}</td>
                  <td className="px-4 py-3">{s.category}</td>
                  <td className="max-w-40 truncate px-4 py-3 text-muted-foreground">{s.reason}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${LEVEL_TONE[s.level]}`}>{s.level}</span>
                  </td>
                  <td className="max-w-40 truncate px-4 py-3 text-muted-foreground">{s.lastAction || "—"}</td>
                  <td className="px-4 py-3">{s.nextDate || "—"}</td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary">{s.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`تعديل ${s.name}`}
                        onClick={() => {
                          setDraft(s);
                          setIsNew(false);
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`حذف ${s.name}`}
                        onClick={() => removeStudent(s.id)}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-muted-foreground">
                    لا توجد نتائج مطابقة
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isNew ? "إضافة طالبة" : "تعديل بيانات الطالبة"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            {(
              [
                { key: "name", label: "الاسم", type: "text" },
                { key: "grade", label: "الصف", type: "text" },
                { key: "section", label: "الشعبة", type: "text" },
                { key: "reason", label: "سبب المتابعة", type: "text" },
                { key: "startDate", label: "تاريخ البدء", type: "date" },
                { key: "nextDate", label: "الموعد القادم", type: "date" },
                { key: "lastAction", label: "آخر إجراء", type: "text" },
              ] as const
            ).map((f) => (
              <div key={f.key} className="space-y-2">
                <Label>{f.label}</Label>
                <Input
                  type={f.type}
                  value={draft[f.key]}
                  onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
                />
              </div>
            ))}
            <div className="space-y-2">
              <Label>التصنيف</Label>
              <Select
                value={draft.category}
                onValueChange={(v) => setDraft({ ...draft, category: v as StudentCategory })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STUDENT_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>المستوى</Label>
              <Select
                value={draft.level}
                onValueChange={(v) => setDraft({ ...draft, level: v as Student["level"] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEVEL_OPTIONS.map((l) => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>الحالة</Label>
              <Select
                value={draft.status}
                onValueChange={(v) => setDraft({ ...draft, status: v as Student["status"] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((st) => (
                    <SelectItem key={st} value={st}>{st}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
            <Button onClick={saveStudent}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <ArrowRight className="size-3.5" /> اضغطي اسم الطالبة لفتح سجل المتابعة التفصيلي.
      </p>
    </AppShell>
  );
}
