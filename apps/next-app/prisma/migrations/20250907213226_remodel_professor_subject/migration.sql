/*
  Warnings:

  - You are about to drop the column `professorId` on the `Review` table. All the data in the column will be lost.
  - You are about to drop the column `subjectId` on the `Review` table. All the data in the column will be lost.
  - You are about to drop the column `professorId` on the `Subject` table. All the data in the column will be lost.
  - Added the required column `professorSubjectId` to the `Review` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "public"."Professor_Subject" (
    "id" SERIAL NOT NULL,
    "professorId" INTEGER NOT NULL,
    "subjectId" INTEGER NOT NULL,

    CONSTRAINT "Professor_Subject_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Professor_Subject_professorId_subjectId_key" ON "public"."Professor_Subject"("professorId", "subjectId");

-- Insert into Professor_Subject from existing Subject data
INSERT INTO "public"."Professor_Subject" ("professorId", "subjectId")
SELECT "professorId", "id" FROM "public"."Subject";

-- Add the new column to Review
ALTER TABLE "public"."Review" ADD COLUMN "professorSubjectId" INTEGER;

-- Update Review to set professorSubjectId
UPDATE "public"."Review" SET "professorSubjectId" = (
  SELECT ps."id" FROM "public"."Professor_Subject" ps
  WHERE ps."professorId" = "Review"."professorId" AND ps."subjectId" = "Review"."subjectId"
);

-- DropForeignKey
ALTER TABLE "public"."Review" DROP CONSTRAINT "Review_professorId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Review" DROP CONSTRAINT "Review_subjectId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Subject" DROP CONSTRAINT "Subject_professorId_fkey";

-- AlterTable
ALTER TABLE "public"."Review" DROP COLUMN "professorId",
DROP COLUMN "subjectId";

-- Make professorSubjectId NOT NULL
ALTER TABLE "public"."Review" ALTER COLUMN "professorSubjectId" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."Subject" DROP COLUMN "professorId";

-- AddForeignKey
ALTER TABLE "public"."Professor_Subject" ADD CONSTRAINT "Professor_Subject_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "public"."Professor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Professor_Subject" ADD CONSTRAINT "Professor_Subject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "public"."Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_professorSubjectId_fkey" FOREIGN KEY ("professorSubjectId") REFERENCES "public"."Professor_Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
