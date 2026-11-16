"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { AuthApiError } from "@/lib/auth-api";
import { getSafeRedirectPath } from "@/lib/auth-redirect";
import { useAuth } from "@/providers/auth-provider";

type AuthMode = "login" | "register";

export default function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, register, status } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<
    Array<{ field: string; message: string }>
  >([]);

  const destination = getSafeRedirectPath(searchParams.get("next"));
  const isRegister = mode === "register";

  useEffect(() => {
    if (status === "authenticated") {
      router.replace(destination);
    }
  }, [status, destination, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setErrorMessage("");
    setFieldErrors([]);

    try {
      if (isRegister) {
        await register(email.trim(), password);
      } else {
        await login(email.trim(), password);
      }

      router.replace(destination);
      router.refresh();
    } catch (error) {
      if (error instanceof AuthApiError) {
        setErrorMessage(error.message);
        setFieldErrors(error.details ?? []);
      } else {
        setErrorMessage(
          "Unable to reach the server. Please check your connection and try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  }

  const emailError = fieldErrors.find((item) => item.field === "email");
  const passwordError = fieldErrors.find(
    (item) => item.field === "password",
  );

  if (status === "loading" || status === "authenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f8fc]">
        <p className="text-sm font-medium text-slate-500">
          {status === "loading"
            ? "Checking your session..."
            : "Redirecting..."}
        </p>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8fc] px-5 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-xl font-bold text-white shadow-sm shadow-indigo-200">
            Q
          </span>
          <span className="text-xl font-bold tracking-tight text-slate-900">
            Interview<span className="text-indigo-600">IQ</span>
          </span>
        </Link>

        <section className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
          <div className="mb-7 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-xl text-indigo-600">
              {isRegister ? "✦" : "↗"}
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {isRegister ? "Create your account" : "Welcome back"}
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {isRegister
                ? "Create an account to generate interview questions tailored to your next opportunity."
                : "Sign in to continue preparing for your next interview."}
            </p>
          </div>

          {errorMessage && (
            <div
              role="alert"
              className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
            >
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Email address
              </label>

              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                aria-invalid={Boolean(emailError)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
              />

              {emailError && (
                <p className="mt-1 text-sm text-red-600">
                  {emailError.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Password
              </label>

              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={
                    isRegister ? "new-password" : "current-password"
                  }
                  required
                  minLength={isRegister ? 12 : 1}
                  maxLength={128}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={
                    isRegister
                      ? "At least 12 characters"
                      : "Enter your password"
                  }
                  aria-invalid={Boolean(passwordError)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-20 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-3 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              {passwordError && (
                <p className="mt-1 text-sm text-red-600">
                  {passwordError.message}
                </p>
              )}

              {isRegister && (
                <p className="mt-2 text-xs text-slate-500">
                  Use between 12 and 128 characters.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Please wait..."
                : isRegister
                  ? "Create account"
                  : "Sign in"}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-slate-500">
            {isRegister ? "Already have an account?" : "New to InterviewIQ?"}{" "}
            <Link
              href={
                isRegister
                  ? `/login?next=${encodeURIComponent(destination)}`
                  : `/register?next=${encodeURIComponent(destination)}`
              }
              className="font-semibold text-indigo-600 hover:text-indigo-800"
            >
              {isRegister ? "Sign in" : "Create an account"}
            </Link>
          </p>
        </section>

        <p className="mt-6 text-center text-xs text-slate-400">
          <Link href="/" className="transition hover:text-indigo-600">
            Back to InterviewIQ
          </Link>
        </p>
      </div>
    </main>
  );
}
