/*
  Warnings:

  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- CreateEnum
CREATE TYPE "public"."RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- AlterTable
ALTER TABLE "public"."User" DROP CONSTRAINT "User_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "User_id_seq";

-- CreateTable
CREATE TABLE "public"."Scan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "imageQuality" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL,
    "risk" "public"."RiskLevel" NOT NULL,
    "notes" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Scan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ScanCondition" (
    "id" TEXT NOT NULL,
    "scanId" TEXT NOT NULL,
    "conditionId" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "ScanCondition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Condition" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Condition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ScanSymptom" (
    "id" TEXT NOT NULL,
    "scanId" TEXT NOT NULL,
    "symptomId" TEXT NOT NULL,
    "severity" INTEGER,

    CONSTRAINT "ScanSymptom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Symptom" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Symptom_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Condition_name_key" ON "public"."Condition"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Symptom_name_key" ON "public"."Symptom"("name");

-- AddForeignKey
ALTER TABLE "public"."Scan" ADD CONSTRAINT "Scan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ScanCondition" ADD CONSTRAINT "ScanCondition_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "public"."Scan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ScanCondition" ADD CONSTRAINT "ScanCondition_conditionId_fkey" FOREIGN KEY ("conditionId") REFERENCES "public"."Condition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ScanSymptom" ADD CONSTRAINT "ScanSymptom_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "public"."Scan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ScanSymptom" ADD CONSTRAINT "ScanSymptom_symptomId_fkey" FOREIGN KEY ("symptomId") REFERENCES "public"."Symptom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
