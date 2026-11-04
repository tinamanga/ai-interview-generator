-- CreateEnum
CREATE TYPE "ExperienceLevel" AS ENUM ('JUNIOR', 'MID', 'SENIOR');

-- CreateEnum
CREATE TYPE "InterviewType" AS ENUM ('TECHNICAL', 'BEHAVIORAL', 'MIXED');

-- CreateEnum
CREATE TYPE "GenerationStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED');

-- CreateEnum
CREATE TYPE "QuestionDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateTable
CREATE TABLE "generations" (
    "id" UUID NOT NULL,
    "jobTitle" VARCHAR(150) NOT NULL,
    "jobDescription" TEXT NOT NULL,
    "experienceLevel" "ExperienceLevel" NOT NULL,
    "interviewType" "InterviewType" NOT NULL,
    "questionCount" INTEGER NOT NULL,
    "provider" VARCHAR(50) NOT NULL DEFAULT 'gemini',
    "model" VARCHAR(100) NOT NULL,
    "promptVersion" VARCHAR(20) NOT NULL DEFAULT 'v1',
    "status" "GenerationStatus" NOT NULL DEFAULT 'PENDING',
    "errorCode" VARCHAR(100),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMPTZ(3),

    CONSTRAINT "generations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generated_questions" (
    "id" UUID NOT NULL,
    "generationId" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "question" TEXT NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "difficulty" "QuestionDifficulty" NOT NULL,
    "evaluationCriteria" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "generated_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_records" (
    "id" UUID NOT NULL,
    "generationId" UUID NOT NULL,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "totalTokens" INTEGER,
    "latencyMs" INTEGER NOT NULL,
    "providerRequestId" VARCHAR(255),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "generations_createdAt_idx" ON "generations"("createdAt");

-- CreateIndex
CREATE INDEX "generations_status_idx" ON "generations"("status");

-- CreateIndex
CREATE INDEX "generated_questions_generationId_idx" ON "generated_questions"("generationId");

-- CreateIndex
CREATE UNIQUE INDEX "generated_questions_generationId_position_key" ON "generated_questions"("generationId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "usage_records_generationId_key" ON "usage_records"("generationId");

-- CreateIndex
CREATE INDEX "usage_records_createdAt_idx" ON "usage_records"("createdAt");

-- AddForeignKey
ALTER TABLE "generated_questions" ADD CONSTRAINT "generated_questions_generationId_fkey" FOREIGN KEY ("generationId") REFERENCES "generations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_records" ADD CONSTRAINT "usage_records_generationId_fkey" FOREIGN KEY ("generationId") REFERENCES "generations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
