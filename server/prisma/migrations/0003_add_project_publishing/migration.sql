-- AlterTable
ALTER TABLE "Project" ADD COLUMN "slug" TEXT;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN "publishedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Project_slug_key" ON "Project"("slug");

-- CreateIndex
CREATE INDEX "Project_publishedAt_idx" ON "Project"("publishedAt");
