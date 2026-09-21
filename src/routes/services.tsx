import { createFileRoute } from "@tanstack/react-router";
import { FileDown, Plus, Printer, Search, Trash2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { exportCsv, printPage } from "@/lib/export";
import { newId, todayISO, useStore } from "@/lib/store";
import { SERVICE_TYPES } from "@/lib/seed";
import type { ServiceRecord, ServiceType } from "@/lib/types";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "خدمات التوجيه — منصة التوجيه الطلابي" },
      {
        name: "description",
        content: "سجل خدمات التوجيه: مجالس أولياء الأمور، الجلسات الفردية والجماعية، والاجتماعات.",
      },
      { property: "og:title", content: "خدمات التوجيه — منصة التوجيه الطلابي" },
      {
        property: "og:description",
        content: "سجل خدمات التوجيه: مجالس أولياء الأمور، الجلسات الفردية والجماعية، والاجتماعات.",
      },
    ],
  }),
  component: ServicesPage,
});

const STATUS_OPTIONS = ["منفذ", "مجدول", "ملغي"] as const;

const TYPE_TONE: Record<string, string> = {
  "مجلس أولياء الأمور": "bg-info/15 text-info",
  "جلسة فردية": "bg-primary/10 text-primary",
  "جلسة جمعية": "bg-success/15 text-success",
  "إرشاد جمعي": "bg-primary/10 text-primary",
  "اجتماع اللجنة": "bg-warning/15 text-warning",
  "اجتماع المجلس الطلابي": "bg-warning/15 text-warning",
  "المواقف الطارئة": "bg-destructive/10 text-destructive",
};

function emptyService(): ServiceRecord {
  return {
    id: newId("sv"),
    type: "جلسة فردية",
    date: todayISO(),
    time: "09:00",
    place: "غرفة التوجيه",
    targetGroup: "",
    beneficiaries: 1,
    subject: "",
    goal: "",
    actions: "",
    recommendations: "",
    notes: "",
    attachments: "",
    owner: "",
    status: "مجدول",
  };
}

