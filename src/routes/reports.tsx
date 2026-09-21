import { createFileRoute } from "@tanstack/react-router";
import { FileDown, Printer } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { exportJson, printPage } from "@/lib/export";
import { stats } from "@/lib/derive";
import { STUDENT_CATEGORIES } from "@/lib/seed";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "التقارير والإحصائيات — منصة التوجيه الطلابي" },
      {
        name: "description",
        content: "تقارير وإحصائيات أعمال التوجيه الطلابي: البرامج، الطالبات، الجلسات، والخطة.",
      },
      { property: "og:title", content: "التقارير والإحصائيات — منصة التوجيه الطلابي" },
      {
        property: "og:description",
        content: "تقارير وإحصائيات أعمال التوجيه الطلابي: البرامج، الطالبات، الجلسات، والخطة.",
      },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const { data } = useStore();
  const s = stats(data);
  const [period, setPeriod] = useState("all");

  const categoryData = useMemo(
    () =>
      STUDENT_CATEGORIES.map((c) => ({
        name: c,
        value: data.students.filter((st) => st.category === c).length,
      })).filter((d) => d.value > 0),
    [data.students],
  );

  const serviceData = useMemo(
    () =>
      [...new Set(data.services.map((x) => x.type))].map((t) => ({
        name: t,
        value: data.services.filter((x) => x.type === t).length,
      })),
    [data.services],
  );

  const weeklyData = useMemo(
    () =>
      [...new Set(data.weeklyPlan.map((w) => w.week))].map((week) => {
        const items = data.weeklyPlan.filter((w) => w.week === week);
        return {
          name: week,
          "منفذ": items.filter((w) => w.done).length,
          "غير منفذ": items.filter((w) => !w.done).length,
        };
      }),
    [data.weeklyPlan],
  );

  const programStatus = [
    { name: "منفذ", value: data.programs.filter((p) => p.status === "منفذ").length },
    { name: "قيد التنفيذ", value: data.programs.filter((p) => p.status === "قيد التنفيذ").length },
    { name: "مخطط", value: data.programs.filter((p) => p.status === "مخطط").length },
  ].filter((d) => d.value > 0);

  const COLORS = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)", "var(--color-chart-5)"];

  const summary = {
    الفترة: period === "all" ? "كل العام الدراسي" : period,
    "إجمالي الطالبات": s.students,
    "حالات تحتاج متابعة": s.needFollowUp,
    "البرامج المنفذة": s.programsDone,
    "البرامج المخططة": s.programsPlanned,
    "الجلسات الإرشادية": s.sessions,
    "الاجتماعات والمجالس": s.meetings,
    "إنجاز الخطة الفصلية": `${s.planProgress}%`,
    "إنجاز الخطة الأسبوعية": `${s.weeklyProgress}%`,
  };

  return (
    <AppShell
      title="التقارير والإحصائيات"
      subtitle="مؤشرات أداء التوجيه الطلابي للفصل الدراسي"
      actions={
        <>
          <select
            className="h-9 rounded-xl border border-input bg-transparent px-3 text-sm"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="all">كل العام الدراسي</option>
            <option value="الفصل الدراسي الأول">الفصل الدراسي الأول</option>
            <option value="الفصل الدراسي الثاني">الفصل الدراسي الثاني</option>
          </select>
          <Button variant="outline" onClick={printPage}>
            <Printer /> طباعة
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              exportJson("تقرير-التوجيه-الطلابي", summary);
              toast.success("تم تصدير التقرير");
            }}
          >
            <FileDown /> تصدير التقرير
          </Button>
        </>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-base">ملخص تنفيذي</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(summary).map(([k, v]) => (
            <div key={k} className="rounded-xl bg-muted/60 px-4 py-3">
              <p className="text-xs text-muted-foreground">{k}</p>
              <p className="text-lg font-bold">{v}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">الطالبات حسب التصنيف</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="var(--color-chart-1)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">حالة برامج التوجيه</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={programStatus} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                  {programStatus.map((entry, i) => (
                    <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">خدمات التوجيه حسب النوع</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={serviceData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" fill="var(--color-chart-4)" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">مقارنة تنفيذ الخطة الأسبوعية</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="منفذ" stackId="a" fill="var(--color-chart-2)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="غير منفذ" stackId="a" fill="var(--color-chart-3)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">إنجاز الأهداف الفصلية</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.termPlan.map((t) => (
            <div key={t.id}>
              <div className="mb-1.5 flex justify-between text-sm">
                <span>{t.generalGoal}</span>
                <span className="font-semibold">{t.progress}٪</span>
              </div>
              <Progress value={t.progress} />
            </div>
          ))}
        </CardContent>
      </Card>
    </AppShell>
  );
}
