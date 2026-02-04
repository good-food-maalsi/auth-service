-- AlterTable
ALTER TABLE "User" ADD COLUMN "franchiseId" TEXT;

-- CreateIndex
CREATE INDEX "User_franchiseId_idx" ON "User"("franchiseId");
