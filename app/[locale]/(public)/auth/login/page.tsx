"use client";

import * as React from "react";
import { Link, useRouter } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { createClient } from "@/utils/supabase/client";
import { 
  Sprout, 
  Mail, 
  Lock, 
  User, 
  Phone, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles,
  Loader2,
  ArrowLeft,
  KeyRound,
  Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const locale = useLocale();
  const isKa = locale !== "en";
  return (
    <React.Suspense fallback={
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <AuthContainer isKa={isKa} />
    </React.Suspense>
  );
}

function AuthContainer({ isKa }: { isKa: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/dashboard";
  const initialMode = searchParams.get("mode") === "register" ? "REGISTER" : "LOGIN";

  const supabase = createClient();

  const [mode, setMode] = React.useState<"LOGIN" | "REGISTER" | "FORGOT">(initialMode);
  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState("");
  const [successMsg, setSuccessMsg] = React.useState("");
  const [verificationSent, setVerificationSent] = React.useState(false);

  // Form Fields
  const [fullName, setFullName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");

  // Clear messages on tab switch
  const switchMode = (newMode: "LOGIN" | "REGISTER" | "FORGOT") => {
    setMode(newMode);
    setErrorMsg("");
    setSuccessMsg("");
    setVerificationSent(false);
  };

  // Google OAuth Login
  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg("");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectUrl)}`,
      },
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
    }
  };

  // Email & Password Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setErrorMsg(
        error.message === "Invalid login credentials"
          ? (isKa ? "ელ-ფოსტა ან პაროლი არასწორია" : "Invalid email or password")
          : error.message
      );
      setLoading(false);
    } else {
      router.push(redirectUrl);
      router.refresh();
    }
  };

  // Registration Submit (Full Name, Phone, Email, Password -> Email Verification)
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    if (!fullName.trim()) {
      setErrorMsg(isKa ? "გთხოვთ მიუთითოთ სახელი და გვარი" : "Please enter your full name");
      setLoading(false);
      return;
    }

    if (!phone.trim()) {
      setErrorMsg(isKa ? "გთხოვთ მიუთითოთ მობილურის ნომერი" : "Please enter your phone number");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setErrorMsg(isKa ? "პაროლი უნდა შედგებოდეს მინიმუმ 6 სიმბოლოსგან" : "Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg(isKa ? "პაროლები ერთმანეთს არ ემთხვევა" : "Passwords do not match");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          phone: phone.trim(),
        },
      },
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
    } else {
      if (data.session) {
        // Direct login if email confirm is turned off in Supabase
        router.push(redirectUrl);
        router.refresh();
      } else {
        // Verification email sent
        setVerificationSent(true);
        setLoading(false);
      }
    }
  };

  // Password Recovery Submit
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/dashboard/profile`,
    });

    if (error) {
      setErrorMsg(error.message);
    } else {
      setSuccessMsg(
        isKa 
          ? "პაროლის აღდგენის ბმული გამოგეგზავნათ ელ-ფოსტაზე. გთხოვთ შეამოწმოთ თქვენი შემოსული წერილები."
          : "Password reset link has been sent to your email. Please check your inbox."
      );
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto px-4 py-8 sm:py-14 max-w-md">
      <div className="rounded-[28px] border border-border/80 bg-card p-6 sm:p-8 shadow-2xl shadow-black/10 relative overflow-hidden">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-primary text-white shadow-ambient mb-3 group-hover:scale-105 transition-all">
            <Sprout className="h-6 w-6 text-primary-fixed" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            {mode === "LOGIN" && (isKa ? "სისტემაში შესვლა" : "Sign In")}
            {mode === "REGISTER" && (isKa ? "რეგისტრაცია" : "Create Account")}
            {mode === "FORGOT" && (isKa ? "პაროლის აღდგენა" : "Reset Password")}
          </h1>
          <p className="text-xs text-muted-foreground mt-1 font-medium">
            {mode === "LOGIN" && (isKa ? "მოგესალმებით Plant-ის ბოტანიკურ პლატფორმაზე" : "Welcome to Plant.ge marketplace")}
            {mode === "REGISTER" && (isKa ? "შექმენით ანგარიში და დაიწყეთ მცენარეებით ვაჭრობა" : "Create an account to start trading plants")}
            {mode === "FORGOT" && (isKa ? "შეიყვანეთ ელ-ფოსტა აღდგენის ბმულის მისაღებად" : "Enter your email to receive a password reset link")}
          </p>
        </div>

        {/* Verification Success View */}
        {verificationSent ? (
          <div className="text-center py-4 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <Mail className="w-8 h-8 animate-bounce" />
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-black text-foreground">
                {isKa ? "️ შეამოწმეთ თქვენი ელ-ფოსტა!" : "️ Check your email!"}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isKa ? "ვერიფიკაციის ბმული გამოგეგზავნათ მისამართზე:" : "A verification link has been sent to:"}{" "}
                <strong className="text-foreground font-bold">{email}</strong>.
              </p>
              <p className="text-[11px] text-muted-foreground/80 bg-secondary-container/70 p-3 rounded-[14px] border border-border/50">
                {isKa 
                  ? " გთხოვთ გახსნათ მიღებული წერილი და დააჭიროთ დასტურის ბმულს ანგარიშის გასააქტიურებლად (შეამოწმეთ Spam საქაღალდეც)."
                  : " Please open the email and click the confirmation link to activate your account (also check your Spam folder)."}
              </p>
            </div>

            <Button
              type="button"
              onClick={() => switchMode("LOGIN")}
              className="w-full rounded-[16px] bg-primary hover:bg-primary-container text-white text-xs font-bold h-11 shadow-ambient mt-2 cursor-pointer"
            >
              {isKa ? "შესვლის ფორმაზე დაბრუნება" : "Back to Sign In"}
            </Button>
          </div>
        ) : (
          <>
            {/* Tabs: [ შესვლა ] | [ რეგისტრაცია ] (Only if not in FORGOT mode) */}
            {mode !== "FORGOT" && (
              <div className="flex rounded-[16px] bg-secondary-container/80 p-1 mb-5 border border-border/40">
                <button
                  type="button"
                  onClick={() => switchMode("LOGIN")}
                  className={`flex-1 py-2 rounded-[12px] text-xs font-bold transition-all cursor-pointer ${
                    mode === "LOGIN"
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {isKa ? "შესვლა" : "Sign In"}
                </button>
                <button
                  type="button"
                  onClick={() => switchMode("REGISTER")}
                  className={`flex-1 py-2 rounded-[12px] text-xs font-bold transition-all cursor-pointer ${
                    mode === "REGISTER"
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {isKa ? "რეგისტრაცია" : "Register"}
                </button>
              </div>
            )}

            {/* Error Message Alert */}
            {errorMsg && (
              <div className="mb-4 rounded-[16px] bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="font-semibold">{errorMsg}</span>
              </div>
            )}

            {/* Success Message Alert */}
            {successMsg && (
              <div className="mb-4 rounded-[16px] bg-emerald-500/10 border border-emerald-500/25 p-3 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span className="font-semibold">{successMsg}</span>
              </div>
            )}

            {/* Google OAuth Button (Shown on Login & Register) */}
            {mode !== "FORGOT" && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full h-11 rounded-[16px] font-bold text-xs mb-4 flex items-center justify-center gap-2.5 border-border/80 hover:bg-secondary-container text-foreground shadow-2xs transition-all cursor-pointer"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>{isKa ? "Google-ით ავტორიზაცია" : "Continue with Google"}</span>
                </Button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border/60" />
                  </div>
                  <div className="relative flex justify-center text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                    <span className="bg-card px-3">{isKa ? "ან ელ-ფოსტით" : "or with email"}</span>
                  </div>
                </div>
              </>
            )}

            {/* ═══════ MODE 1: LOGIN FORM ═══════ */}
            {mode === "LOGIN" && (
              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-foreground mb-1 block">
                    {isKa ? "ელ-ფოსტა" : "Email"}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 rounded-[14px] h-10 text-xs sm:text-sm font-medium"
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-foreground block">
                      {isKa ? "პაროლი" : "Password"}
                    </label>
                    <button
                      type="button"
                      onClick={() => switchMode("FORGOT")}
                      className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                    >
                      {isKa ? "დაგავიწყდათ პაროლი?" : "Forgot password?"}
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 rounded-[14px] h-10 text-xs sm:text-sm font-medium"
                      autoComplete="current-password"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-[16px] bg-primary hover:bg-primary-container text-white text-xs font-bold h-11 mt-2 shadow-ambient cursor-pointer"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isKa ? "სისტემაში შესვლა" : "Sign In")}
                </Button>
              </form>
            )}

            {/* ═══════ MODE 2: REGISTRATION FORM (Full Name, Phone, Email, Passwords) ═══════ */}
            {mode === "REGISTER" && (
              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                {/* 1. Full Name */}
                <div>
                  <label className="text-xs font-bold text-foreground mb-1 block">
                    {isKa ? "სახელი და გვარი" : "Full Name"} <span className="text-primary">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-10 rounded-[14px] h-10 text-xs sm:text-sm font-medium"
                    />
                  </div>
                </div>

                {/* 2. Phone Number */}
                <div>
                  <label className="text-xs font-bold text-foreground mb-1 block">
                    {isKa ? "მობილურის ნომერი" : "Phone Number"} <span className="text-primary">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-10 rounded-[14px] h-10 text-xs sm:text-sm font-medium"
                    />
                  </div>
                </div>

                {/* 3. Email */}
                <div>
                  <label className="text-xs font-bold text-foreground mb-1 block">
                    {isKa ? "ელ-ფოსტა" : "Email"} <span className="text-primary">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 rounded-[14px] h-10 text-xs sm:text-sm font-medium"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {isKa 
                      ? "რეგისტრაციის დასასრულებლად ელ-ფოსტაზე მიიღებთ დასტურის ბმულს."
                      : "You will receive a confirmation link on your email to complete registration."}
                  </p>
                </div>

                {/* 4. Password */}
                <div>
                  <label className="text-xs font-bold text-foreground mb-1 block">
                    {isKa ? "პაროლი (მინ. 6 სიმბოლო)" : "Password (min. 6 characters)"} <span className="text-primary">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 rounded-[14px] h-10 text-xs sm:text-sm font-medium"
                    />
                  </div>
                </div>

                {/* 5. Confirm Password */}
                <div>
                  <label className="text-xs font-bold text-foreground mb-1 block">
                    {isKa ? "გაიმეორეთ პაროლი" : "Confirm Password"} <span className="text-primary">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 rounded-[14px] h-10 text-xs sm:text-sm font-medium"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-[16px] bg-primary hover:bg-primary-container text-white text-xs font-bold h-11 mt-3 shadow-ambient cursor-pointer"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isKa ? "რეგისტრაციის დასრულება" : "Create Account")}
                </Button>
              </form>
            )}

            {/* ═══════ MODE 3: FORGOT PASSWORD ═══════ */}
            {mode === "FORGOT" && (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-foreground mb-1 block">
                    {isKa ? "თქვენი რეგისტრირებული ელ-ფოსტა" : "Your registered email"}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 rounded-[14px] h-10 text-xs sm:text-sm font-medium"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-[16px] bg-primary hover:bg-primary-container text-white text-xs font-bold h-11 shadow-ambient cursor-pointer"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isKa ? "აღდგენის ბმულის გაგზავნა" : "Send Reset Link")}
                </Button>

                <button
                  type="button"
                  onClick={() => switchMode("LOGIN")}
                  className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary pt-2 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  {isKa ? "შესვლის ფორმაზე დაბრუნება" : "Back to Sign In"}
                </button>
              </form>
            )}
          </>
        )}

      </div>
    </div>
  );
}
