/*
  Warnings:

  - You are about to drop the column `deptShortId` on the `Subject` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[subjectId,teacherId,academicYear,year,semester,section]` on the table `SubjectOffering` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `section` to the `Enrollment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `academicYear` to the `SubjectOffering` table without a default value. This is not possible if the table is not empty.
  - Made the column `section` on table `SubjectOffering` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "SubjectOffering_subjectId_teacherId_year_semester_section_key";

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "subjectOfferingId" TEXT;

-- AlterTable
ALTER TABLE "Enrollment" ADD COLUMN     "section" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Subject" DROP COLUMN "deptShortId";

-- AlterTable
ALTER TABLE "SubjectOffering" ADD COLUMN     "academicYear" TEXT NOT NULL,
ALTER COLUMN "section" SET NOT NULL;

-- CreateTable
CREATE TABLE "SubjectEnrollment" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "subjectOfferingId" TEXT NOT NULL,

    CONSTRAINT "SubjectEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SubjectEnrollment_subjectOfferingId_idx" ON "SubjectEnrollment"("subjectOfferingId");

-- CreateIndex
CREATE UNIQUE INDEX "SubjectEnrollment_studentId_subjectOfferingId_key" ON "SubjectEnrollment"("studentId", "subjectOfferingId");

-- CreateIndex
CREATE INDEX "AttendanceMonthly_subjectOfferingId_idx" ON "AttendanceMonthly"("subjectOfferingId");

-- CreateIndex
CREATE INDEX "AttendanceRecord_studentId_idx" ON "AttendanceRecord"("studentId");

-- CreateIndex
CREATE INDEX "AttendanceRecord_sessionId_idx" ON "AttendanceRecord"("sessionId");

-- CreateIndex
CREATE INDEX "AttendanceSession_date_idx" ON "AttendanceSession"("date");

-- CreateIndex
CREATE INDEX "Enrollment_academicYear_year_semester_section_idx" ON "Enrollment"("academicYear", "year", "semester", "section");

-- CreateIndex
CREATE INDEX "Mark_subjectOfferingId_idx" ON "Mark"("subjectOfferingId");

-- CreateIndex
CREATE INDEX "Student_departmentId_idx" ON "Student"("departmentId");

-- CreateIndex
CREATE INDEX "SubjectOffering_teacherId_idx" ON "SubjectOffering"("teacherId");

-- CreateIndex
CREATE INDEX "SubjectOffering_academicYear_year_semester_section_idx" ON "SubjectOffering"("academicYear", "year", "semester", "section");

-- CreateIndex
CREATE UNIQUE INDEX "SubjectOffering_subjectId_teacherId_academicYear_year_semes_key" ON "SubjectOffering"("subjectId", "teacherId", "academicYear", "year", "semester", "section");

-- AddForeignKey
ALTER TABLE "SubjectEnrollment" ADD CONSTRAINT "SubjectEnrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectEnrollment" ADD CONSTRAINT "SubjectEnrollment_subjectOfferingId_fkey" FOREIGN KEY ("subjectOfferingId") REFERENCES "SubjectOffering"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_subjectOfferingId_fkey" FOREIGN KEY ("subjectOfferingId") REFERENCES "SubjectOffering"("id") ON DELETE SET NULL ON UPDATE CASCADE;