function ServicesPage() {
  const { data, setData, logActivity } = useStore();
  const [typeFilter, setTypeFilter] = useState<ServiceType | "الكل">("الكل");
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draft, setDraft] = useState<ServiceRecord>(emptyServicengSafe);
  const [isNew, setIsNew] = useState(false);

  const filtered = useMemo(
    () =>
      data.services.filter(
        (s) =>
          (typeFilter === "الكل" || s.type === typeFilter) &&
          (!query || s.subject.includes(query) || s.place.includes(query) || s.targetGroup.includes(query)),
      ),
    [data.services, typeFilter, query],
  );

  function save() {
    if (!draft.subject.trim()) {
      toast.error("الرجاء إدخال الموضوع");
      return;
    }
    setData((prev) => ({
      ...prev,
      services: prev.services.some((s) => s.id === draft.id)
        ? prev.services.map((s) => (s.id === draft.id ? draft : s))
        : [draft, ...prev.services],
    }));
    logActivity(isNew ? `تسجيل خدمة جديدة: ${draft.type} — ${draft.subject}` : `تحديث خدمة: ${draft.subject}`);
    toast.success(isNew ? "تمت الإضافة" : "تم الحفظ");
    setDialogOpen(false);
  }

  function remove(id: string) {
    setData((prev) => ({ ...prev, services: prev.services.filter((s) => s.id !== id) }));
    logActivity("حذف سجل خدمة من خدمات التوجيه");
    toast.success("تم الحذف");
  }

  const csvRows = filtered.map((s) => ({
    "نوع الخدمة": s.type,
    الموضوع: s.subject,
    التاريخ: s.date,
    الوقت: s.time,
    المكان: s.place,
    "الفئة المستهدفة": s.targetGroup,
    المستفيدون: s.beneficiaries,
    المسؤول: s.owner,
    الحالة: s.status,
  }));

  const textFields = [
    { key: "place", label: "المكان" },
    { key: "targetGroup", label: "الفئة المستهدفة" },
    { key: "owner", label: "المسؤول" },
    { key: "attachments", label: "المرفقات" },
  ] as const;
  const areaFields = [
    { key: "goal", label: "الهدف" },
    { key: "actions", label: "الإجراءات" },
    { key: "recommendations", label: "التوصيات" },
    { key: "notes", label: "الملاحظات" },
  ] as const;

  return (
    <AppShell
      title="خدمات التوجيه الطلابي"
      subtitle="مجالس أولياء الأمور، الجلسات الفردية والجماعية، الاجتماعات، والمواقف الطارئة"
      actions={
        <>
          <Button
            onClick={() => {
              setDraft(emptyService());
              setIsNew(true);
              setDialogOpen(true);
            }}
          >
            <Plus /> إضافة خدمة
          </Button>
          <Button variant="outline" onClick={printPage}>
            <Printer /> طباعة
          </Button>
          <Button variant="outline" onClick={() => { exportCsv("خدمات-التوجيه", csvRows); toast.success("تم تصدير الملف"); }}>
            <FileDown /> تصدير
          </Button>
        </>
      }
    >
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant={typeFilter === "الكل" ? "default" : "outline"} onClick={() => setTypeFilter("الكل")}>
          الكل ({data.services.length})
        </Button>
        {SERVICE_TYPES.map((t) => {
          const n = data.services.filter((s) => s.type === t).length;
          return (
            <Button key={t} size="sm" variant={typeFilter === t ? "default" : "outline"} onClick={() => setTypeFilter(t)}>
              {t} ({n})
            </Button>
          );
        })}
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="بحث بالموضوع أو المكان..."
          className="pe-9"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((s) => (
          <Card key={s.id}>
            <CardContent className="space-y-3 pt-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${TYPE_TONE[s.type] ?? ""}`}>
                  {s.type}
                </span>
                <span className="text-xs text-muted-foreground">{s.date} · {s.time}</span>
              </div>
              <p className="font-medium">{s.subject || "بدون موضوع"}</p>
              <p className="text-sm text-muted-foreground">
                {s.place} · {s.targetGroup || "—"} · {s.beneficiaries} مستفيدة
              </p>
              {s.goal && <p className="text-sm">الهدف: {s.goal}</p>}
              {s.actions && <p className="text-sm text-muted-foreground">الإجراءات: {s.actions}</p>}
              {s.recommendations && (
                <p className="text-sm text-muted-foreground">التوصيات: {s.recommendations}</p>
              )}
              <div className="flex items-center justify-between border-t border-border/60 pt-3">
                <Badge variant="secondary">{s.status}</Badge>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setDraft(s);
                      setIsNew(false);
                      setDialogOpen(true);
                    }}
                  >
                    تعديل
                  </Button>
                  <Button size="icon" variant="ghost" aria-label="حذف" onClick={() => remove(s.id)}>
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="py-10 text-center text-muted-foreground md:col-span-2">لا توجد نتائج مطابقة</p>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isNew ? "إضافة خدمة" : "تعديل الخدمة"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>نوع الخدمة</Label>
              <Select
                value={draft.type}
                onValueChange={(v) => setDraft({ ...draft, type: v as ServiceType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>الموضوع</Label>
              <Input value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>التاريخ</Label>
              <Input type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>الوقت</Label>
              <Input type="time" value={draft.time} onChange={(e) => setDraft({ ...draft, time: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>الحالة</Label>
              <Select
                value={draft.status}
                onValueChange={(v) => setDraft({ ...draft, status: v as ServiceRecord["status"] })}
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
            <div className="space-y-2">
              <Label>عدد المستفيدين</Label>
              <Input
                type="number"
                value={draft.beneficiaries}
                onChange={(e) => setDraft({ ...draft, beneficiaries: Number(e.target.value) })}
              />
            </div>
            {textFields.map((f) => (
              <div key={f.key} className="space-y-2">
                <Label>{f.label}</Label>
                <Input
                  value={draft[f.key]}
                  onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
                />
              </div>
            ))}
            {areaFields.map((f) => (
              <div key={f.key} className="space-y-2 sm:col-span-2">
                <Label>{f.label}</Label>
                <Textarea
                  rows={2}
                  value={draft[f.key]}
                  onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
            <Button onClick={save}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
