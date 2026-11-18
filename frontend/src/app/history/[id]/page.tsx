
"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import {
  bookmarkInterview,
  getInterviewById,
  InterviewApiError,
  removeInterviewBookmark,
  type SavedInterview,
} from "@/lib/interview-api";

import { useAuth } from "@/providers/auth-provider";

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

function getDifficultyStyle(difficulty: string): string {
  const styles: Record<string, string> = {
    EASY: "bg-emerald-50 text-emerald-700",
    MEDIUM: "bg-amber-50 text-amber-700",
    HARD: "bg-red-50 text-red-700",
  };

  return styles[difficulty] ?? "bg-slate-100 text-slate-700";
}

// Displayed while Next.js resolves the dynamic route parameters.
function InterviewPageFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8fc] px-5">
      <div className="text-center">
        <div
          className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600"
          role="status"
          aria-label="Loading interview page"
        />

        <p className="mt-4 text-sm font-medium text-slate-600">
          Loading interview...
        </p>
      </div>
    </main>
  );
}

function SavedInterviewContent() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const interviewId = params.id;

  const {
    status,
    user,
    accessToken,
    refreshAccessToken,
    logout,
  } = useAuth();

  const [interview, setInterview] = useState<SavedInterview | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [bookmarkUpdating, setBookmarkUpdating] = useState(false);
  const [bookmarkMessage, setBookmarkMessage] = useState("");
  const [bookmarkError, setBookmarkError] = useState("");

  // Redirect visitors who do not have an authenticated session.
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(
        `/login?next=${encodeURIComponent(`/history/${interviewId}`)}`,
      );
    }
  }, [status, router, interviewId]);

  // Retrieve the saved interview, refreshing the access token once if needed.
  const loadInterview = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    setNotFound(false);

    try {
      let token = accessToken ?? await refreshAccessToken();

      let result: SavedInterview;

      try {
        result = await getInterviewById(interviewId, token);
      } catch (error) {
        if (!(error instanceof InterviewApiError) || error.status !== 401) {
          throw error;
        }

        token = await refreshAccessToken();
        result = await getInterviewById(interviewId, token);
      }

      setInterview(result);
    } catch (error) {
      setInterview(null);

      if (error instanceof InterviewApiError && error.status === 404) {
        setNotFound(true);
        setErrorMessage("This interview could not be found.");
      } else if (error instanceof InterviewApiError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage(
          "Unable to load this interview. Please check your connection and try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  }, [accessToken, refreshAccessToken, interviewId]);

  // Defer the initial request to avoid synchronous state updates in an effect.
  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    const timeoutId = setTimeout(() => {
      void loadInterview();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [status, loadInterview]);

  async function handleLogout() {
    setLoggingOut(true);

    await logout().catch(() => undefined);

    router.replace("/login");
  }

  // Save or remove the current interview from the user's bookmarks.
  async function handleBookmarkToggle() {
    if (!interview || bookmarkUpdating) {
      return;
    }

    setBookmarkUpdating(true);
    setBookmarkError("");
    setBookmarkMessage("");

    try {
      let token = accessToken ?? await refreshAccessToken();

      // Retry once with a refreshed token if the access token has expired.
      try {
        if (interview.isBookmarked) {
          await removeInterviewBookmark(interview.id, token);
        } else {
          await bookmarkInterview(interview.id, token);
        }
      } catch (error) {
        if (!(error instanceof InterviewApiError) || error.status !== 401) {
          throw error;
        }

        token = await refreshAccessToken();

        if (interview.isBookmarked) {
          await removeInterviewBookmark(interview.id, token);
        } else {
          await bookmarkInterview(interview.id, token);
        }
      }

      const nextBookmarkedState = !interview.isBookmarked;

      setInterview((current) =>
        current
          ? { ...current, isBookmarked: nextBookmarkedState }
          : current,
      );

      setBookmarkMessage(
        nextBookmarkedState
          ? "Interview added to your bookmarks."
          : "Interview removed from your bookmarks.",
      );
    } catch (error) {
      setBookmarkError(
        error instanceof InterviewApiError
          ? error.message
          : "Unable to update this bookmark. Please try again.",
      );
    } finally {
      setBookmarkUpdating(false);
    }
  }

  if (status !== "authenticated") {
    return <InterviewPageFallback />;
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

      <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
        <Link
          href="/history"
          className="inline-flex items-center text-sm font-semibold text-indigo-600 transition hover:text-indigo-800"
        >
          ← Back to interview history
        </Link>

        {loading && (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <div
              className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600"
              role="status"
              aria-label="Loading interview"
            />

            <p className="mt-4 text-sm text-slate-500">
              Loading your saved interview...
            </p>
          </div>
        )}

        {!loading && errorMessage && (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6">
            <h1 className="text-lg font-bold text-red-800">
              {notFound ? "Interview not found" : "Unable to load interview"}
            </h1>

            <p className="mt-2 text-sm text-red-700">
              {errorMessage}
            </p>

            {!notFound && (
              <button
                type="button"
                onClick={() => void loadInterview()}
                className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-800"
              >
                Try again
              </button>
            )}

            <div className="mt-5">
              <Link
                href="/history"
                className="text-sm font-semibold text-indigo-700 hover:underline"
              >
                Return to interview history
              </Link>
            </div>
          </div>
        )}

        {!loading && !errorMessage && interview && (
          <>
            <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <p className="text-xs font-bold tracking-widest text-indigo-600">
                SAVED INTERVIEW
              </p>

              <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
                {interview.jobTitle}
              </h1>

              <p className="mt-3 text-sm text-slate-500">
                Created {formatDate(interview.createdAt)}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
                  {formatInterviewType(interview.interviewType)}
                </span>

                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                  {formatExperienceLevel(interview.experienceLevel)}
                </span>

                <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                  {interview.questions.length} questions
                </span>
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => void handleBookmarkToggle()}
                  disabled={bookmarkUpdating}
                  aria-pressed={interview.isBookmarked}
                  className={`rounded-xl px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                    interview.isBookmarked
                      ? "border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                      : "bg-indigo-600 text-white hover:bg-indigo-700"
                  }`}
                >
                  {bookmarkUpdating
                    ? "Updating bookmark..."
                    : interview.isBookmarked
                      ? "★ Remove bookmark"
                      : "☆ Save bookmark"}
                </button>

                {bookmarkMessage && (
                  <p className="mt-2 text-sm text-emerald-700" role="status">
                    {bookmarkMessage}
                  </p>
                )}

                {bookmarkError && (
                  <p className="mt-2 text-sm text-red-700" role="alert">
                    {bookmarkError}
                  </p>
                )}
              </div>

              {interview.jobDescription && (
                <div className="mt-7 border-t border-slate-100 pt-6">
                  <h2 className="text-sm font-bold text-slate-800">
                    Job description
                  </h2>

                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                    {interview.jobDescription}
                  </p>
                </div>
              )}
            </section>

            <section className="mt-8">
              <div className="mb-5">
                <h2 className="text-xl font-bold">
                  Generated interview questions
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Review each question and the criteria that can guide your preparation.
                </p>
              </div>

              {interview.questions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
                  <p className="font-semibold text-slate-700">
                    No questions are available for this interview.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {interview.questions.map((question) => (
                    <article
                      key={question.id}
                      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="text-xs font-bold tracking-wider text-indigo-600">
                          QUESTION {question.position}
                        </span>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${getDifficultyStyle(question.difficulty)}`}
                        >
                          {question.difficulty}
                        </span>
                      </div>

                      <h3 className="mt-5 text-lg font-semibold leading-7 text-slate-900">
                        {question.question}
                      </h3>

                      <div className="mt-5">
                        <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
                          Category
                        </span>

                        <p className="mt-1 text-sm font-medium text-slate-700">
                          {question.category}
                        </p>
                      </div>

                      <div className="mt-5 rounded-xl bg-slate-50 p-4">
                        <h4 className="text-sm font-bold text-slate-800">
                          Evaluation criteria
                        </h4>

                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                          {question.evaluationCriteria}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                href="/history"
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Back to history
              </Link>

              <Link
                href="/generate"
                className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                Generate new questions
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default function SavedInterviewPage() {
  return (
    <Suspense fallback={<InterviewPageFallback />}>
      <SavedInterviewContent />
    </Suspense>
  );
}
