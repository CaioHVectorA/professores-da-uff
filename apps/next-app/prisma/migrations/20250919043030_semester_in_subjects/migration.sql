-- AlterTable
ALTER TABLE "public"."Professor_Subject" ADD COLUMN     "semester" TEXT NOT NULL DEFAULT '20252';

-- CreateTable
CREATE TABLE "public"."ApplicationEarlyAccess" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "ApplicationEarlyAccess_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ApplicationEarlyAccess_email_key" ON "public"."ApplicationEarlyAccess"("email");
