import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { createSeedData } from "./seed";
import type { AppData, AppUser, ID } from "./types";

const STORAGE_KEY = "tawjih-platform-data-v3";
const THEME_KEY = "tawjih-platform-theme";
const SESSION_KEY = "tawjih-platform-session";

interface StoreValue {
  data: AppData;
  hydrated: boolean;
  setData: (updater: (prev: AppData) => AppData) => void;
  logActivity: (text: string) => void;
  resetData: () => void;
  importData: (raw: string) => boolean;
  theme: "light" | "dark";
  toggleTheme: () => void;
  currentUser: AppUser | null;
  isManager: boolean;
  signIn: (code: string) => boolean;
  signOut: () => void;
  createFirstManager: (name: string, code: string) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function newId(prefix = "id") {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [raw, setRaw] = useState<AppData>(() => createSeedData());
  const [hydrated, setHydrated] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [currentUserId, setCurrentUserId] = useState<ID | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setRaw(JSON.parse(stored) as AppData);
      const storedTheme = localStorage.getItem(THEME_KEY);
      if (storedTheme === "dark" || storedTheme === "light") setTheme(storedTheme);
      const session = localStorage.getItem(SESSION_KEY);
      if (session) setCurrentUserId(session);
    } catch {
      /* ignore corrupt storage */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (currentUserId) localStorage.setItem(SESSION_KEY, currentUserId);
    else localStorage.removeItem(SESSION_KEY);
  }, [currentUserId, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(raw));
    } catch {
      /* storage full */
    }
  }, [raw, hydrated]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    if (hydrated) localStorage.setItem(THEME_KEY, theme);
  }, [theme, hydrated]);

  const currentUser = useMemo(
    () => raw.users.find((u) => u.id === currentUserId && u.active) ?? null,
    [raw.users, currentUserId],
  );
  const isManager = currentUser?.role === "مديرة";

  const data = useMemo<AppData>(() => {
    if (!currentUser || isManager) return raw;
    return { ...raw, students: raw.students.filter((s) => s.counselorId === currentUser.id) };
  }, [raw, currentUser, isManager]);

  const value = useMemo<StoreValue>(
    () => ({
      data,
      hydrated,
      setData: (updater) =>
        setRaw((prev) => {
          const next = updater(prev);
          if (currentUser && !isManager) {
            return {
              ...next,
              students: next.students.map((s) =>
                s.counselorId ? s : { ...s, counselorId: currentUser.id },
              ),
            };
          }
          return next;
        }),
      logActivity: (text: string) =>
        setRaw((prev) => ({
          ...prev,
          activities: [
            { id: newId("a"), date: todayISO(), text: currentUser ? `${text} — ${currentUser.name}` : text },
            ...prev.activities,
          ].slice(0, 30),
        })),
      resetData: () => setRaw(createSeedData()),
      importData: (rawText: string) => {
        try {
          const parsed = JSON.parse(rawText) as AppData;
          if (!parsed || !Array.isArray(parsed.programs)) return false;
          setRaw(parsed);
          return true;
        } catch {
          return false;
        }
      },
      theme,
      toggleTheme: () => setTheme((t) => (t === "dark" ? "light" : "dark")),
      currentUser,
      isManager,
      signIn: (code: string) => {
        const user = raw.users.find((u) => u.code.trim() === code.trim() && u.active);
        if (!user) return false;
        setCurrentUserId(user.id);
        return true;
      },
      signOut: () => setCurrentUserId(null),
      createFirstManager: (name: string, code: string) => {
        const user: AppUser = {
          id: newId("u"),
          name,
          role: "مديرة",
          code,
          email: "",
          active: true,
        };
        setRaw((prev) => ({ ...prev, users: [user, ...prev.users] }));
        setCurrentUserId(user.id);
      },
    }),
    [data, raw.users, hydrated, theme, currentUser, isManager],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

/** Generic list helpers for collections keyed by id. */
export function upsert<T extends { id: ID }>(list: T[], item: T): T[] {
  const idx = list.findIndex((x) => x.id === item.id);
  if (idx === -1) return [item, ...list];
  const copy = [...list];
  copy[idx] = item;
  return copy;
}

export function removeById<T extends { id: ID }>(list: T[], id: ID): T[] {
  return list.filter((x) => x.id !== id);
}
