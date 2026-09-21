import { createFileRoute } from "@tanstack/react-router";
import { Download, FileDown, Moon, RotateCcw, Sun, Trash2, Upload, UserPlus } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { createSeedData } from "@/lib/seed";
import { exportJson } from "@/lib/export";
import { newId, useStore } from "@/lib/store";
import type { AppUser, UserRole } from "@/lib/types";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "الإعدادات — منصة التوجيه الطلابي" },
      {
        name: "description",
        content: "إعدادات المنصة: بيانات المدرسة، المظهر، النسخ الاحتياطي، والمستخدمون.",
      },
      { property: "og:title", content: "الإعدادات — منصة التوجيه الطلابي" },
      {
        property: "og:description",
        content: "إعدادات المنصة: بيانات المدرسة، المظهر، النسخ الاحتياطي، والمستخدمون.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { data, setData, theme, toggleTheme, resetData, importData, logActivity } = useStore();
  const fileInput = useRef<HTMLInputElement>(null);
  const [settings, setSettings] = useState(data.settings);

  function saveSettings() {
    setData((prev) => ({ ...prev, settings }));
    logActivity("تحديث إعدادات المنصة");
    toast.success("تم حفظ الإعدادات");
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const ok = importData(String(reader.result));
      toast[ok ? "success" : "error"](ok ? "تم استيراد البيانات" : "تعذر قراءة الملف");
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  return (
    <AppShell title="الإعدادات" subtitle="بيانات المدرسة، المظهر، المستخدمون، والنسخ الاحتياطي">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">بيانات المدرسة والعام الدراسي</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {(
            [
              { key: "schoolName", label: "اسم المدرسة" },
              { key: "academicYear", label: "العام الدراسي" },
              { key: "term", label: "الفصل الدراسي" },
              { key: "logoUrl", label: "رابط شعار المدرسة (اختياري)" },
            ] as const
          ).map((f) => (
            <div key={f.key} className="space-y-2">
              <Label>{f.label}</Label>
              <Input
                value={settings[f.key]}
                onChange={(e) => setSettings({ ...settings, [f.key]: e.target.value })}
              />
            </div>
          ))}
          <div className="md:col-span-2">
            <Button onClick={saveSettings}>حفظ</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">إعدادات الإشعارات</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(
            [
              { key: "notifyAppointments", label: "تنبيهات المواعيد القادمة" },
              { key: "notifyFollowUps", label: "تنبيهات المتابعات المستحقة" },
              { key: "notifyTasks", label: "تنبيهات المهام غير المكتملة" },
            ] as const
          ).map((f) => (
            <div key={f.key} className="flex items-center justify-between">
              <Label htmlFor={f.key}>{f.label}</Label>
              <Switch
                id={f.key}
                checked={settings[f.key]}
                onCheckedChange={(v) => setSettings({ ...settings, [f.key]: v })}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">المظهر</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Label>وضع العرض الحالي</Label>
            <Button variant="outline" onClick={toggleTheme}>
              {theme === "dark" ? (
                <>
                  <Sun /> التبديل إلى الفاتح
                </>
              ) : (
                <>
                  <Moon /> التبديل إلى الداكن
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <UsersCard />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">النسخ الاحتياطي واستيراد وتصدير البيانات</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => {
              exportJson("نسخة-احتياطية-كاملة", data);
              toast.success("تم تنزيل النسخة الاحتياطية");
            }}
          >
            <Download /> تنزيل نسخة احتياطية
          </Button>
          <Button variant="outline" onClick={() => fileInput.current?.click()}>
            <Upload /> استيراد نسخة
          </Button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={handleImport}
          />
          <Button
            variant="outline"
            onClick={() => {
              exportJson("بيانات-المنصة", {
                programs: data.programs,
                students: data.students,
                services: data.services,
              });
              toast.success("تم تصدير البيانات");
            }}
          >
            <FileDown /> تصدير البيانات
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              resetData();
              setSettings(createDefaultSettings());
              toast.success("تمت استعادة الإعدادات الافتراضية");
            }}
          >
            <RotateCcw /> تفريغ جميع البيانات
          </Button>
          <HandoverButton />
          <p className="text-xs text-muted-foreground">
            «تسليم المنصة» يمسح كل الحسابات والبيانات ويرجّع شاشة إنشاء حساب المديرة، عشان صاحبة المنصة
            تنشئ حسابها بنفسها.
          </p>
        </CardContent>
      </Card>
    </AppShell>
  );
}

