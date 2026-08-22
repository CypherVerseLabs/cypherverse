-- CreateEnum
CREATE TYPE "ProjectTemplate" AS ENUM ('editor', 'found');

-- AlterTable
ALTER TABLE "Project"
ADD COLUMN "template" "ProjectTemplate" NOT NULL DEFAULT 'editor';
