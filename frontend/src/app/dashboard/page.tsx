"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  getInterviewBookmarks,
  getInterviewHistory,
  InterviewApiError,
  type InterviewHistoryItem,
} from "@/lib/interview-api";

import { useAuth } from "@/providers/auth-provider";

interface DashboardData {
  totalInterviews: number;
  totalBookmarks: number;
  recentInterviews: InterviewHistoryItem[];
}

const EMPTY_DASHBOARD: DashboardData = {
  totalInterviews: 0,
  totalBookmarks: 0,
  recentInterviews: [],
};

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

function formatExperienceLevel(level: string): string {
  const labels: Record<string, string> = {
    JUNIOR: "Junior",
    MID: "Mid-level",
    SENIOR: "Senior",
  };

  return labels[level] ?? level;
}

function formatInterviewType(type: string): string {
  const labels: Record<string, string> = {
    TECHNICAL: "Technical",
    BEHAVIORAL: "Behavioral",
    MIXED: "Mixed",
  };

  return labels[type] ?? type;
}

function DashboardFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8fc] px-5">
      <div className="text-center">
        <div
          className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600"
          role="status"
          aria-label="Checking your session"
        />

        <p className="mt-4 text-sm font-medium text-slate-600">
          Checking your session...
        </p>
      </div>
    </main>
  );
}

