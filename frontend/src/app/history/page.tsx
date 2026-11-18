
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  getInterviewHistory,
  InterviewApiError,
  type InterviewHistoryItem,
  type InterviewHistoryPagination,
  type InterviewHistoryFilters,
  type InterviewType,
  type ExperienceLevel,
} from "@/lib/interview-api";

import { useAuth } from "@/providers/auth-provider";

const PAGE_SIZE = 10;

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

export default function InterviewHistoryPage() {
  const router = useRouter();

  const {
    status,
    user,
    accessToken,
    refreshAccessToken,
    logout,
  } = useAuth();

  const [interviews, setInterviews] = useState<InterviewHistoryItem[]>([]);
  const [pagination, setPagination] =
    useState<InterviewHistoryPagination | null>(null);

  const [page, setPage] = useState(1);

  // Draft values are edited before the user applies the filters.
  const [searchInput, setSearchInput] = useState("");
  const [interviewTypeInput, setInterviewTypeInput] =
    useState<InterviewType | "">("");
  const [experienceLevelInput, setExperienceLevelInput] =
    useState<ExperienceLevel | "">("");

  // Only applied filters are sent to the backend.
  const [activeFilters, setActiveFilters] =
    useState<InterviewHistoryFilters>({});

  const hasActiveFilters = Object.values(activeFilters).some(Boolean);

  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login?next=%2Fhistory");
    }
  }, [status, router]);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      let token = accessToken ?? await refreshAccessToken();

      let result;

      try {
        result = await getInterviewHistory(
          page,
          PAGE_SIZE,
          token,
          activeFilters,
        );
      } catch (error) {
        if (!(error instanceof InterviewApiError) || error.status !== 401) {
          throw error;
        }

        token = await refreshAccessToken();
        result = await getInterviewHistory(
          page,
          PAGE_SIZE,
          token,
          activeFilters,
        );
      }

      setInterviews(result.interviews);
      setPagination(result.pagination);
    } catch (error) {
      if (error instanceof InterviewApiError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage(
          "Unable to load your interview history. Please check your connection and try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  }, [accessToken, refreshAccessToken, page, activeFilters]);

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }
  
    // Defer the request so loading state updates happen outside the effect.
    const timeoutId = setTimeout(() => {
      void loadHistory();
    }, 0);
  
    return () => clearTimeout(timeoutId);
  }, [status, loadHistory]);

  function handleApplyFilters() {
    setActiveFilters({
      search: searchInput.trim() || undefined,
      interviewType: interviewTypeInput || undefined,
      experienceLevel: experienceLevelInput || undefined,
    });
    setPage(1);
  }

  function handleClearFilters() {
    setSearchInput("");
    setInterviewTypeInput("");
    setExperienceLevelInput("");
    setActiveFilters({});
    setPage(1);
  }

  async function handleLogout() {
    setLoggingOut(true);

    await logout().catch(() => undefined);

    router.replace("/login");
  }

  if (status !== "authenticated") {
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

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-500 sm:inline">
              {user?.email}
            </span>

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
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
            >
              {loggingOut ? "Signing out..." : "Logout"}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <section>
            <p className="mb-2 text-xs font-bold tracking-widest text-indigo-600">
              YOUR PREPARATION WORKSPACE
            </p>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Interview history
            </h1>

            <p className="mt-3 max-w-xl text-slate-600">
              Revisit the interview questions you have generated and
              continue preparing for your next opportunity.
            </p>
          </section>

          <Link
            href="/generate"
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            + Generate questions
          </Link>
        </div>

        <section
          aria-label="Search and filter interviews"
          className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label
                htmlFor="history-search"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Search by job title
              </label>
              <input
                id="history-search"
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                maxLength={150}
                placeholder="e.g. Backend Developer"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label
                htmlFor="history-interview-type"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Interview type
              </label>
              <select
                id="history-interview-type"
                value={interviewTypeInput}
                onChange={(event) =>
                  setInterviewTypeInput(event.target.value as InterviewType | "")
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">All interview types</option>
                <option value="TECHNICAL">Technical</option>
                <option value="BEHAVIORAL">Behavioral</option>
                <option value="MIXED">Mixed</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="history-experience-level"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Experience level
              </label>
              <select
                id="history-experience-level"
                value={experienceLevelInput}
                onChange={(event) =>
                  setExperienceLevelInput(event.target.value as ExperienceLevel | "")
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">All experience levels</option>
                <option value="JUNIOR">Junior</option>
                <option value="MID">Mid-level</option>
                <option value="SENIOR">Senior</option>
              </select>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleApplyFilters}
              disabled={loading}
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Apply filters
            </button>

            <button
              type="button"
              onClick={handleClearFilters}
              disabled={
                loading ||
                (!hasActiveFilters &&
                  !searchInput &&
                  !interviewTypeInput &&
                  !experienceLevelInput)
              }
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Clear filters
            </button>
          </div>
        </section>

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Saved interviews</h2>

            {pagination && (
              <p className="mt-1 text-sm text-slate-500">
                {pagination.total}{" "}
                {pagination.total === 1 ? "interview" : "interviews"} saved
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => void loadHistory()}
            disabled={loading}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Refresh
          </button>
        </div>

        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <div
              className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600"
              role="status"
              aria-label="Loading interviews"
            />
            <p className="mt-4 text-sm text-slate-500">
              Loading your interview history...
            </p>
          </div>
        )}

        {!loading && errorMessage && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <h3 className="font-semibold text-red-800">
              We couldn&apos;t load your interviews
            </h3>

            <p className="mt-2 text-sm text-red-700">
              {errorMessage}
            </p>

            <button
              type="button"
              onClick={() => void loadHistory()}
              className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !errorMessage && interviews.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-2xl text-indigo-600">
              ✦
            </div>

            <h3 className="mt-5 text-lg font-bold">
              {hasActiveFilters ? "No matching interviews" : "No interviews yet"}
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              {hasActiveFilters
                ? "No saved interviews match your current search and filters. Try changing your filters or clearing them."
                : "Your generated interviews will appear here. Start by generating tailored questions for a role you are preparing for."}
            </p>

            {hasActiveFilters ? (
              <button
                type="button"
                onClick={handleClearFilters}
                className="mt-6 inline-flex rounded-xl border border-indigo-200 px-5 py-3 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
              >
                Clear filters
              </button>
            ) : (
              <Link
                href="/generate"
                className="mt-6 inline-flex rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Generate your first interview
              </Link>
            )}
          </div>
        )}

        {!loading && !errorMessage && interviews.length > 0 && (
          <>
            <div className="space-y-4">
              {interviews.map((interview) => (
                <article
                  key={interview.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-200 hover:shadow-md sm:p-6"
                >
                  <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-lg font-bold text-slate-900">
                        {interview.jobTitle}
                      </h3>

                      <p className="mt-2 text-sm text-slate-500">
                        Created {formatDate(interview.createdAt)}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                          {formatInterviewType(interview.interviewType)}
                        </span>

                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          {formatExperienceLevel(interview.experienceLevel)}
                        </span>

                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                          {interview._count.questions} questions
                        </span>
                      </div>
                    </div>

                    <Link
                      href={`/history/${interview.id}`}
                      className="inline-flex shrink-0 items-center justify-center rounded-xl border border-indigo-200 px-5 py-3 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50"
                    >
                      View interview →
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-8 flex flex-col items-center justify-between gap-4 sm:flex-row">
              <p className="text-sm text-slate-500">
                Page {pagination?.page ?? page} of{" "}
                {pagination?.totalPages ?? 1}
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((current) => current - 1)}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                <button
                  type="button"
                  disabled={
                    !pagination ||
                    page >= pagination.totalPages ||
                    loading
                  }
                  onClick={() => setPage((current) => current + 1)}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
