import type { AppData } from "./types";

export function stats(d: AppData) {
  const sessions = d.services.filter((s) => s.type === "جلسة فردية" || s.type === "جلسة جمعية");
  const meetings = d.services.filter(
    (s) =>
      s.type === "اجتماع اللجنة" ||
      s.type === "اجتماع المجلس الطلابي" ||
      s.type === "مجلس أولياء الأمور",
  );
  const weeklyDone = d.weeklyPlan.filter((w) => w.done).length;
  return {
    students: d.students.length,
    needFollowUp: d.students.filter((s) => s.status !== "مغلقة").length,
    programsDone: d.programs.filter((p) => p.status === "منفذ").length,
    programsPlanned: d.programs.filter((p) => p.status === "مخطط").length,
    sessions: sessions.length,
    meetings: meetings.length,
    absence: d.students.filter((s) => s.category === "كثيرات الغياب").length,
    late: d.students.filter((s) => s.category === "التأخر").length,
    weeklyTasks: d.weeklyPlan.length,
    weeklyDone,
    weeklyProgress: d.weeklyPlan.length
      ? Math.round((weeklyDone / d.weeklyPlan.length) * 100)
      : 0,
    planProgress: d.termPlan.length
      ? Math.round(d.termPlan.reduce((a, b) => a + b.progress, 0) / d.termPlan.length)
      : 0,
  };
}

export interface Alert {
  id: string;
  text: string;
  date: string;
  kind: "متابعة" | "موعد" | "مهمة";
}

export function alerts(d: AppData): Alert[] {
  const out: Alert[] = [];
  const today = new Date().toISOString().slice(0, 10);
  for (const s of d.students) {
    if (s.status !== "مغلقة" && s.nextDate) {
      out.push({
        id: `st-${s.id}`,
        text: `متابعة الطالبة ${s.name} (${s.category})`,
        date: s.nextDate,
        kind: "متابعة",
      });
    }
  }
  for (const s of d.services) {
    if (s.status === "مجدول") {
      out.push({ id: `sv-${s.id}`, text: `${s.type}: ${s.subject}`, date: s.date, kind: "موعد" });
    }
  }
  for (const p of d.programs) {
    if (p.status !== "منفذ") {
      out.push({ id: `pr-${p.id}`, text: `برنامج ${p.name} (${p.status})`, date: p.date, kind: "موعد" });
    }
  }
  for (const w of d.weeklyPlan) {
    if (!w.done) {
      out.push({ id: `wk-${w.id}`, text: `${w.activity} - ${w.day}`, date: w.date, kind: "مهمة" });
    }
  }
  return out
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .filter((a) => !a.date || a.date >= today.slice(0, 4) + "-01-01");
}

export interface CalendarEvent {
  id: string;
  date: string;
  title: string;
  type: string;
  details: string;
}

export function calendarEvents(d: AppData): CalendarEvent[] {
  const out: CalendarEvent[] = [];
  for (const p of d.programs) {
    out.push({
      id: `p-${p.id}`,
      date: p.date,
      title: p.name,
      type: "برنامج",
      details: `${p.goal} — ${p.place} — ${p.status}`,
    });
  }
  for (const s of d.services) {
    out.push({
      id: `s-${s.id}`,
      date: s.date,
      title: `${s.type}: ${s.subject}`,
      type: "خدمة",
      details: `${s.time} — ${s.place} — ${s.status}`,
    });
  }
  for (const w of d.weeklyPlan) {
    out.push({
      id: `w-${w.id}`,
      date: w.date,
      title: w.activity,
      type: "خطة أسبوعية",
      details: `${w.day} ${w.time} — ${w.targetGroup}${w.done ? " — تم التنفيذ" : ""}`,
    });
  }
  for (const s of d.students) {
    if (s.nextDate) {
      out.push({
        id: `st-${s.id}`,
        date: s.nextDate,
        title: `متابعة: ${s.name}`,
        type: "متابعة",
        details: `${s.category} — ${s.reason}`,
      });
    }
  }
  return out.filter((e) => e.date).sort((a, b) => (a.date < b.date ? -1 : 1));
}
