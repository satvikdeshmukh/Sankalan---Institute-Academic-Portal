/*
  Warnings:

  - Made the column `shortId` on table `Department` required. This step will fail if there are existing NULL values in that column.
  - Made the column `deptShortId` on table `Subject` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Department" ALTER COLUMN "shortId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Subject" ALTER COLUMN "deptShortId" SET NOT NULL;
