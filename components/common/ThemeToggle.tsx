"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8 sm:h-9 sm:w-9 rounded-[12px] sm:rounded-xl border-border/80 shrink-0"
        aria-label="Toggle theme"
      >
        <Sun className="h-3.5 w-3.5 text-muted-foreground" />
      </Button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="h-8 w-8 sm:h-9 sm:w-9 rounded-[12px] sm:rounded-xl border-border/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:border-emerald-500/40 transition-all shrink-0 cursor-pointer"
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-400 transition-transform duration-300 rotate-0 hover:rotate-45" />
      ) : (
        <Moon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-700 dark:text-emerald-400 transition-transform duration-300 rotate-0 hover:-rotate-12" />
      )}
    </Button>
  );
}
