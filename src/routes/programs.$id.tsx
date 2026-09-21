import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, FileDown, Pencil, Printer, Save, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { exportJson, printPage } from "@/lib/export";
import { newId, useStore } from "@/lib/store";
import type { Program } from "@/lib/types";

export const Route = createFileRoute("/programs/$id")({
  head: () => ({
    meta: [
      { title: "تفاصيل البرنامج — منصة التوجيه الطلابي" },
      { name: "description", content: "تفاصيل برنامج التوجيه الطلابي وتحرير بياناته." },
      { property: "og:title", content: "تفاصيل البرنامج — منصة التوجيه الطلابي" },
      { property: "og:description", content: "تفاصيل برنامج التوجيه الطلابي وتحرير بياناته." },
    ],
  }),
  component: ProgramDetail,
});

const STATUS_OPTIONS = ["منفذ", "قيد التنفيذ", "مخطط"] as const;

function emptyProgram(): Program {
  return {
    id: newId("p"),
    name: "برنامج جديد",
    icon: "Compass",
    goal: "",
    targetGroup: "",
    date: new Date().toISOString().slice(0, 10),
    duration: "",
    beneficiaries: 0,
    place: "",
    owner: "",
    description: "",
    activities: "",
    attachments: "",
    progress: 0,
    notes: "",
    results: "",
    status: "مخطط",
  };
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function ProgramDetail() {
  const { id } = Route.useParams();
  const { data, setData, logActivity } = useStore();
  const program = data.programs.find((p) => p.id === id);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Program>(program ?? emptyProgram());

  if (!program) {
    return (
      <AppShell title="البرنامج غير موجود">
        <Card>
          <CardContent className="flex flex-col items-start gap-3 pt-6">
            <p className="text-sm text-muted-foreground">لم يتم العثور على هذا البرنامج.</p>
            <Button asChild variant="outline">
              <Link to="/programs">
                <ArrowRight /> العودة إلى البرامج
              </Link>
            </Button>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  const current = editing ? draft : program;

  function save() {
    setData((prev) => ({
      ...prev,
      programs: prev.programs.some((p) => p.id === id)
        ? prev.programs.map((p) => (p.id === id ? draft : p))
        : [draft, ...prev.programs],
    }));
    logActivity(`تم حفظ برنامج: ${draft.name}`);
    setEditing(false);
    toast.success("تم حفظ البرنامج");
  }

  function remove() {
    setData((prev) => ({ ...prev, programs: prev.programs.filter((p) => p.id !== id) }));
    logActivity(`تم حذف برنامج: ${draft.name}`);
    toast.success("تم حذف البرنامج");
  }

  const set = (key: keyof Program, value: string | number) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const textFields: { key: keyof Program; label: string }[] = [
    { key: "targetGroup", label: "الفئة المستهدفة" },
    { key: "duration", label: "المدة" },
    { key: "place", label: "المكان" },
    { key: "owner", label: "المسؤول" },
    { key: "attachments", label: "المرفقات" },
  ];
  const areaFields: { key: keyof Program; label: string }[] = [
    { key: "goal", label: "الهدف" },
    { key: "description", label: "الوصف" },
    { key: "activities", label: "الأنشطة" },
    { key: "notes", label: "الملاحظات" },
    { key: "results", label: "النتائج والتوصيات" },
  ];

  return (
    <AppShell
      title={program.name}
      subtitle="تفاصيل برنامج التوجيه الطلابي"
      actions={
        <>
          <Button asChild variant="ghost">
            <Link to="/programs">
              <ArrowRight /> العودة
            </Link>
          </Button>
          {editing ? (
            <>
              <Button onClick={save}>
                <Save /> حفظ
              </Button>
              <Button variant="outline" onClick={() => { setDraft(program); setEditing(false); }}>
                إلغاء
              </Button>
            </>
          ) : (
            <Button onClick={() => { setDraft(program); setEditing(true); }}>
              <Pencil /> تعديل
            </Button>
          )}
          <Button variant="outline" onClick={printPage}>
            <Printer /> طباعة
          </Button>
          <Button variant="outline" onClick={() => exportJson(`برنامج-${program.name}`, program)}>
            <FileDown /> تصدير
          </Button>
          <Button variant="destructive" onClick={remove}>
            <Trash2 /> حذف
          </Button>
        </>
      }
    >
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">البيانات الأساسية</CardTitle>
          <Badge variant="secondary">{current.status}</Badge>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          <Field label="اسم البرنامج">
            {editing ? <Input value={draft.name} onChange={(e) => set("name", e.target.value)} /> : <p className="text-sm">{current.name}</p>}
          </Field>
          <Field label="التاريخ">
            {editing ? (
              <Input type="date" value={draft.date} onChange={(e) => set("date", e.target.value)} />
            ) : (
              <p className="text-sm">{current.date}</p>
            )}
          </Field>
          {textFields.map((f) => (
            <Field key={f.key} label={f.label}>
              {editing ? (
                <Input value={String(draft[f.key])} onChange={(e) => set(f.key, e.target.value)} />
              ) : (
                <p className="text-sm">{String(current[f.key]) || "—"}</p>
              )}
            </Field>
          ))}
          <Field label="عدد المستفيدين">
            {editing ? (
              <Input
                type="number"
                value={draft.beneficiaries}
                onChange={(e) => set("beneficiaries", Number(e.target.value))}
              />
            ) : (
              <p className="text-sm">{current.beneficiaries}</p>
            )}
          </Field>
          <Field label="الحالة">
            {editing ? (
              <Select value={draft.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm">{current.status}</p>
            )}
          </Field>
          <Field label="نسبة الإنجاز (٪)">
            {editing ? (
              <Input
                type="number"
                min={0}
                max={100}
                value={draft.progress}
                onChange={(e) => set("progress", Math.min(100, Math.max(0, Number(e.target.value))))}
              />
            ) : (
              <div className="pt-2">
                <Progress value={current.progress} />
                <p className="mt-1 text-xs text-muted-foreground">{current.progress}%</p>
              </div>
            )}
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">الأهداف والوصف والنتائج</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          {areaFields.map((f) => (
            <Field key={f.key} label={f.label}>
              {editing ? (
                <Textarea
                  rows={3}
                  value={String(draft[f.key])}
                  onChange={(e) => set(f.key, e.target.value)}
                />
              ) : (
                <p className="min-h-10 whitespace-pre-wrap rounded-xl bg-muted/60 px-3 py-2.5 text-sm">
                  {String(current[f.key]) || "—"}
                </p>
              )}
            </Field>
          ))}
        </CardContent>
      </Card>
    </AppShell>
  );
}
