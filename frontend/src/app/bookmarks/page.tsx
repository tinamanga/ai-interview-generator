"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  getInterviewBookmarks,
  InterviewApiError,
  removeInterviewBookmark,
  type InterviewBookmarkItem,
  type InterviewHistoryPagination,
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

export default function InterviewBookmarksPage() {
  const router = useRouter();

  const {
    status,
    user,
    accessToken,
    refreshAccessToken,
    logout,
  } = useAuth();

  const [bookmarks, setBookmarks] = useState<InterviewBookmarkItem[]>([]);
  const [pagination, setPagination] =
    useState<InterviewHistoryPagination | null>(null);

  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  // Redirect visitors who do not have an authenticated session.
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login?next=%2Fbookmarks");
    }
  }, [status, router]);

  // Load the current page of bookmarks, refreshing an expired token once.
  const loadBookmarks = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      let token = accessToken ?? await refreshAccessToken();

      let result;

      try {
        result = await getInterviewBookmarks(page, PAGE_SIZE, token);
      } catch (error) {
        if (!(error instanceof InterviewApiError) || error.status !== 401) {
          throw error;
        }

        token = await refreshAccessToken();
        result = await getInterviewBookmarks(page, PAGE_SIZE, token);
      }

      setBookmarks(result.bookmarks);
      setPagination(result.pagination);
    } catch (error) {
      if (error instanceof InterviewApiError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage(
          "Unable to load your bookmarks. Please check your connection and try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  }, [accessToken, refreshAccessToken, page]);

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    // Defer the request so loading state updates happen outside the effect.
    const timeoutId = setTimeout(() => {
      void loadBookmarks();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [status, loadBookmarks]);

  // Remove a bookmark and refresh the list to keep pagination accurate.
  async function handleRemoveBookmark(interviewId: string) {
    if (removingId) {
      return;
    }

    setRemovingId(interviewId);
    setErrorMessage("");
    setActionMessage("");

    try {
      let token = accessToken ?? await refreshAccessToken();

      try {
        await removeInterviewBookmark(interviewId, token);
      } catch (error) {
        if (!(error instanceof InterviewApiError) || error.status !== 401) {
          throw error;
        }

        token = await refreshAccessToken();
        await removeInterviewBookmark(interviewId, token);
      }

      setActionMessage("Interview removed from your bookmarks.");

      // If this was the last item on the page, move to the previous page.
      if (bookmarks.length === 1 && page > 1) {
        setPage((currentPage) => currentPage - 1);
      } else {
        await loadBookmarks();
      }
    } catch (error) {
      setErrorMessage(
        error instanceof InterviewApiError
          ? error.message
          : "Unable to remove this bookmark. Please try again.",
      );
    } finally {
      setRemovingId(null);
    }
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
              href="/history"
              className="rounded-lg px-3 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50"
            >
              My Interviews
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
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
              Bookmarked interviews
            </h1>

            <p className="mt-3 max-w-xl text-slate-600">
              Keep important interview question sets close and return to them
              whenever you need to practise.
            </p>
          </section>

          <Link
            href="/generate"
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            + Generate questions
          </Link>
        </div>

        {actionMessage && (
          <p
            className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
            role="status"
          >
            {actionMessage}
          </p>
        )}

        {errorMessage && (
          <div
            className="mb-5 rounded-xl border border-red-200 bg-red-50 p-5"
            role="alert"
          >
            <p className="text-sm text-red-700">{errorMessage}</p>

            <button
              type="button"
              onClick={() => void loadBookmarks()}
              disabled={loading}
              className="mt-3 text-sm font-semibold text-red-800 underline disabled:opacity-60"
            >
              Try again
            </button>
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <div
              className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600"
              role="status"
              aria-label="Loading bookmarks"
            />

            <p className="mt-4 text-sm text-slate-500">
              Loading your bookmarked interviews...
            </p>
          </div>
        ) : !errorMessage && bookmarks.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-2xl text-indigo-600">
              ☆
            </div>

            <h2 className="mt-5 text-xl font-bold text-slate-900">
              No bookmarked interviews yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              When you find an interview you want to revisit, save it here
              using the bookmark button on its detail page.
            </p>

            <Link
              href="/history"
              className="mt-6 inline-flex rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Browse interview history
            </Link>
          </section>
        ) : !errorMessage ? (
          <>
            <section
              aria-label="Your bookmarked interviews"
              className="space-y-4"
            >
              {bookmarks.map((bookmark) => {
                const interview = bookmark.generation;

                return (
                  <article
                    key={bookmark.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-200 sm:p-6"
                  >
                    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                            {formatInterviewType(interview.interviewType)}
                          </span>

                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                            {formatExperienceLevel(interview.experienceLevel)}
                          </span>
                        </div>

                        <h2 className="mt-3 text-lg font-bold text-slate-900">
                          {interview.jobTitle}
                        </h2>

                        <p className="mt-2 text-sm text-slate-500">
                          {interview._count.questions} questions
                          {" · "}
                          Created {formatDate(interview.createdAt)}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          Bookmarked {formatDate(bookmark.createdAt)}
                        </p>
                      </div>

                      <div className="flex shrink-0 flex-wrap gap-2">
                        <Link
                          href={`/history/${interview.id}`}
                          className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
                        >
                          View interview
                        </Link>

                        <button
                          type="button"
                          onClick={() => void handleRemoveBookmark(interview.id)}
                          disabled={removingId !== null}
                          className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {removingId === interview.id
                            ? "Removing..."
                            : "Remove"}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>

            {pagination && pagination.totalPages > 1 && (
              <nav
                aria-label="Bookmark pagination"
                className="mt-8 flex flex-wrap items-center justify-between gap-4"
              >
                <p className="text-sm text-slate-500">
                  Page {pagination.page} of {pagination.totalPages}
                </p>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((currentPage) => currentPage - 1)}
                    disabled={page <= 1 || loading}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Previous
                  </button>

                  <button
                    type="button"
                    onClick={() => setPage((currentPage) => currentPage + 1)}
                    disabled={page >= pagination.totalPages || loading}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </nav>
            )}
          </>
        ) : null}
      </main>
    </div>
  );
}
