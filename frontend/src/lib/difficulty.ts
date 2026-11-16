import type { QuestionDifficulty } from "@/lib/interview-api";

// Shared badge colours for difficulty levels across the platform.
export function getDifficultyBadgeClass(difficulty: QuestionDifficulty) {
  const difficultyClasses: Record<QuestionDifficulty, string> = {
    EASY: "bg-emerald-50 text-emerald-700",
    MEDIUM: "bg-amber-50 text-amber-700",
    HARD: "bg-rose-50 text-rose-700",
  };

  return difficultyClasses[difficulty];
}
