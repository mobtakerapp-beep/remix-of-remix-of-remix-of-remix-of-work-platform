import { GraduationCap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/store";

export function AuthGate() {
  const { data, users0, signIn, createFirstManager, createUserAsManager } = useStoreSafe();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [managerCode, setManagerCode] = useState("");
  const [creating, setCreating] = useState(false);
  const firstRun = users0 === 0;

  function submit(e: React.FormEvent) {
    e.preventDefault();

    if (firstRun) {
      if (!name.trim() || code.trim().length < 4) {
        toast.error("أدخلي الاسم وكود دخول من 4 أرقام أو أكثر");
        return;
      }
      createFirstManager(name.trim(), code.trim());
      toast.success("تم إنشاء حساب المديرة");
      return;
    }

    if (creating) {
      if (!managerCode.trim() || managerCode.trim().length < 4) {
        toast.error("أدخلي كود المديرة للسماح بإنشاء الحساب");
        return;
      }
      if (!name.trim() || code.trim().length < 4) {
        toast.error("أدخلي اسم المستخدمة وكود دخول من 4 أرقام أو أكثر");
        return;
      }

      const ok = createUserAsManager(managerCode.trim(), name.trim(), code.trim());
      if (!ok) {
        toast.error("كود المديرة غير صحيح، أو كود الدخول مستخدم مسبقاً");
        return;
      }

      toast.success("تم إنشاء الحساب وتسجيل الدخول");
      return;
    }

    if (!signIn(code)) toast.error("كود الدخول غير صحيح أو الحساب موقوف");
  }

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground">
            <GraduationCap className="size-6" />
          </span>
          <CardTitle className="mt-3 font-display text-lg">
            {firstRun ? "إنشاء حساب المديرة" : creating ? "إنشاء حساب جديد" : "تسجيل الدخول"}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {data.settings.schoolName || "منصة التوجيه الطلابي"}
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            {firstRun && (
              <p className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                هذا أول حساب في المنصة، ويكون حساب المديرة (صاحبة المنصة). يُفضّل أن تنشئه هي بنفسها
                وتختار كود دخولها.
              </p>
            )}

            {creating && (
              <p className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                إنشاء الحسابات الجديدة متاح بإذن المديرة. أدخلي كود المديرة مرة واحدة لاعتماد الحساب.
              </p>
            )}

            {creating && (
              <div className="space-y-2">
                <Label htmlFor="manager-code">كود المديرة</Label>
                <Input
                  id="manager-code"
                  type="password"
                  inputMode="numeric"
                  value={managerCode}
                  onChange={(e) => setManagerCode(e.target.value)}
                />
              </div>
            )}

            {(firstRun || creating) && (
              <div className="space-y-2">
                <Label htmlFor="mgr-name">{firstRun ? "اسم المديرة" : "اسم المستخدمة"}</Label>
                <Input id="mgr-name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="login-code">كود الدخول</Label>
              <Input
                id="login-code"
                type="password"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full">
              {firstRun ? "إنشاء الحساب والدخول" : creating ? "إنشاء الحساب والدخول" : "دخول"}
            </Button>

            {!firstRun && (
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setCreating((value) => !value);
                  setName("");
                  setCode("");
                  setManagerCode("");
                }}
              >
                {creating ? "العودة إلى تسجيل الدخول" : "إنشاء حساب جديد"}
              </Button>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function useStoreSafe() {
  const store = useStore();
  return { ...store, users0: Array.isArray(store.data.users) ? store.data.users.length : 0 };
}
