import Link from "next/link";

export default function NotFound() {
  return (
    <html lang="ka">
      <body className="min-h-screen flex items-center justify-center p-4 bg-slate-50 text-slate-900 font-sans">
        <div className="text-center space-y-4 max-w-md p-8 rounded-3xl bg-white border border-slate-200 shadow-xl">
          <div className="h-12 w-12 rounded-2xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center mx-auto text-xl font-bold">
            
          </div>
          <h1 className="text-3xl font-extrabold">404</h1>
          <p className="text-sm text-slate-600">
            გვერდი ვერ მოიძებნა ან გადატანილია.
          </p>
          <Link
            href="/"
            className="inline-block px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-emerald-700 transition-colors"
          >
            მთავარზე დაბრუნება
          </Link>
        </div>
      </body>
    </html>
  );
}
