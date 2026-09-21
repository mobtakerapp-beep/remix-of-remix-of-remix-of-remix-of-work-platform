import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { calendarEvents } from "@/lib/derive";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "التقويم والمواعيد — منصة التوجيه الطلابي" },
      {
        name: "description",
        content: "تقويم تفاعلي لبرامج التوجيه والجلسات والاجتماعات والمواعيد القادمة.",
      },
      { property: "og:title", content: "التقويم والمواعيد — منصة التوجيه الطلابي" },
      {
        property: "og:description",
        content: "تقويم تفاعلي لبرامج التوجيه والجلسات والاجتماعات والمواعيد القادمة.",
      },
    ],
  }),
  component: CalendarPage,
});

const MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

const TYPE_TONE: Record<string, string> = {
  "برنامج": "bg-primary text-primary-foreground",
  "خدمة": "bg-info text-info-foreground",
  "خطة أسبوعية": "bg-success text-success-foreground",
  "متابعة": "bg-warning text-warning-foreground",
};

function CalendarPage() {
  const { data } = useStore();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState<string | null>(null);

  const events = useMemo(() => calendarEvents(data), [data]);

  const byDate = useMemo(() => {
    const map = new Map<string, typeof events>();
    for (const e of events) {
      const list = map.get(e.date) ?? [];
      list.push(e);
      map.set(e.date, list);
    }
    return map;
  }, [events]);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(year - 1); } else setMonth(month - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(year + 1); } else setMonth(month + 1);
  }

  const selectedEvents = selected ? byDate.get(selected) ?? [] : [];
  const dayNames = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

  return (
    <AppShell title="التقويم والمواعيد" subtitle="البرامج والجلسات والاجتماعات والمتابعات القادمة — اضغطي أي يوم لعرض تفاصيله">
      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <Card>
          <CardContent className="pt-6">
            <div className="mb-4 flex items-center justify-between">
              <Button variant="outline" size="icon" onClick={prevMonth} aria-label="الشهر السابق">
                <ChevronRight className="size-4" />
              </Button>
              <p className="font-display text-lg font-bold">
                {MONTHS[month]} {year}
              </p>
              <Button variant="outline" size="icon" onClick={nextMonth} aria-label="الشهر التالي">
                <ChevronLeft className="size-4" />
              </Button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
              {dayNames.map((d) => (
                <div key={d} className="py-2 font-medium">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const dayEvents = byDate.get(iso) ?? [];
                const isToday = iso === today.toISOString().slice(0, 10);
                return (
                  <button
                    key={iso}
                    onClick={() => dayEvents.length > 0 && setSelected(iso)}
                    className={`min-h-16 rounded-xl border p-1.5 text-start align-top transition-colors ${
                      isToday ? "border-primary" : "border-border/60"
                    } ${dayEvents.length > 0 ? "cursor-pointer bg-muted/50 hover:bg-muted" : ""}`}
                  >
                    <span className={`text-xs ${isToday ? "font-bold text-primary" : ""}`}>{day}</span>
                    <div className="mt-1 flex flex-wrap gap-0.5">
                      {dayEvents.slice(0, 3).map((e) => (
                        <span
                          key={e.id}
                          title={e.title}
                          className={`size-1.5 rounded-full ${TYPE_TONE[e.type] ?? "bg-muted-foreground"}`}
                        />
                      ))}
                      {dayEvents.length > 3 && (
                        <span className="text-[10px] text-muted-foreground">+{dayEvents.length - 3}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <p className="mb-3 text-sm font-semibold">
                {selected ? `مواعيد يوم ${selected}` : "اختاري يومًا لعرض مواعيده"}
              </p>
              <div className="space-y-3">
                {selectedEvents.map((e) => (
                  <div key={e.id} className="rounded-xl border border-border/70 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <Badge className={TYPE_TONE[e.type]}>{e.type}</Badge>
                    </div>
                    <p className="mt-1.5 text-sm font-medium">{e.title}</p>
                    <p className="text-xs text-muted-foreground">{e.details}</p>
                  </div>
                ))}
                {selected && selectedEvents.length === 0 && (
                  <p className="text-sm text-muted-foreground">لا مواعيد في هذا اليوم.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="mb-3 text-sm font-semibold">المواعيد القادمة</p>
              <div className="space-y-2">
                {events.slice(0, 8).map((e) => (
                  <div key={e.id} className="flex items-center gap-2 text-sm">
                    <span className={`size-2 shrink-0 rounded-full ${TYPE_TONE[e.type] ?? ""}`} />
                    <span className="min-w-0 flex-1 truncate">{e.title}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{e.date}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={Boolean(selected)} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>مواعيد يوم {selected}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {selectedEvents.map((e) => (
              <div key={e.id} className="rounded-xl border border-border/70 p-3">
                <Badge className={TYPE_TONE[e.type]}>{e.type}</Badge>
                <p className="mt-1.5 text-sm font-medium">{e.title}</p>
                <p className="text-xs text-muted-foreground">{e.details}</p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
