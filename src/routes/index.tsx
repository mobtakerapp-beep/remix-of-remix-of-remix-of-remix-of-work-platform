import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlarmClock,
  BookOpenCheck,
  CalendarCheck,
  ClipboardList,
  MessagesSquare,
  TrendingUp,
  UserRound,
  Users,
} from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { alerts, stats } from "@/lib/derive";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "الرئيسية — منصة التوجيه الطلابي الذكية" },
      {
        name: "description",
        content: "لوحة متابعة شاملة لأعمال التوجيه الطلابي: الطالبات والبرامج والجلسات والخطة.",
      },
      { property: "og:title", content: "الرئيسية — منصة التوجيه الطلابي الذكية" },
      {
        property: "og:description",
        content: "لوحة متابعة شاملة لأعمال التوجيه الطلابي: الطالبات والبرامج والجلسات والخطة.",
      },
    ],
  }),
  component: Dashboard,
});

function StatCard({
  label,
  value,
  icon: Icon,
  tone = "primary",
}: {
  label: string;
  value: string | number;
  icon: typeof Users;
  tone?: "primary" | "success" | "warning" | "info" | "destructive";
}) {
  const tones: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/15 text-success",
    warning: "bg-warning/15 text-warning",
    info: "bg-info/15 text-info",
    destructive: "bg-destructive/10 text-destructive",
  };
  return (
    <Card className="gap-0 p-5">
      <div className="flex items-center gap-3">
        <span className={`grid size-11 place-items-center rounded-xl ${tones[tone]}`}>
          <Icon className="size-5" />
        </span>
        <div>
          <p className="text-2xl font-bold leading-none">{value}</p>
          <p className="mt-1 text-sm text-muted-foreground">{label}</p>
        </div>
      </div>
    </Card>
  );
}

function Dashboard() {
  const { data } = useStore();
  const s = stats(data);
  const upcoming = alerts(data).slice(0, 6);

  return (
    <AppShell
      title={`مرحباً، ${data.counselor.name}`}
      subtitle="إدارة ذكية للتوجيه الطلابي والمتابعة والإرشاد المدرسي"
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="إجمالي الطالبات المتابعات" value={s.students} icon={Users} />
        <StatCard label="حالات تحتاج متابعة" value={s.needFollowUp} icon={AlarmClock} tone="destructive" />
        <StatCard label="البرامج المنفذة" value={s.programsDone} icon={BookOpenCheck} tone="success" />
        <StatCard label="البرامج المخططة" value={s.programsPlanned} icon={ClipboardList} tone="info" />
        <StatCard label="الجلسات الإرشادية" value={s.sessions} icon={MessagesSquare} tone="info" />
        <StatCard label="الاجتماعات والمجالس" value={s.meetings} icon={UserRound} />
        <StatCard label="كثيرات الغياب" value={s.absence} icon={CalendarCheck} tone="warning" />
        <StatCard label="حالات التأخر الصباحي" value={s.late} icon={AlarmClock} tone="warning" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">نسب الإنجاز</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span>إنجاز الخطة الفصلية</span>
                <span className="font-semibold">{s.planProgress}%</span>
              </div>
              <Progress value={s.planProgress} />
            </div>
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span>مهام الأسبوع المنفذة</span>
                <span className="font-semibold">
                  {s.weeklyDone} من {s.weeklyTasks}
                </span>
              </div>
              <Progress value={s.weeklyProgress} />
            </div>
            <Link to="/reports" className="inline-flex items-center gap-1.5 text-sm text-primary">
              <TrendingUp className="size-4" /> عرض التقارير التفصيلية
            </Link>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">التنبيهات المهمة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcoming.map((a) => (
              <div key={a.id} className="rounded-xl border border-border/70 p-3">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="secondary">{a.kind}</Badge>
                  <span className="text-xs text-muted-foreground">{a.date}</span>
                </div>
                <p className="mt-1.5 text-sm">{a.text}</p>
              </div>
            ))}
            {upcoming.length === 0 && (
              <p className="text-sm text-muted-foreground">لا توجد تنبيهات حالياً.</p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">آخر الأنشطة</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {data.activities.slice(0, 8).map((a) => (
                <li key={a.id} className="flex gap-3 text-sm">
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                  <span>
                    <span className="block text-xs text-muted-foreground">{a.date}</span>
                    {a.text}
                  </span>
                </li>
              ))}
              {data.activities.length === 0 && (
                <li className="text-sm text-muted-foreground">لا أنشطة مسجلة بعد.</li>
              )}
            </ol>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
