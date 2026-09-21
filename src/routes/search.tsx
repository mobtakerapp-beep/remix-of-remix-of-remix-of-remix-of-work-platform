import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, Search as SearchIcon } from "lucide-react";
import { useMemo, useState } from "react";

import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { alerts } from "@/lib/derive";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === "string" ? search.q : "",
  }),
  head: () => ({
    meta: [
      { title: "البحث والتنبيهات — منصة التوجيه الطلابي" },
      {
        name: "description",
        content: "بحث عام في جميع بيانات المنصة وتنبيهات المواعيد والمتابعات والمهام.",
      },
      { property: "og:title", content: "البحث والتنبيهات — منصة التوجيه الطلابي" },
      {
        property: "og:description",
        content: "بحث عام في جميع بيانات المنصة وتنبيهات المواعيد والمتابعات والمهام.",
      },
    ],
  }),
  component: SearchPage,
});

interface Hit {
  id: string;
  section: string;
  title: string;
  detail: string;
  date: string;
  to: string;
}

function SearchPage() {
  const { q } = Route.useSearch();
  const { data } = useStore();
  const [query, setQuery] = useState(q);

  const hits = useMemo<Hit[]>(() => {
    const term = query.trim();
    if (!term) return [];
    const out: Hit[] = [];
    for (const s of data.students) {
      if ([s.name, s.grade, s.section, s.category, s.reason].some((f) => f.includes(term))) {
        out.push({
          id: `s-${s.id}`,
          section: "متابعة الطالبات",
          title: s.name,
          detail: `${s.category} — ${s.reason}`,
          date: s.startDate,
          to: `/students/${s.id}`,
        });
      }
    }
    for (const p of data.programs) {
      if ([p.name, p.goal, p.description, p.targetGroup, p.place].some((f) => f.includes(term))) {
        out.push({
          id: `p-${p.id}`,
          section: "برامج التوجيه",
          title: p.name,
          detail: `${p.goal} — ${p.status}`,
          date: p.date,
          to: `/programs/${p.id}`,
        });
      }
    }
    for (const s of data.services) {
      if ([s.type, s.subject, s.goal, s.place, s.targetGroup].some((f) => f.includes(term))) {
        out.push({
          id: `sv-${s.id}`,
          section: "خدمات التوجيه",
          title: `${s.type}: ${s.subject}`,
          detail: `${s.date} ${s.time} — ${s.place}`,
          date: s.date,
          to: "/services",
        });
      }
    }
    for (const t of data.termPlan) {
      if ([t.generalGoal, t.detailedGoals, t.program, t.activities].some((f) => f.includes(term))) {
        out.push({
          id: `tp-${t.id}`,
          section: "الخطة الفصلية",
          title: t.generalGoal,
          detail: t.program,
          date: t.date,
          to: "/plan",
        });
      }
    }
    for (const w of data.weeklyPlan) {
      if ([w.activity, w.goal, w.targetGroup, w.notes].some((f) => f.includes(term))) {
        out.push({
          id: `w-${w.id}`,
          section: "الخطة الأسبوعية",
          title: w.activity,
          detail: `${w.day} ${w.time}`,
          date: w.date,
          to: "/plan",
        });
      }
    }
    return out;
  }, [query, data]);

  const upcoming = alerts(data);

  return (
    <AppShell title="البحث والتنبيهات" subtitle="بحث عام في جميع أقسام المنصة، ومتابعة المواعيد والمهام القادمة">
      <div className="relative max-w-lg">
        <SearchIcon className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحثي في الطالبات والبرامج والجلسات والخطط..."
          className="pe-9"
          autoFocus
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            نتائج البحث {query && `(${hits.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {hits.map((h) => (
            <Link key={h.id} to={h.to} className="block rounded-xl border border-border/70 p-3 transition-colors hover:border-primary">
              <div className="flex items-center justify-between gap-2">
                <Badge variant="secondary">{h.section}</Badge>
                <span className="text-xs text-muted-foreground">{h.date}</span>
              </div>
              <p className="mt-1.5 font-medium">{h.title}</p>
              <p className="text-sm text-muted-foreground">{h.detail}</p>
            </Link>
          ))}
          {query && hits.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">لا توجد نتائج مطابقة.</p>
          )}
          {!query && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              اكتبي كلمة للبحث في جميع أقسام المنصة.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="size-4" /> التنبيهات ({upcoming.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {upcoming.map((a) => (
            <div key={a.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/70 p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{a.text}</p>
                <p className="text-xs text-muted-foreground">{a.kind}</p>
              </div>
              <Badge variant="secondary">{a.date}</Badge>
            </div>
          ))}
          {upcoming.length === 0 && (
            <p className="text-sm text-muted-foreground">لا تنبيهات حالياً.</p>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
