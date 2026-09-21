import { createFileRoute } from "@tanstack/react-router";
import { Download, FileDown, Moon, RotateCcw, Sun, Upload } from "lucide-react";
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
import { useStore } from "@/lib/store";

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
              toast.success("تمت استعادة البيانات التجريبية");
            }}
          >
            <RotateCcw /> استعادة البيانات التجريبية
          </Button>
        </CardContent>
      </Card>
    </AppShell>
  );
}

function createDefaultSettings() {
  return createSeedData().settings;
}
