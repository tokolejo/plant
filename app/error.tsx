"use client";

import * as React from "react";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("Root error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background text-foreground font-sans">
      <div className="text-center space-y-4 max-w-md p-8 rounded-3xl bg-card border border-border shadow-xl">
        <div className="h-12 w-12 rounded-2xl bg-destructive/15 text-destructive flex items-center justify-center mx-auto text-xl font-bold">
          ⚠️
        </div>
        <h2 className="text-xl font-bold">დაფიქსირდა შეცდომა</h2>
        <p className="text-xs text-muted-foreground">
          {error?.message || "გთხოვთ სცადოთ თავიდან."}
        </p>
        <button
          onClick={() => reset()}
          className="px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-bold shadow-md hover:bg-primary-container transition-colors cursor-pointer"
        >
          თავიდან ცდა
        </button>
      </div>
    </div>
  );
}
