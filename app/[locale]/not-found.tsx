import { Link } from "@/i18n/routing";

export default function LocaleNotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 text-center space-y-4">
      <div className="h-14 w-14 rounded-2xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center text-2xl font-bold">
        🌱
      </div>
      <h1 className="text-4xl font-extrabold text-foreground">404</h1>
      <p className="text-sm text-muted-foreground">
        გვერდი ვერ მოიძებნა ან გადატანილია.
      </p>
      <Link
        href="/"
        className="inline-block px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-emerald-700 transition-colors"
      >
        მთავარზე დაბრუნება
      </Link>
    </div>
  );
}
