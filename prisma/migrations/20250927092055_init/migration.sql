/*
  Warnings:

  - The values [LOW,MEDIUM,HIGH] on the enum `RiskLevel` will be removed. If these variants are still used in the database, this will fail.
  - Added the required column `role` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."EducationCategory" AS ENUM ('tips', 'prevention', 'awareness', 'treatment');

-- AlterEnum
BEGIN;
CREATE TYPE "public"."RiskLevel_new" AS ENUM ('low', 'medium', 'high');
ALTER TABLE "public"."Scan" ALTER COLUMN "risk" TYPE "public"."RiskLevel_new" USING ("risk"::text::"public"."RiskLevel_new");
ALTER TYPE "public"."RiskLevel" RENAME TO "RiskLevel_old";
ALTER TYPE "public"."RiskLevel_new" RENAME TO "RiskLevel";
DROP TYPE "public"."RiskLevel_old";
COMMIT;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "role" "public"."UserRole" NOT NULL;

-- CreateTable
CREATE TABLE "public"."EducationHub" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" "public"."EducationCategory" NOT NULL,
    "language" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EducationHub_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Clinic" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "specialties" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Clinic_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."EducationHub" ADD CONSTRAINT "EducationHub_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
