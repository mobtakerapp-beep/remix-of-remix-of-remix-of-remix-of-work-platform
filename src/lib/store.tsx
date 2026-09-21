import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { createSeedData } from "./seed";
import type { AppData, ID } from "./types";

const STORAGE_KEY = "tawjih-platform-data-v1";
const THEME_KEY = "tawjih-platform-theme";

interface StoreValue {
  data: AppData;
  hydrated: boolean;
  setData: (updater: (prev: AppData) => AppData) => void;
  logActivity: (text: string) => void;
  resetData: () => void;
  importData: (raw: string) => boolean;
  theme: "light" | "dark";
  toggleTheme: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function newId(prefix = "id") {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setRaw] = useState<AppData>(() => createSeedData());
  const [hydrated, setHydrated] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setRaw(JSON.parse(stored) as AppData);
      const storedTheme = localStorage.getItem(THEME_KEY);
      if (storedTheme === "dark" || storedTheme === "light") setTheme(storedTheme);
    } catch {
      /* ignore corrupt storage */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* storage full */
    }
  }, [data, hydrated]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    if (hydrated) localStorage.setItem(THEME_KEY, theme);
  }, [theme, hydrated]);

  const value = useMemo<StoreValue>(
    () => ({
      data,
      hydrated,
      setData: (updater) => setRaw((prev) => updater(prev)),
      logActivity: (text: string) =>
        setRaw((prev) => ({
          ...prev,
          activities: [{ id: newId("a"), date: todayISO(), text }, ...prev.activities].slice(0, 30),
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
    }),
    [data, hydrated, theme],
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
