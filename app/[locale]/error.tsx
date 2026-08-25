"use client";

import * as React from "react";
import { Link } from "@/i18n/routing";

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 text-center space-y-4">
      <div className="h-14 w-14 rounded-2xl bg-destructive/15 text-destructive flex items-center justify-center text-2xl font-bold">
        ️
      </div>
      <h1 className="text-2xl font-extrabold text-foreground">
        დაფიქსირდა შეცდომა
      </h1>
      <p className="text-xs text-muted-foreground max-w-md">
        {error?.message || "გთხოვთ სცადოთ თავიდან ან დაბრუნდეთ მთავარ გვერდზე."}
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={() => reset()}
          className="px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-bold shadow-md hover:bg-primary-container transition-colors cursor-pointer"
        >
          თავიდან ცდა
        </button>
        <Link
          href="/"
          className="px-5 py-2.5 bg-secondary-container text-foreground rounded-xl text-xs font-bold hover:bg-surface-container transition-colors"
        >
          მთავარზე დაბრუნება
        </Link>
      </div>
    </div>
  );
}
