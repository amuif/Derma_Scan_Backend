-- DropForeignKey
ALTER TABLE "public"."Scan" DROP CONSTRAINT "Scan_userId_fkey";

-- AlterTable
ALTER TABLE "public"."Scan" ADD COLUMN     "approved" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "public"."Scan" ADD CONSTRAINT "Scan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