export default function DashboardPage() {
  const router = useRouter();

  const {
    status,
    user,
    accessToken,
    refreshAccessToken,
    logout,
  } = useAuth();

  const [dashboard, setDashboard] =
    useState<DashboardData>(EMPTY_DASHBOARD);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  // Redirect visitors who do not have an authenticated session.
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login?next=%2Fdashboard");
    }
  }, [status, router]);

  // Load dashboard totals and recent interviews from existing API endpoints.
  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      let token = accessToken ?? await refreshAccessToken();

      const fetchDashboardData = async (accessTokenValue: string) => {
        const [historyResult, bookmarksResult] = await Promise.all([
          getInterviewHistory(1, 5, accessTokenValue),
          getInterviewBookmarks(1, 1, accessTokenValue),
        ]);

        return {
          totalInterviews: historyResult.pagination.total,
          totalBookmarks: bookmarksResult.pagination.total,
          recentInterviews: historyResult.interviews,
        };
      };

      let result: DashboardData;

      try {
        result = await fetchDashboardData(token);
      } catch (error) {
        if (!(error instanceof InterviewApiError) || error.status !== 401) {
          throw error;
        }

        // Retry both requests once with a refreshed access token.
        token = await refreshAccessToken();
        result = await fetchDashboardData(token);
      }

      setDashboard(result);
    } catch (error) {
      setErrorMessage(
        error instanceof InterviewApiError
          ? error.message
          : "Unable to load your dashboard. Please check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  }, [accessToken, refreshAccessToken]);

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    // Defer the request so loading state updates happen outside the effect.
    const timeoutId = setTimeout(() => {
      void loadDashboard();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [status, loadDashboard]);

  async function handleLogout() {
    setLoggingOut(true);

    await logout().catch(() => undefined);

    router.replace("/login");
  }

  if (status !== "authenticated") {
    return <DashboardFallback />;
  }

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white">
              Q
            </div>

            <span className="text-lg font-bold tracking-tight">
              Interview<span className="text-indigo-600">IQ</span>
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden text-sm text-slate-500 sm:inline">
              {user?.email}
            </span>

            <Link
              href="/history"
              className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              History
            </Link>

            <Link
              href="/bookmarks"
              className="rounded-lg px-3 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50"
            >
              Bookmarks
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60 sm:px-4"
            >
              {loggingOut ? "Signing out..." : "Logout"}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <section className="mb-9 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-xs font-bold tracking-widest text-indigo-600">
              YOUR PREPARATION WORKSPACE
            </p>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Welcome back
            </h1>

            <p className="mt-3 max-w-xl text-slate-600">
              Keep your interview preparation organised. Review your
              generated questions and continue practising for your next
              opportunity.
            </p>
          </div>

          <Link
            href="/generate"
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            + Generate questions
          </Link>
        </section>

        {errorMessage && (
          <div
            className="mb-7 rounded-xl border border-red-200 bg-red-50 p-5"
            role="alert"
          >
            <p className="text-sm text-red-700">{errorMessage}</p>

            <button
              type="button"
              onClick={() => void loadDashboard()}
              disabled={loading}
              className="mt-3 text-sm font-semibold text-red-800 underline disabled:opacity-60"
            >
              Try again
            </button>
          </div>
        )}

        <section
          aria-label="Your interview statistics"
          className="mb-9 grid gap-5 sm:grid-cols-2"
        >
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-500">
                Interviews generated
              </p>

              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-lg text-indigo-600">
                ✦
              </span>
            </div>

            <p className="mt-5 text-4xl font-bold tracking-tight text-slate-900">
              {loading ? "—" : dashboard.totalInterviews}
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Total successful and saved interview records
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-500">
                Bookmarked interviews
              </p>

              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-lg text-amber-600">
                ★
              </span>
            </div>

            <p className="mt-5 text-4xl font-bold tracking-tight text-slate-900">
              {loading ? "—" : dashboard.totalBookmarks}
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Interview sets you have saved for later
            </p>
          </article>
        </section>

        <section className="mb-9">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-slate-900">
              Quick actions
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Continue working on your interview preparation.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Link
              href="/generate"
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-xl text-indigo-600">
                +
              </span>

              <h3 className="mt-4 font-bold text-slate-900">
                Generate questions
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Create tailored interview questions from a job role or
                description.
              </p>

              <span className="mt-4 inline-block text-sm font-semibold text-indigo-600 group-hover:text-indigo-800">
                Get started →
              </span>
            </Link>

            <Link
              href="/history"
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-xl text-sky-600">
                ▤
              </span>

              <h3 className="mt-4 font-bold text-slate-900">
                Interview history
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Find and revisit interview questions you generated
                previously.
              </p>

              <span className="mt-4 inline-block text-sm font-semibold text-indigo-600 group-hover:text-indigo-800">
                View history →
              </span>
            </Link>

            <Link
              href="/bookmarks"
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-xl text-amber-600">
                ★
              </span>

              <h3 className="mt-4 font-bold text-slate-900">
                Saved interviews
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Return to the question sets you bookmarked for practice.
              </p>

              <span className="mt-4 inline-block text-sm font-semibold text-indigo-600 group-hover:text-indigo-800">
                View bookmarks →
              </span>
            </Link>
          </div>
        </section>

        <section>
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Recent interviews
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Your latest generated interview question sets.
              </p>
            </div>

            <Link
              href="/history"
              className="text-sm font-semibold text-indigo-600 transition hover:text-indigo-800"
            >
              View all interviews →
            </Link>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
              <div
                className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600"
                role="status"
                aria-label="Loading recent interviews"
              />

              <p className="mt-4 text-sm text-slate-500">
                Loading your recent interviews...
              </p>
            </div>
          ) : !errorMessage && dashboard.recentInterviews.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-2xl text-indigo-600">
                ✦
              </span>

              <h3 className="mt-4 text-lg font-bold text-slate-900">
                No interviews yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Generate your first set of tailored interview questions
                and it will appear here.
              </p>

              <Link
                href="/generate"
                className="mt-5 inline-flex rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                Generate your first interview
              </Link>
            </div>
          ) : !errorMessage ? (
            <div className="space-y-3">
              {dashboard.recentInterviews.map((interview) => (
                <article
                  key={interview.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-200 sm:p-6"
                >
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                          {formatInterviewType(interview.interviewType)}
                        </span>

                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          {formatExperienceLevel(interview.experienceLevel)}
                        </span>
                      </div>

                      <h3 className="mt-3 text-lg font-bold text-slate-900">
                        {interview.jobTitle}
                      </h3>

                      <p className="mt-2 text-sm text-slate-500">
                        {interview._count.questions} questions
                        {" · "}
                        Created {formatDate(interview.createdAt)}
                      </p>
                    </div>

                    <Link
                      href={`/history/${interview.id}`}
                      className="inline-flex shrink-0 items-center justify-center rounded-xl border border-indigo-200 px-4 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50"
                    >
                      View interview →
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}
