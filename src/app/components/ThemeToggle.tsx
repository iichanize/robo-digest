"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="w-[7.5rem] h-9 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800" />
    );
  }

  const Icon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;

  return (
    <div className="relative flex items-center">
      <Icon className="absolute left-2.5 h-4 w-4 text-slate-500 dark:text-slate-400 pointer-events-none" />
      <select
        value={theme}
        onChange={(e) => setTheme(e.target.value)}
        className="appearance-none pl-8 pr-3 py-2 text-sm text-right leading-none rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
        aria-label="テーマ切り替え"
      >
        <option value="light">ライト</option>
        <option value="dark">ダーク</option>
        <option value="system">システム</option>
      </select>
    </div>
  );
}
