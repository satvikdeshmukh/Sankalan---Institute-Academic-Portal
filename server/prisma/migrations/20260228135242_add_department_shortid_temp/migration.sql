/*
  Warnings:

  - A unique constraint covering the columns `[shortId]` on the table `Department` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,departmentId]` on the table `Subject` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Department" ADD COLUMN     "shortId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Department_shortId_key" ON "Department"("shortId");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_name_departmentId_key" ON "Subject"("name", "departmentId");
