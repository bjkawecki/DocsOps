-- AlterTable
ALTER TABLE "SystemSettings" ADD COLUMN "smtpEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SystemSettings" ADD COLUMN "smtpHost" TEXT;
ALTER TABLE "SystemSettings" ADD COLUMN "smtpPort" INTEGER;
ALTER TABLE "SystemSettings" ADD COLUMN "smtpEncryption" TEXT;
ALTER TABLE "SystemSettings" ADD COLUMN "smtpUsername" TEXT;
ALTER TABLE "SystemSettings" ADD COLUMN "smtpPasswordCiphertext" TEXT;
ALTER TABLE "SystemSettings" ADD COLUMN "smtpFromAddress" TEXT;
ALTER TABLE "SystemSettings" ADD COLUMN "smtpFromName" TEXT;
