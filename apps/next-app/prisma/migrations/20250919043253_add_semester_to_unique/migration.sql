/*
  Warnings:

  - A unique constraint covering the columns `[professorId,subjectId,semester]` on the table `Professor_Subject` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."Professor_Subject_professorId_subjectId_key";

-- AlterTable
ALTER TABLE "public"."Professor_Subject" ALTER COLUMN "semester" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "Professor_Subject_professorId_subjectId_semester_key" ON "public"."Professor_Subject"("professorId", "subjectId", "semester");
