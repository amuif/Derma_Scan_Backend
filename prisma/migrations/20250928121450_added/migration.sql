/*
  Warnings:

  - Added the required column `status` to the `Clinic` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `EducationHub` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."Status" AS ENUM ('approved', 'pending');

-- AlterTable
ALTER TABLE "public"."Clinic" ADD COLUMN     "status" "public"."Status" NOT NULL;

-- AlterTable
ALTER TABLE "public"."EducationHub" ADD COLUMN     "status" "public"."Status" NOT NULL;
