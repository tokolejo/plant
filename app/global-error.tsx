"use client";

import * as React from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ka">
      <body className="min-h-screen flex items-center justify-center p-4 bg-slate-50 text-slate-900 font-sans">
        <div className="text-center space-y-4 max-w-md p-8 rounded-3xl bg-white border border-slate-200 shadow-xl">
          <div className="h-12 w-12 rounded-2xl bg-destructive/15 text-destructive flex items-center justify-center mx-auto text-xl font-bold">
            ⚠️
          </div>
          <h2 className="text-xl font-bold">დაფიქსირდა შეცდომა</h2>
          <p className="text-xs text-slate-600">
            {error?.message || "გთხოვთ სცადოთ თავიდან."}
          </p>
          <button
            onClick={() => reset()}
            className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-emerald-700 transition-colors"
          >
            თავიდან ცდა
          </button>
        </div>
      </body>
    </html>
  );
}
