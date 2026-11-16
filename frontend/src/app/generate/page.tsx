
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";

import {
  generateInterview,
  InterviewApiError,
  type InterviewGeneration,
  type ExperienceLevel,
  type InterviewType,
} from "@/lib/interview-api";

export default function Home() {
  // Form state
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [experienceLevel, setExperienceLevel] =
    useState<ExperienceLevel>("JUNIOR");
  const [interviewType, setInterviewType] =
    useState<InterviewType>("TECHNICAL");
  const [questionCount, setQuestionCount] = useState("5");

  // API and results state
  const [loading, setLoading] = useState(false);
  const [generation, setGeneration] =
    useState<InterviewGeneration | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [validationErrors, setValidationErrors] = useState<
    Array<{ field: string; message: string }>
  >([]);

  // Submit the form to the Fastify backend.
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setErrorMessage("");
    setValidationErrors([]);
    setGeneration(null);

    try {
      const result = await generateInterview({
        jobTitle: jobTitle.trim(),
        jobDescription: jobDescription.trim(),
        experienceLevel,
        interviewType,
        questionCount: Number(questionCount),
      });

      setGeneration(result);
    } catch (error) {
      if (error instanceof InterviewApiError) {
        setErrorMessage(error.message);
        setValidationErrors(error.details ?? []);
      } else {
        // Keep internal server and network details out of the UI.
        setErrorMessage(
          "Unable to reach the server. Please check your connection and try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-slate-900">
      {/* Top navigation */}
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
              AI-powered interview preparation
            </span>

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-50 text-sm font-semibold text-indigo-700">
              CM
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        {/* Page introduction */}
        <section className="mb-9">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
            <span className="h-2 w-2 rounded-full bg-indigo-500" />
            INTERVIEW PREPARATION WORKSPACE
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Prepare for your next interview.
          </h1>

          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
            Generate tailored interview questions based on a job description,
            role, and experience level. Focus your preparation on what matters.
          </p>
        </section>

        {/* Main workspace */}
        <div className="grid gap-7 lg:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
          {/* Generation form */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-7">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-lg text-indigo-600">
                ✦
              </div>

              <h2 className="text-xl font-bold text-slate-900">
                Create an interview
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Provide the role details and customize your interview.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Job title */}
              <div>
                <label
                  htmlFor="jobTitle"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Job title <span className="text-red-500">*</span>
                </label>

                <input
                  id="jobTitle"
                  name="jobTitle"
                  type="text"
                  required
                  minLength={2}
                  maxLength={150}
                  value={jobTitle}
                  onChange={(event) => setJobTitle(event.target.value)}
                  placeholder="e.g. Junior Backend Developer"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                />
              </div>

              {/* Job description */}
              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label
                    htmlFor="jobDescription"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Job description <span className="text-red-500">*</span>
                  </label>

                  <span className="text-xs text-slate-400">
                    {jobDescription.length}/10,000
                  </span>
                </div>

                <textarea
                  id="jobDescription"
                  name="jobDescription"
                  required
                  minLength={20}
                  maxLength={10000}
                  rows={7}
                  value={jobDescription}
                  onChange={(event) =>
                    setJobDescription(event.target.value)
                  }
                  placeholder="Paste the job description here. Include responsibilities, required skills, qualifications, and other relevant details..."
                  className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                />

                <p className="mt-2 text-xs text-slate-400">
                  Include relevant details for more targeted questions.
                </p>
              </div>

              {/* Interview settings */}
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="experienceLevel"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Experience level
                  </label>

                  <select
                    id="experienceLevel"
                    name="experienceLevel"
                    value={experienceLevel}
                    onChange={(event) =>
                      setExperienceLevel(
                        event.target.value as ExperienceLevel,
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                  >
                    <option value="JUNIOR">Junior</option>
                    <option value="MID">Mid-level</option>
                    <option value="SENIOR">Senior</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="interviewType"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Interview type
                  </label>

                  <select
                    id="interviewType"
                    name="interviewType"
                    value={interviewType}
                    onChange={(event) =>
                      setInterviewType(
                        event.target.value as InterviewType,
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                  >
                    <option value="TECHNICAL">Technical</option>
                    <option value="BEHAVIORAL">Behavioral</option>
                    <option value="MIXED">Mixed</option>
                  </select>
                </div>
              </div>

              {/* Question count */}
              <div>
                <label
                  htmlFor="questionCount"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Number of questions
                </label>

                <select
                  id="questionCount"
                  name="questionCount"
                  value={questionCount}
                  onChange={(event) => setQuestionCount(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 sm:max-w-48"
                >
                  {[3, 5, 10, 15, 20].map((count) => (
                    <option key={count} value={count}>
                      {count} questions
                    </option>
                  ))}
                </select>
              </div>

              {/* API error feedback */}
              {errorMessage && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  <p className="font-semibold">{errorMessage}</p>

                  {validationErrors.length > 0 && (
                    <ul className="mt-2 list-inside list-disc space-y-1">
                      {validationErrors.map((item, index) => (
                        <li key={`${item.field}-${index}`}>
                          {item.field}: {item.message}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Generating questions...
                  </>
                ) : (
                  <>
                    <span>✦</span>
                    Generate interview questions
                  </>
                )}
              </button>

              <p className="text-center text-xs text-slate-400">
                Your job details are processed by our backend.
              </p>
            </form>
          </section>

          {/* Results panel */}
          <aside className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Generated questions
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Your personalized interview preparation.
                </p>
              </div>

              <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-500">
                {generation ? "Generated" : "Preview"}
              </span>
            </div>

            {loading ? (
              <div
                role="status"
                className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-indigo-200 bg-indigo-50/50 px-6 py-12 text-center"
              >
                <div className="mb-5 h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />

                <h3 className="text-base font-semibold text-slate-800">
                  Generating your questions
                </h3>

                <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">
                  Gemini is analyzing the job details and preparing tailored
                  interview questions. This may take a few seconds.
                </p>
              </div>
            ) : generation ? (
              <div aria-live="polite" className="space-y-4">
                <div className="rounded-xl bg-indigo-50 p-4">
                  <p className="text-sm font-semibold text-indigo-900">
                    {generation.jobTitle}
                  </p>

                  <p className="mt-1 text-xs text-indigo-700">
                    {generation.experienceLevel.toLowerCase()} ·{" "}
                    {generation.interviewType.toLowerCase()} ·{" "}
                    {generation.questions.length} questions
                  </p>
                </div>

                {generation.questions.map((question) => (
                  <article
                    key={question.id}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Question {question.position}
                      </span>

                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                        {question.difficulty}
                      </span>
                    </div>

                    <h3 className="text-sm font-semibold leading-6 text-slate-900">
                      {question.question}
                    </h3>

                    <div className="mt-3">
                      <span className="text-xs font-semibold text-indigo-600">
                        {question.category}
                      </span>
                    </div>

                    <div className="mt-4 rounded-lg bg-slate-50 p-3">
                      <p className="mb-1 text-xs font-semibold text-slate-700">
                        Evaluation criteria
                      </p>

                      <p className="text-xs leading-5 text-slate-600">
                        {question.evaluationCriteria}
                      </p>
                    </div>
                  </article>
                ))}

                {/* Gemini usage and performance metadata */}
                {generation.usage && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <h3 className="text-sm font-semibold text-slate-800">
                      Generation details
                    </h3>

                    <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-slate-400">Model</p>
                        <p className="mt-1 font-medium text-slate-700">
                          {generation.model}
                        </p>
                      </div>

                      <div>
                        <p className="text-slate-400">Response time</p>
                        <p className="mt-1 font-medium text-slate-700">
                          {generation.usage.latencyMs} ms
                        </p>
                      </div>

                      <div>
                        <p className="text-slate-400">Input tokens</p>
                        <p className="mt-1 font-medium text-slate-700">
                          {generation.usage.inputTokens ?? "Unavailable"}
                        </p>
                      </div>

                      <div>
                        <p className="text-slate-400">Output tokens</p>
                        <p className="mt-1 font-medium text-slate-700">
                          {generation.usage.outputTokens ?? "Unavailable"}
                        </p>
                      </div>

                      <div>
                        <p className="text-slate-400">Total tokens</p>
                        <p className="mt-1 font-medium text-slate-700">
                          {generation.usage.totalTokens ?? "Unavailable"}
                        </p>
                      </div>

                      <div>
                        <p className="text-slate-400">Provider</p>
                        <p className="mt-1 font-medium capitalize text-slate-700">
                          {generation.provider}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-6 py-12 text-center">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-3xl text-indigo-500">
                  ✧
                </div>

                <h3 className="text-base font-semibold text-slate-800">
                  Your questions will appear here
                </h3>

                <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">
                  Complete the interview details and generate your questions.
                  They will be organized by category and difficulty.
                </p>
              </div>
            )}

            {/* What the user can expect */}
            {!generation && !loading && (
              <div className="mt-6">
                <h3 className="mb-4 text-sm font-semibold text-slate-700">
                  What you&apos;ll get
                </h3>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-sm text-emerald-600">
                      ✓
                    </span>

                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        Role-specific questions
                      </p>

                      <p className="mt-0.5 text-xs leading-5 text-slate-500">
                        Questions tailored to the job requirements.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-sm text-blue-600">
                      ✓
                    </span>

                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        Difficulty levels
                      </p>

                      <p className="mt-0.5 text-xs leading-5 text-slate-500">
                        Easy, medium, and challenging questions.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-sm text-amber-600">
                      ✓
                    </span>

                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        Evaluation criteria
                      </p>

                      <p className="mt-0.5 text-xs leading-5 text-slate-500">
                        Understand what a strong answer should demonstrate.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </aside>
        </div>

        <footer className="mt-10 border-t border-slate-200 py-6 text-center text-xs text-slate-400">
          InterviewIQ · AI-powered interview preparation
        </footer>
      </main>
    </div>
  );
}
