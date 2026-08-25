-- CreateTable
CREATE TABLE "ProjectAsset" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectAsset_projectId_idx"
ON "ProjectAsset"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectAsset_projectId_storageKey_key"
ON "ProjectAsset"("projectId", "storageKey");

-- AddForeignKey
ALTER TABLE "ProjectAsset"
ADD CONSTRAINT "ProjectAsset_projectId_fkey"
FOREIGN KEY ("projectId")
REFERENCES "Project"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;