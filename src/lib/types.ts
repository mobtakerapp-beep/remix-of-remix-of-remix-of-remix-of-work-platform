export type ID = string;

export interface Counselor {
  name: string;
  jobNumber: string;
  school: string;
  educationAdministration: string;
  stage: string;
  academicYear: string;
  term: string;
  email: string;
  phone: string;
  qualification: string;
  experienceYears: string;
}

export interface Program {
  id: ID;
  name: string;
  icon: string;
  goal: string;
  targetGroup: string;
  date: string;
  duration: string;
  beneficiaries: number;
  place: string;
  owner: string;
  description: string;
  activities: string;
  attachments: string;
  progress: number;
  notes: string;
  results: string;
  status: "منفذ" | "قيد التنفيذ" | "مخطط";
}

export type StudentCategory =
  | "الموهوبات"
  | "المتفوقات"
  | "كثيرات الغياب"
  | "التأخر"
  | "الضعيفات"
  | "الظروف الخاصة"
  | "الأيتام";

export interface FollowUpEntry {
  id: ID;
  date: string;
  action: string;
  note: string;
}

export interface Student {
  id: ID;
  name: string;
  grade: string;
  section: string;
  category: StudentCategory;
  reason: string;
  startDate: string;
  level: "بسيط" | "متوسط" | "مرتفع";
  lastAction: string;
  nextDate: string;
  status: "مفتوحة" | "قيد المتابعة" | "مغلقة";
  timeline: FollowUpEntry[];
}

export type ServiceType =
  | "مجلس أولياء الأمور"
  | "جلسة فردية"
  | "جلسة جمعية"
  | "إرشاد جمعي"
  | "اجتماع اللجنة"
  | "اجتماع المجلس الطلابي"
  | "المواقف الطارئة";

export interface ServiceRecord {
  id: ID;
  type: ServiceType;
  date: string;
  time: string;
  place: string;
  targetGroup: string;
  beneficiaries: number;
  subject: string;
  goal: string;
  actions: string;
  recommendations: string;
  notes: string;
  attachments: string;
  owner: string;
  status: "منفذ" | "مجدول" | "ملغي";
}

export interface TermPlanItem {
  id: ID;
  term: string;
  generalGoal: string;
  detailedGoals: string;
  program: string;
  activities: string;
  targetGroup: string;
  owner: string;
  date: string;
  indicators: string;
  progress: number;
  results: string;
  recommendations: string;
}

export interface WeeklyPlanItem {
  id: ID;
  week: string;
  day: string;
  date: string;
  activity: string;
  goal: string;
  targetGroup: string;
  time: string;
  owner: string;
  done: boolean;
  notes: string;
}

export interface SchoolSettings {
  schoolName: string;
  logoUrl: string;
  academicYear: string;
  term: string;
  notifyAppointments: boolean;
  notifyFollowUps: boolean;
  notifyTasks: boolean;
}

export interface AppUser {
  id: ID;
  name: string;
  role: "مديرة" | "مرشدة طلابية" | "معلمة" | "مشرفة";
  email: string;
  active: boolean;
}

export interface AppData {
  counselor: Counselor;
  programs: Program[];
  students: Student[];
  services: ServiceRecord[];
  termPlan: TermPlanItem[];
  weeklyPlan: WeeklyPlanItem[];
  settings: SchoolSettings;
  users: AppUser[];
  activities: { id: ID; date: string; text: string }[];
}
