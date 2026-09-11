import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

/**
 * Server-side Admin Layout Guard
 *
 * This layout runs on the server before any admin page renders.
 * Non-admin users are redirected to the homepage — they never see
 * the admin page HTML or JS bundle.
 */
export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${params.locale}/auth/login`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_admin")
    .eq("id", user.id)
    .single();

  const isAdmin =
    user.email === "tokolejo@gmail.com" ||
    profile?.is_admin === true ||
    profile?.role === "ADMIN" ||
    profile?.role === "SUPER_ADMIN";

  if (!isAdmin) {
    redirect(`/${params.locale}`);
  }

  return <>{children}</>;
}