function HandoverButton() {
  const { isManager, resetData, signOut } = useStore();
  if (!isManager) return null;
  return (
    <Button
      variant="destructive"
      onClick={() => {
        if (!confirm("سيتم مسح كل الحسابات والبيانات وتسليم المنصة لصاحبتها. متأكدة؟")) return;
        resetData();
        signOut();
      }}
    >
      <RotateCcw /> تسليم المنصة (بدء من الصفر)
    </Button>
  );
}

function UsersCard() {
  const { data, setData, currentUser, isManager, logActivity } = useStore();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("مرشدة طلابية");

  if (!isManager) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">حسابي</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p className="font-medium">{currentUser?.name}</p>
          <p className="text-muted-foreground">{currentUser?.role}</p>
          <p className="text-xs text-muted-foreground">
            تظهر لك ملفات الطالبات المسجلة باسمك فقط. إدارة المستخدمين متاحة للمديرة.
          </p>
        </CardContent>
      </Card>
    );
  }

  function addUser() {
    if (!name.trim() || code.trim().length < 4) {
      toast.error("أدخلي الاسم وكود دخول من 4 أرقام أو أكثر");
      return;
    }
    if (data.users.some((u) => u.code.trim() === code.trim())) {
      toast.error("كود الدخول مستخدم مسبقاً");
      return;
    }
    const user: AppUser = {
      id: newId("u"),
      name: name.trim(),
      role,
      code: code.trim(),
      email: email.trim(),
      active: true,
    };
    setData((prev) => ({ ...prev, users: [...prev.users, user] }));
    logActivity(`إضافة مستخدمة: ${user.name}`);
    toast.success("تمت إضافة المستخدمة");
    setName("");
    setCode("");
    setEmail("");
    setRole("مرشدة طلابية");
  }

  function toggleActive(id: string) {
    setData((prev) => ({
      ...prev,
      users: prev.users.map((u) => (u.id === id ? { ...u, active: !u.active } : u)),
    }));
  }

  function removeUser(id: string) {
    setData((prev) => ({ ...prev, users: prev.users.filter((u) => u.id !== id) }));
    toast.success("تم حذف المستخدمة");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">المستخدمون والصلاحيات</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {data.users.map((u) => (
            <div
              key={u.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/70 px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium">{u.name}</p>
                <p className="text-xs text-muted-foreground">
                  كود الدخول: {u.code}
                  {u.email ? ` · ${u.email}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{u.role}</Badge>
                <Badge variant={u.active ? "default" : "outline"}>{u.active ? "نشط" : "موقوف"}</Badge>
                {u.id !== currentUser?.id && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => toggleActive(u.id)}>
                      {u.active ? "إيقاف" : "تنشيط"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => removeUser(u.id)}>
                      <Trash2 />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-3 border-t border-border/60 pt-4 md:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="nu-name">الاسم</Label>
            <Input id="nu-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nu-code">كود الدخول</Label>
            <Input id="nu-code" value={code} onChange={(e) => setCode(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>البريد (اختياري)</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>الصلاحية</Label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="مرشدة طلابية">مرشدة طلابية</option>
              <option value="مديرة">مديرة</option>
            </select>
          </div>
          <div className="md:col-span-4">
            <Button onClick={addUser}>
              <UserPlus /> إضافة مستخدمة
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          كل مرشدة ترى ملفات طالباتها فقط، والمديرة ترى جميع البيانات.
        </p>
      </CardContent>
    </Card>
  );
}

function createDefaultSettings() {
  return createSeedData().settings;
}
