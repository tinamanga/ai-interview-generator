import Link from "next/link";
import { getDifficultyBadgeClass } from "@/lib/difficulty";
import type { QuestionDifficulty } from "@/lib/interview-api";

const features = [
  {
    number: "01",
    title: "Questions tailored to the role",
    description:
      "Generate questions using the actual job title and job description instead of relying on generic interview question lists.",
    icon: "✦",
  },
  {
    number: "02",
    title: "Choose your interview level",
    description:
      "Prepare for junior, mid-level, or senior positions with questions suited to the experience required.",
    icon: "◈",
  },
  {
    number: "03",
    title: "Understand what interviewers look for",
    description:
      "Each generated question includes evaluation criteria to help you understand what a strong answer should demonstrate.",
    icon: "✓",
  },
];

const steps = [
  {
    number: "01",
    title: "Enter the job details",
    description:
      "Provide the job title and paste the job description so the AI understands the role.",
  },
  {
    number: "02",
    title: "Customize your interview",
    description:
      "Choose your experience level, interview type, and how many questions you want.",
  },
  {
    number: "03",
    title: "Generate and prepare",
    description:
      "Receive tailored interview questions organized by category and difficulty, with evaluation criteria.",
  },
];

const sampleQuestions: {
  category: string;
  difficulty: QuestionDifficulty;
  question: string;
  criteria: string;
}[] = [
  {
    category: "Backend development",
    difficulty: "MEDIUM",
    question:
      "How would you design a REST API that supports authentication and role-based access control?",
    criteria:
      "API design, authentication, authorization, security, and maintainability.",
  },
  {
    category: "Database management",
    difficulty: "EASY",
    question:
      "What is the difference between a primary key and a foreign key in a relational database?",
    criteria:
      "Relational database concepts, data integrity, and practical understanding.",
  },
  {
    category: "Problem solving",
    difficulty: "HARD",
    question:
      "How would you investigate and resolve a performance issue in a production application?",
    criteria:
      "Systematic debugging, monitoring, root-cause analysis, and communication.",
  },
];

function ArrowIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      className="h-4 w-4"
    >
      <path
        d="M4.167 10h11.666M10 4.167 15.833 10 10 15.833"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-white text-slate-900">
      {/* Public navigation */}
      <header className="relative z-10 border-b border-slate-100 bg-white">
        <nav
          aria-label="Main navigation"
          className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10"
        >
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-xl font-bold text-white shadow-sm shadow-indigo-200">
              Q
            </span>

            <span className="text-xl font-bold tracking-tight">
              Interview<span className="text-indigo-600">IQ</span>
            </span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <a
              href="#how-it-works"
              className="text-sm font-medium text-slate-600 transition hover:text-indigo-600"
            >
              How it works
            </a>
            <a
              href="#features"
              className="text-sm font-medium text-slate-600 transition hover:text-indigo-600"
            >
              Features
            </a>
            <a
              href="#preview"
              className="text-sm font-medium text-slate-600 transition hover:text-indigo-600"
            >
              Preview
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login?next=%2Fgenerate"
              className="hidden rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:inline-flex"
            >
              Sign in
            </Link>

            <Link
              href="/register?next=%2Fgenerate"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200"
            >
              Get started
              <ArrowIcon />
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative isolate">
        <div className="pointer-events-none absolute -right-48 -top-36 -z-10 h-[560px] w-[560px] rounded-full bg-indigo-50/80 blur-3xl" />
        <div className="pointer-events-none absolute -left-48 top-40 -z-10 h-[400px] w-[400px] rounded-full bg-blue-50/70 blur-3xl" />

        <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 py-20 sm:px-8 sm:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:px-10 lg:py-28">
          <div>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white/80 px-4 py-2 text-xs font-semibold tracking-wide text-indigo-700 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-indigo-500" />
              AI-POWERED INTERVIEW PREPARATION
            </div>

            <h1 className="max-w-2xl text-4xl leading-[1.13] font-bold tracking-tight text-slate-950 sm:text-5xl lg:text-[60px]">
              Walk into your next interview{" "}
              <span className="text-indigo-600">prepared.</span>
            </h1>

            <p className="mt-7 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
              Stop guessing what interviewers might ask. InterviewIQ uses AI
              to generate tailored interview questions based on the job role,
              job description, and experience level you&apos;re targeting.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register?next=%2Fgenerate"
                className="inline-flex min-h-13 items-center justify-center gap-3 rounded-xl bg-indigo-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200/70 transition hover:-translate-y-0.5 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200"
              >
                Generate interview questions
                <ArrowIcon />
              </Link>

              <a
                href="#how-it-works"
                className="inline-flex min-h-13 items-center justify-center rounded-xl border border-slate-200 bg-white px-7 py-3.5 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50/50"
              >
                See how it works
              </a>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs font-medium text-slate-500">
              <span className="flex items-center gap-2">
                <span className="text-emerald-600">✓</span>
                Role-specific questions
              </span>
              <span className="flex items-center gap-2">
                <span className="text-emerald-600">✓</span>
                Customizable interviews
              </span>
              <span className="flex items-center gap-2">
                <span className="text-emerald-600">✓</span>
                Evaluation criteria
              </span>
            </div>
          </div>

          {/* Product preview card */}
          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute -inset-5 rounded-[2rem] bg-indigo-100/60 blur-2xl" />

            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-300/50">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 font-bold text-white">
                    Q
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      InterviewIQ
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Interview preview
                    </p>
                  </div>
                </div>

                <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-semibold text-emerald-700">
                  SAMPLE OUTPUT
                </span>
              </div>

              <div className="bg-slate-50/80 p-5 sm:p-6">
                <div className="rounded-xl border border-indigo-100 bg-white p-4 shadow-sm">
                  <p className="text-[10px] font-bold tracking-wider text-indigo-600 uppercase">
                    Target position
                  </p>
                  <h2 className="mt-1 text-lg font-bold text-slate-900">
                    Junior Backend Developer
                  </h2>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-md bg-indigo-50 px-2.5 py-1 text-[10px] font-semibold text-indigo-700">
                      Junior
                    </span>
                    <span className="rounded-md bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">
                      Technical
                    </span>
                    <span className="rounded-md bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">
                      5 questions
                    </span>
                  </div>
                </div>

                <div className="mb-4 mt-6 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800">
                    Generated questions
                  </h3>
                  <span className="text-xs text-slate-400">
                    Example preview
                  </span>
                </div>

                <div className="space-y-3">
                  {sampleQuestions.map((question, index) => (
                    <article
                      key={question.category}
                      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                          Question 0{index + 1}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[9px] font-bold ${getDifficultyBadgeClass(question.difficulty)}`}
                        >
                          {question.difficulty}
                        </span>
                      </div>

                      <p className="text-xs leading-6 font-semibold text-slate-800 sm:text-sm">
                        {question.question}
                      </p>

                      <p className="mt-3 text-[10px] font-semibold text-indigo-600">
                        {question.category}
                      </p>

                      <div className="mt-3 rounded-lg bg-slate-50 p-3">
                        <p className="text-[10px] font-bold text-slate-600">
                          What a strong answer should demonstrate
                        </p>
                        <p className="mt-1 text-[10px] leading-5 text-slate-500">
                          {question.criteria}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>

                <p className="mt-4 text-center text-[10px] text-slate-400">
                  Illustrative questions · Actual results are generated from
                  your job details
                </p>
              </div>
            </div>

            <div className="absolute -bottom-5 -left-4 hidden rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-xl sm:block lg:-left-8">
              <p className="text-[10px] font-medium text-slate-400">
                Preparation starts here
              </p>
              <p className="mt-1 text-sm font-bold text-slate-800">
                Practice with purpose.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="scroll-mt-20 border-y border-slate-100 bg-slate-50/70"
      >
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold tracking-[0.2em] text-indigo-600 uppercase">
              Simple process
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              From job description to interview preparation
            </h2>
            <p className="mt-5 text-base leading-7 text-slate-600">
              Turn the requirements of a job into a focused interview
              preparation plan in three simple steps.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {steps.map((step) => (
              <article
                key={step.number}
                className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/60"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-sm font-bold text-indigo-700">
                  {step.number}
                </span>

                <h3 className="mt-6 text-lg font-bold text-slate-900">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="scroll-mt-20 bg-white"
      >
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div className="lg:sticky lg:top-28">
              <p className="text-xs font-bold tracking-[0.2em] text-indigo-600 uppercase">
                Built for better preparation
              </p>

              <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                More than a list of interview questions.
              </h2>

              <p className="mt-5 text-base leading-8 text-slate-600">
                Good preparation starts with understanding the role. InterviewIQ
                helps you focus on relevant questions and the skills behind
                them, so you can prepare more deliberately.
              </p>

              <Link
                href="/register?next=%2Fgenerate"
                className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-indigo-600 transition hover:gap-3 hover:text-indigo-700"
              >
                Start preparing
                <ArrowIcon />
              </Link>
            </div>

            <div className="space-y-4">
              {features.map((feature) => (
                <article
                  key={feature.number}
                  className="flex gap-5 rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-indigo-200 hover:bg-indigo-50/20 sm:p-7"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-lg font-bold text-indigo-600">
                    {feature.icon}
                  </span>

                  <div>
                    <p className="text-[10px] font-bold tracking-wider text-indigo-500 uppercase">
                      Feature {feature.number}
                    </p>
                    <h3 className="mt-2 text-lg font-bold text-slate-900">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-slate-600">
                      {feature.description}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Question preview explanation */}
      <section
        id="preview"
        className="scroll-mt-20 bg-slate-950"
      >
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-20 sm:px-8 lg:grid-cols-2 lg:px-10 lg:py-24">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-indigo-300 uppercase">
              See what you can prepare for
            </p>

            <h2 className="mt-4 text-3xl leading-tight font-bold tracking-tight text-white sm:text-4xl">
              Know the questions. Understand the expectations.
            </h2>

            <p className="mt-5 max-w-xl text-base leading-8 text-slate-300">
              Your results are organized by question number, category, and
              difficulty. Evaluation criteria help you identify the concepts
              and skills you should demonstrate in your answers.
            </p>

            <Link
              href="/register?next=%2Fgenerate"
              className="mt-8 inline-flex items-center gap-3 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-indigo-700 transition hover:bg-indigo-50"
            >
              Try the question generator
              <ArrowIcon />
            </Link>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-6 sm:p-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-5">
              <div>
                <p className="text-sm font-bold text-white">
                  What you receive
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  An example of the generated output
                </p>
              </div>
              <span className="rounded-lg bg-emerald-400/10 px-3 py-1.5 text-[10px] font-bold text-emerald-300">
                STRUCTURED RESULTS
              </span>
            </div>

            <div className="mt-6 space-y-5">
              {[
                ["01", "Question", "A role-specific interview question."],
                ["02", "Category", "The skill or subject being assessed."],
                ["03", "Difficulty", "Easy, medium, or hard."],
                [
                  "04",
                  "Evaluation criteria",
                  "The qualities of a strong answer.",
                ],
              ].map(([number, title, description]) => (
                <div key={number} className="flex items-start gap-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-xs font-bold text-indigo-200">
                    {number}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-white">{title}</h3>
                    <p className="mt-1 text-xs leading-6 text-slate-400">
                      {description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final call to action */}
      <section className="bg-white px-5 py-20 sm:px-8 lg:px-10 lg:py-24">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl bg-indigo-600 px-7 py-14 text-center shadow-xl shadow-indigo-200/60 sm:px-12 sm:py-16">
          <p className="text-xs font-bold tracking-[0.2em] text-indigo-200 uppercase">
            Your next interview starts with preparation
          </p>

          <h2 className="mx-auto mt-5 max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Make your preparation count.
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-indigo-100 sm:text-base">
            Explore the tool, create your account when you&apos;re ready, and
            generate interview questions tailored to the opportunity you&apos;re
            pursuing.
          </p>

          <Link
            href="/register?next=%2Fgenerate"
            className="mt-8 inline-flex items-center justify-center gap-3 rounded-xl bg-white px-7 py-3.5 text-sm font-bold text-indigo-700 transition hover:-translate-y-0.5 hover:bg-indigo-50"
          >
            Get started
            <ArrowIcon />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-10">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
              Q
            </span>
            <span className="font-bold tracking-tight text-slate-800">
              Interview<span className="text-indigo-600">IQ</span>
            </span>
          </Link>

          <p className="text-xs text-slate-500">
            AI-powered interview preparation.
          </p>

          <div className="flex items-center gap-5 text-xs font-medium text-slate-500">
            <Link
              href="/login?next=%2Fgenerate"
              className="transition hover:text-indigo-600"
            >
              Sign in
            </Link>
            <Link
              href="/register?next=%2Fgenerate"
              className="transition hover:text-indigo-600"
            >
              Create account
            </Link>
          </div>
        </div>

        <div className="border-t border-slate-100 py-4 text-center text-[11px] text-slate-400">
          © 2026 InterviewIQ. All rights reserved.
        </div>
      </footer>
    </main>
  );
}
