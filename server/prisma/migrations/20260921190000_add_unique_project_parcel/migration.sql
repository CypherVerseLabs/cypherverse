-- Enforce the application invariant:
-- one Parcel can have at most one Project.
--
-- The Prisma schema already declares Project.parcelId as @unique.
-- This migration reconciles the existing database constraint with
-- that schema without changing marketplace ownership behavior.

CREATE UNIQUE INDEX "Project_parcelId_key"
ON "Project"("parcelId");
