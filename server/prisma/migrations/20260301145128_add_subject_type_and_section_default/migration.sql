/*
  Warnings:

  - A unique constraint covering the columns `[name,departmentId,type]` on the table `Subject` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "SubjectType" AS ENUM ('THEORY', 'PRACTICAL');

-- DropIndex
DROP INDEX "Subject_name_departmentId_key";

-- AlterTable
ALTER TABLE "Enrollment" ALTER COLUMN "section" SET DEFAULT 'A';

-- AlterTable
ALTER TABLE "Subject" ADD COLUMN     "type" "SubjectType" NOT NULL DEFAULT 'THEORY';

-- CreateIndex
CREATE UNIQUE INDEX "Subject_name_departmentId_type_key" ON "Subject"("name", "departmentId", "type");
