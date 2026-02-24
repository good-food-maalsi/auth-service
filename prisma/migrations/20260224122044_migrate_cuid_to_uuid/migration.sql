/*
  Warnings:

  - The primary key for the `MagicToken` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Roles` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `franchiseId` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `UserRoles` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Changed the type of `id` on the `MagicToken` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `userId` on the `MagicToken` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `Roles` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `User` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `UserRoles` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `userId` on the `UserRoles` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `roleId` on the `UserRoles` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "MagicToken" DROP CONSTRAINT "MagicToken_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserRoles" DROP CONSTRAINT "UserRoles_roleId_fkey";

-- DropForeignKey
ALTER TABLE "UserRoles" DROP CONSTRAINT "UserRoles_userId_fkey";

-- AlterTable
ALTER TABLE "MagicToken" DROP CONSTRAINT "MagicToken_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "userId",
ADD COLUMN     "userId" UUID NOT NULL,
ADD CONSTRAINT "MagicToken_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Roles" DROP CONSTRAINT "Roles_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "Roles_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "franchiseId",
ADD COLUMN     "franchiseId" UUID,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "UserRoles" DROP CONSTRAINT "UserRoles_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "userId",
ADD COLUMN     "userId" UUID NOT NULL,
DROP COLUMN "roleId",
ADD COLUMN     "roleId" UUID NOT NULL,
ADD CONSTRAINT "UserRoles_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE INDEX "MagicToken_userId_idx" ON "MagicToken"("userId");

-- CreateIndex
CREATE INDEX "User_franchiseId_idx" ON "User"("franchiseId");

-- AddForeignKey
ALTER TABLE "UserRoles" ADD CONSTRAINT "UserRoles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRoles" ADD CONSTRAINT "UserRoles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MagicToken" ADD CONSTRAINT "MagicToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
