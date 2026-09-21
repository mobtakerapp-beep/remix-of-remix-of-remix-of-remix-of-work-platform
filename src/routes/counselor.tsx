import { createFileRoute } from "@tanstack/react-router";
import { FileDown, Pencil, Printer, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { exportJson, printPage } from "@/lib/export";
import { useStore } from "@/lib/store";
import type { Counselor } from "@/lib/types";

export const Route = createFileRoute("/counselor")({
  head: () => ({
    meta: [
      { title: "بيانات الموجه — منصة التوجيه الطلابي" },
      { name: "description", content: "البيانات الوظيفية للمرشدة الطلابية وبيانات المدرسة." },
      { property: "og:title", content: "بيانات الموجه — منصة التوجيه الطلابي" },
      { property: "og:description", content: "البيانات الوظيفية للمرشدة الطلابية وبيانات المدرسة." },
    ],
  }),
  component: CounselorPage,
});

const FIELDS: { key: keyof Counselor; label: string }[] = [
  { key: "name", label: "الاسم" },
  { key: "jobNumber", label: "الرقم الوظيفي" },
  { key: "school", label: "المدرسة" },
  { key: "educationAdministration", label: "الإدارة التعليمية" },
  { key: "stage", label: "المرحلة الدراسية" },
  { key: "academicYear", label: "العام الدراسي" },
  { key: "term", label: "الفصل الدراسي" },
  { key: "email", label: "البريد الإلكتروني" },
  { key: "phone", label: "رقم التواصل" },
  { key: "qualification", label: "المؤهل العلمي" },
  { key: "experienceYears", label: "سنوات الخبرة" },
];

function CounselorPage() {
  const { data, setData, logActivity } = useStore();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Counselor>(data.counselor);

  function save() {
    setData((prev) => ({ ...prev, counselor: draft }));
    logActivity("تم تحديث بيانات الموجه");
    setEditing(false);
    toast.success("تم حفظ البيانات");
  }

  const current = editing ? draft : data.counselor;

  return (
    <AppShell
      title="بيانات الموجه"
      subtitle="البيانات الوظيفية للمرشدة الطلابية"
      actions={
        <>
          {editing ? (
            <>
              <Button onClick={save}>
                <Save /> حفظ
              </Button>
              <Button variant="outline" onClick={() => { setDraft(data.counselor); setEditing(false); }}>
                إلغاء
              </Button>
            </>
          ) : (
            <Button onClick={() => { setDraft(data.counselor); setEditing(true); }}>
              <Pencil /> تعديل
            </Button>
          )}
          <Button variant="outline" onClick={printPage}>
            <Printer /> طباعة
          </Button>
          <Button variant="outline" onClick={() => exportJson("بيانات-الموجه", data.counselor)}>
            <FileDown /> تصدير
          </Button>
        </>
      }
    >
      <Card>
        <CardContent className="grid gap-5 pt-6 md:grid-cols-2 xl:grid-cols-3">
          {FIELDS.map((f) => (
            <div key={f.key} className="space-y-2">
              <Label htmlFor={f.key}>{f.label}</Label>
              {editing ? (
                <Input
                  id={f.key}
                  value={draft[f.key]}
                  onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
                />
              ) : (
                <p className="rounded-xl bg-muted/60 px-3 py-2.5 text-sm">{current[f.key] || "—"}</p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </AppShell>
  );
}
