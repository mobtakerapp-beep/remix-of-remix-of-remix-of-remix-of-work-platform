import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Briefcase,
  Compass,
  FileDown,
  Globe,
  HeartHandshake,
  LifeBuoy,
  Plus,
  Printer,
  Rocket,
  ShieldCheck,
  Smile,
  Brain,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { exportCsv, printPage } from "@/lib/export";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/programs")({
  head: () => ({
    meta: [
      { title: "برامج التوجيه — منصة التوجيه الطلابي" },
      {
        name: "description",
        content: "البرامج التسعة للتوجيه الطلابي: الأهداف، الفئات، التنفيذ، النتائج والتوصيات.",
      },
      { property: "og:title", content: "برامج التوجيه — منصة التوجيه الطلابي" },
      {
        property: "og:description",
        content: "البرامج التسعة للتوجيه الطلابي: الأهداف، الفئات، التنفيذ، النتائج والتوصيات.",
      },
    ],
  }),
  component: ProgramsPage,
});

const ICONS: Record<string, LucideIcon> = {
  Compass,
  Briefcase,
  HeartHandshake,
  Brain,
  Rocket,
  Smile,
  ShieldCheck,
  Globe,
  LifeBuoy,
};

const STATUS_TONE: Record<string, string> = {
  "منفذ": "bg-success/15 text-success",
  "قيد التنفيذ": "bg-info/15 text-info",
  "مخطط": "bg-warning/15 text-warning",
};

function ProgramsPage() {
  const { data } = useStore();

  const csvRows = data.programs.map((p) => ({
    البرنامج: p.name,
    الهدف: p.goal,
    "الفئة المستهدفة": p.targetGroup,
    التاريخ: p.date,
    المدة: p.duration,
    المستفيدون: p.beneficiaries,
    المكان: p.place,
    المسؤول: p.owner,
    الحالة: p.status,
    "نسبة الإنجاز": `${p.progress}%`,
  }));

  return (
    <AppShell
      title="برامج التوجيه"
      subtitle="البرامج التسعة المعتمدة للتوجيه الطلابي — اضغطي أي برنامج لعرض تفاصيله وتحريرها"
      actions={
        <>
          <Button variant="outline" onClick={printPage}>
            <Printer /> طباعة
          </Button>
          <Button variant="outline" onClick={() => { exportCsv("برامج-التوجيه", csvRows); toast.success("تم تصدير الملف"); }}>
            <FileDown /> تصدير
          </Button>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.programs.map((p) => {
          const Icon = ICONS[p.icon] ?? Compass;
          return (
            <Link key={p.id} to="/programs/$id" params={{ id: p.id }} className="group">
              <Card className="h-full transition-shadow group-hover:shadow-md">
                <CardHeader className="flex-row items-center gap-3">
                  <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="truncate text-base">{p.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">{p.date} · {p.place}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_TONE[p.status] ?? ""}`}>
                    {p.status}
                  </span>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="line-clamp-2 min-h-10 text-sm text-muted-foreground">{p.goal}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>الفئة: {p.targetGroup}</span>
                    <span>{p.beneficiaries} مستفيدة</span>
                  </div>
                  <div>
                    <div className="mb-1.5 flex justify-between text-xs">
                      <span className="text-muted-foreground">نسبة الإنجاز</span>
                      <span className="font-semibold">{p.progress}%</span>
                    </div>
                    <Progress value={p.progress} />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
        <Link to="/plan" className="group">
          <Card className="flex h-full min-h-40 items-center justify-center border-dashed transition-colors group-hover:border-primary">
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <Plus className="size-4" /> إضافة برنامج جديد من الخطة
            </span>
          </Card>
        </Link>
      </div>
    </AppShell>
  );
}
