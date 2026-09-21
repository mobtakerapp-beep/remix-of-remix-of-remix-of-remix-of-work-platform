import { createFileRoute } from "@tanstack/react-router";
import { Check, FileDown, Plus, Printer, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { exportCsv, exportJson, printPage } from "@/lib/export";
import { DAYS } from "@/lib/seed";
import { newId, todayISO, useStore } from "@/lib/store";
import type { TermPlanItem, WeeklyPlanItem } from "@/lib/types";

export const Route = createFileRoute("/plan")({
  head: () => ({
    meta: [
      { title: "خطة التوجيه — منصة التوجيه الطلابي" },
      {
        name: "description",
        content: "الخطة الفصلية والخطة الأسبوعية للتوجيه الطلابي مع متابعة الإنجاز.",
      },
      { property: "og:title", content: "خطة التوجيه — منصة التوجيه الطلابي" },
      {
        property: "og:description",
        content: "الخطة الفصلية والخطة الأسبوعية للتوجيه الطلابي مع متابعة الإنجاز.",
      },
    ],
  }),
  component: PlanPage,
});

function emptyTerm(): TermPlanItem {
  return {
    id: newId("tp"),
    term: "الفصل الدراسي الأول",
    generalGoal: "",
    detailedGoals: "",
    program: "",
    activities: "",
    targetGroup: "",
    owner: "",
    date: todayISO(),
    indicators: "",
    progress: 0,
    results: "",
    recommendations: "",
  };
}

function emptyWeekly(): WeeklyPlanItem {
  return {
    id: newId("w"),
    week: "الأسبوع الحالي",
    day: "الأحد",
    date: todayISO(),
    activity: "",
    goal: "",
    targetGroup: "",
    time: "09:00",
    owner: "",
    done: false,
    notes: "",
  };
}

function PlanPage() {
  const { data, setData, logActivity } = useStore();
  const [termDialog, setTermDialog] = useState(false);
  const [weeklyDialog, setWeeklyDialog] = useState(false);
  const [termDraft, setTermDraft] = useState<TermPlanItem>(emptyTerm);
  const [weeklyDraft, setWeeklyDraft] = useState<WeeklyPlanItem>(emptyWeekly);
  const [isNewTerm, setIsNewTerm] = useState(false);

  const weeklyProgress = data.weeklyPlan.length
    ? Math.round((data.weeklyPlan.filter((w) => w.done).length / data.weeklyPlan.length) * 100)
    : 0;
  const termProgress = data.termPlan.length
    ? Math.round(data.termPlan.reduce((a, b) => a + b.progress, 0) / data.termPlan.length)
    : 0;

  function saveTerm() {
    if (!termDraft.generalGoal.trim()) {
      toast.error("الرجاء إدخال الهدف العام");
      return;
    }
    setData((prev) => ({
      ...prev,
      termPlan: prev.termPlan.some((t) => t.id === termDraft.id)
        ? prev.termPlan.map((t) => (t.id === termDraft.id ? termDraft : t))
        : [termDraft, ...prev.termPlan],
    }));
    logActivity(`تحديث الخطة الفصلية: ${termDraft.generalGoal.slice(0, 40)}`);
    toast.success("تم الحفظ");
    setTermDialog(false);
  }

  function saveWeekly() {
    if (!weeklyDraft.activity.trim()) {
      toast.error("الرجاء إدخال النشاط");
      return;
    }
    setData((prev) => ({ ...prev, weeklyPlan: [weeklyDraft, ...prev.weeklyPlan] }));
    logActivity(`إضافة نشاط للخطة الأسبوعية: ${weeklyDraft.activity}`);
    toast.success("تمت الإضافة");
    setWeeklyDialog(false);
  }

  function toggleDone(w: WeeklyPlanItem) {
    setData((prev) => ({
      ...prev,
      weeklyPlan: prev.weeklyPlan.map((x) => (x.id === w.id ? { ...x, done: !x.done } : x)),
    }));
    if (!w.done) logActivity(`تم تنفيذ: ${w.activity}`);
  }

  const weeks = [...new Set(data.weeklyPlan.map((w) => w.week))];

  return (
    <AppShell
      title="خطة التوجيه الطلابي"
      subtitle={`الخطة الفصلية (${termProgress}٪ إنجاز) والخطة الأسبوعية (${weeklyProgress}٪ إنجاز)`}
      actions={
        <>
          <Button
            onClick={() => {
              setTermDraft(emptyTerm());
              setIsNewTerm(true);
              setTermDialog(true);
            }}
          >
            <Plus /> هدف فصلي
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setWeeklyDraft(emptyWeekly());
              setWeeklyDialog(true);
            }}
          >
            <Plus /> نشاط أسبوعي
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              exportJson("خطة-التوجيه", { termPlan: data.termPlan, weeklyPlan: data.weeklyPlan });
              toast.success("تم تصدير الملف");
            }}
          >
            <FileDown /> تصدير
          </Button>
          <Button variant="outline" onClick={printPage}>
            <Printer /> طباعة
          </Button>
        </>
      }
    >
      <Tabs defaultValue="term">
        <TabsList>
          <TabsTrigger value="term">الخطة الفصلية</TabsTrigger>
          <TabsTrigger value="weekly">الخطة الأسبوعية</TabsTrigger>
        </TabsList>

        <TabsContent value="term" className="space-y-4">
          {data.termPlan.map((t) => (
            <Card key={t.id}>
              <CardContent className="space-y-3 pt-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{t.generalGoal}</CardTitle>
                    <p className="mt-0.5 text-xs text-muted-foreground">{t.term} · {t.date}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{t.progress}٪</Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setTermDraft(t);
                        setIsNewTerm(false);
                        setTermDialog(true);
                      }}
                    >
                      تعديل
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="حذف"
                      onClick={() => {
                        setData((prev) => ({ ...prev, termPlan: prev.termPlan.filter((x) => x.id !== t.id) }));
                        toast.success("تم الحذف");
                      }}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <Progress value={t.progress} />
                <div className="grid gap-3 text-sm md:grid-cols-2">
                  <p><span className="text-muted-foreground">الأهداف التفصيلية: </span>{t.detailedGoals || "—"}</p>
                  <p><span className="text-muted-foreground">البرنامج: </span>{t.program || "—"}</p>
                  <p><span className="text-muted-foreground">الأنشطة: </span>{t.activities || "—"}</p>
                  <p><span className="text-muted-foreground">الفئة: </span>{t.targetGroup || "—"}</p>
                  <p><span className="text-muted-foreground">المسؤول: </span>{t.owner || "—"}</p>
                  <p><span className="text-muted-foreground">مؤشرات الأداء: </span>{t.indicators || "—"}</p>
                  {t.results && <p><span className="text-muted-foreground">النتائج: </span>{t.results}</p>}
                  {t.recommendations && <p><span className="text-muted-foreground">التوصيات: </span>{t.recommendations}</p>}
                </div>
              </CardContent>
            </Card>
          ))}
          {data.termPlan.length === 0 && (
            <p className="py-10 text-center text-muted-foreground">لا توجد أهداف فصلية بعد.</p>
          )}
        </TabsContent>

        <TabsContent value="weekly" className="space-y-6">
          {weeks.map((week) => {
            const items = data.weeklyPlan.filter((w) => w.week === week);
            const done = items.filter((w) => w.done).length;
            return (
              <Card key={week}>
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle className="text-base">{week}</CardTitle>
                  <span className="text-sm text-muted-foreground">
                    {done} من {items.length} — {Math.round((done / items.length) * 100)}٪
                  </span>
                </CardHeader>
                <CardContent>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-start">
                        <th className="px-2 py-2 text-start font-semibold">اليوم</th>
                        <th className="px-2 py-2 text-start font-semibold">التاريخ</th>
                        <th className="px-2 py-2 text-start font-semibold">النشاط</th>
                        <th className="px-2 py-2 text-start font-semibold">الفئة</th>
                        <th className="px-2 py-2 text-start font-semibold">الوقت</th>
                        <th className="px-2 py-2 text-start font-semibold">تم</th>
                        <th className="px-2 py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((w) => (
                        <tr key={w.id} className={`border-b border-border/60 ${w.done ? "opacity-60" : ""}`}>
                          <td className="px-2 py-2.5">{w.day}</td>
                          <td className="px-2 py-2.5">{w.date}</td>
                          <td className="px-2 py-2.5">{w.activity}</td>
                          <td className="px-2 py-2.5 text-muted-foreground">{w.targetGroup}</td>
                          <td className="px-2 py-2.5">{w.time}</td>
                          <td className="px-2 py-2.5">
                            <Button
                              size="icon"
                              variant={w.done ? "default" : "outline"}
                              aria-label={`تم تنفيذ ${w.activity}`}
                              onClick={() => toggleDone(w)}
                            >
                              <Check className="size-4" />
                            </Button>
                          </td>
                          <td className="px-2 py-2.5">
                            <Button
                              size="icon"
                              variant="ghost"
                              aria-label="حذف"
                              onClick={() => {
                                setData((prev) => ({ ...prev, weeklyPlan: prev.weeklyPlan.filter((x) => x.id !== w.id) }));
                                toast.success("تم الحذف");
                              }}
                            >
                              <Trash2 className="size-4 text-destructive" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            );
          })}
          {weeks.length === 0 && (
            <p className="py-10 text-center text-muted-foreground">لا توجد أنشطة أسبوعية بعد.</p>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={termDialog} onOpenChange={setTermDialog}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isNewTerm ? "إضافة هدف فصلي" : "تعديل الهدف الفصلي"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            {(
              [
                { key: "term", label: "الفصل الدراسي" },
                { key: "generalGoal", label: "الهدف العام" },
                { key: "detailedGoals", label: "الأهداف التفصيلية" },
                { key: "program", label: "البرنامج" },
                { key: "activities", label: "الأنشطة" },
                { key: "targetGroup", label: "الفئة المستهدفة" },
                { key: "owner", label: "المسؤول" },
                { key: "indicators", label: "مؤشرات الأداء" },
                { key: "results", label: "النتائج" },
                { key: "recommendations", label: "التوصيات" },
              ] as const
            ).map((f) => (
              <div key={f.key} className="space-y-2">
                <Label>{f.label}</Label>
                <Input
                  value={termDraft[f.key]}
                  onChange={(e) => setTermDraft({ ...termDraft, [f.key]: e.target.value })}
                />
              </div>
            ))}
            <div className="space-y-2">
              <Label>التاريخ</Label>
              <Input
                type="date"
                value={termDraft.date}
                onChange={(e) => setTermDraft({ ...termDraft, date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>نسبة الإنجاز (٪)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={termDraft.progress}
                onChange={(e) =>
                  setTermDraft({
                    ...termDraft,
                    progress: Math.min(100, Math.max(0, Number(e.target.value))),
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTermDialog(false)}>إلغاء</Button>
            <Button onClick={saveTerm}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={weeklyDialog} onOpenChange={setWeeklyDialog}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>إضافة نشاط أسبوعي</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            {(
              [
                { key: "week", label: "الأسبوع" },
                { key: "activity", label: "النشاط" },
                { key: "goal", label: "الهدف" },
                { key: "targetGroup", label: "الفئة المستهدفة" },
                { key: "owner", label: "المسؤول" },
                { key: "notes", label: "ملاحظات" },
              ] as const
            ).map((f) => (
              <div key={f.key} className="space-y-2">
                <Label>{f.label}</Label>
                <Input
                  value={weeklyDraft[f.key]}
                  onChange={(e) => setWeeklyDraft({ ...weeklyDraft, [f.key]: e.target.value })}
                />
              </div>
            ))}
            <div className="space-y-2">
              <Label>اليوم</Label>
              <select
                className="h-9 w-full rounded-xl border border-input bg-transparent px-3 text-sm"
                value={weeklyDraft.day}
                onChange={(e) => setWeeklyDraft({ ...weeklyDraft, day: e.target.value })}
              >
                {DAYS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>التاريخ</Label>
              <Input
                type="date"
                value={weeklyDraft.date}
                onChange={(e) => setWeeklyDraft({ ...weeklyDraft, date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>الوقت</Label>
              <Input
                type="time"
                value={weeklyDraft.time}
                onChange={(e) => setWeeklyDraft({ ...weeklyDraft, time: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWeeklyDialog(false)}>إلغاء</Button>
            <Button onClick={saveWeekly}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
