import { Link, useNavigate } from "@tanstack/react-router";
import {
  BarChart3,
  Bell,
  BookOpenCheck,
  CalendarDays,
  ClipboardList,
  GraduationCap,
  IdCard,
  LayoutDashboard,
  LogOut,
  MessagesSquare,
  Menu,
  Moon,
  Search,
  Settings,
  Sun,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { alerts } from "@/lib/derive";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

import { AuthGate } from "./AuthGate";
import { NAV_ITEMS } from "./nav";

const ICONS: Record<string, LucideIcon> = {
  LayoutDashboard,
  IdCard,
  BookOpenCheck,
  Users,
  MessagesSquare,
  ClipboardList,
  BarChart3,
  CalendarDays,
  Search,
  Settings,
};

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1 p-3">
      {NAV_ITEMS.map((item) => {
        const Icon = ICONS[item.icon] ?? LayoutDashboard;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            activeOptions={{ exact: item.to === "/" }}
            activeProps={{
              className: "bg-primary text-primary-foreground shadow-sm hover:bg-primary",
            }}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
          >
            <Icon className="size-4.5 shrink-0" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const { data, theme, toggleTheme, hydrated, currentUser, signOut } = useStore();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const upcoming = alerts(data).slice(0, 8);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    navigate({ to: "/search", search: { q: query } });
  }

  if (!hydrated) return <div className="min-h-screen bg-background" />;
  if (!currentUser) return <AuthGate />;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-card/85 backdrop-blur print:hidden">
        <div className="flex items-center gap-3 px-4 py-3">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="القائمة">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 bg-sidebar p-0">
              <div className="flex items-center gap-2 border-b border-sidebar-border p-4">
                <GraduationCap className="size-6 text-primary" />
                <span className="font-display font-bold">منصة التوجيه الطلابي</span>
              </div>
              <NavList onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>

          <Link to="/" className="flex items-center gap-2.5">
            {data.settings.logoUrl ? (
              <img src={data.settings.logoUrl} alt="شعار المدرسة" className="size-9 rounded-lg object-cover" />
            ) : (
              <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
                <GraduationCap className="size-5" />
              </span>
            )}
            <span className="hidden font-display text-base font-bold sm:block">
              منصة التوجيه الطلابي الذكية
            </span>
          </Link>

          <form onSubmit={submitSearch} className="ms-auto hidden max-w-xs flex-1 md:block">
            <div className="relative">
              <Search className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="بحث عام..."
                className="pe-9"
              />
            </div>
          </form>

          <div className="ms-auto flex items-center gap-1 md:ms-0">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative" aria-label="التنبيهات">
                  <Bell />
                  {upcoming.length > 0 && (
                    <span className="absolute end-1.5 top-1.5 size-2 rounded-full bg-destructive" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-80 p-0">
                <p className="border-b border-border px-4 py-3 text-sm font-semibold">التنبيهات</p>
                <ScrollArea className="max-h-72">
                  <ul className="divide-y divide-border">
                    {upcoming.map((a) => (
                      <li key={a.id} className="px-4 py-2.5 text-sm">
                        <span className="text-muted-foreground">{a.kind} · {a.date}</span>
                        <p>{a.text}</p>
                      </li>
                    ))}
                    {upcoming.length === 0 && (
                      <li className="px-4 py-6 text-center text-sm text-muted-foreground">
                        لا تنبيهات حالياً
                      </li>
                    )}
                  </ul>
                </ScrollArea>
              </PopoverContent>
            </Popover>
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="تبديل المظهر">
              {theme === "dark" ? <Sun /> : <Moon />}
            </Button>
            <Link to="/settings" aria-label="الإعدادات">
              <Button variant="ghost" size="icon">
                <Settings />
              </Button>
            </Link>
            <Button variant="ghost" size="icon" onClick={signOut} aria-label="تسجيل الخروج">
              <LogOut />
            </Button>
            <div className="hidden ps-2 text-start leading-tight sm:block">
              <p className="text-sm font-semibold">{currentUser.name}</p>
              <p className="text-xs text-muted-foreground">
                {currentUser.role}
                {data.settings.schoolName ? ` · ${data.settings.schoolName}` : ""}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="sticky top-[61px] hidden h-[calc(100vh-61px)] w-64 shrink-0 overflow-y-auto border-s border-border/70 bg-sidebar lg:block print:hidden">
          <NavList />
          <p className="px-5 pb-6 pt-2 text-xs text-muted-foreground">
            {data.settings.academicYear} — {data.settings.term}
          </p>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-6 md:px-8">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-bold md:text-3xl">{title}</h1>
              {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
            </div>
            {actions && <div className="flex flex-wrap gap-2 print:hidden">{actions}</div>}
          </div>
          <div className={cn("space-y-6")}>{children}</div>
          <footer className="mt-10 border-t border-border/60 pt-4 pb-2 text-center text-xs text-muted-foreground print:hidden">
            <p>فكرة: أسماء الغافري</p>
            <p className="mt-0.5">تصميم: مروة أبو بكر</p>
          </footer>
        </main>
      </div>
    </div>
  );
}
