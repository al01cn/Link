-- AlterTable
ALTER TABLE "Log" ADD COLUMN "messageKey" TEXT;
ALTER TABLE "Log" ADD COLUMN "messageParams" TEXT;

-- AlterTable
ALTER TABLE "ShortLink" ADD COLUMN "description" TEXT;
