-- CreateTable
CREATE TABLE "interview_bookmarks" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "generationId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interview_bookmarks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "interview_bookmarks_userId_createdAt_idx" ON "interview_bookmarks"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "interview_bookmarks_userId_generationId_key" ON "interview_bookmarks"("userId", "generationId");

-- AddForeignKey
ALTER TABLE "interview_bookmarks" ADD CONSTRAINT "interview_bookmarks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_bookmarks" ADD CONSTRAINT "interview_bookmarks_generationId_fkey" FOREIGN KEY ("generationId") REFERENCES "generations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
