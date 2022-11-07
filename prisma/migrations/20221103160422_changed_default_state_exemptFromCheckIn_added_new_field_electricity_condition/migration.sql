-- AlterTable
ALTER TABLE "members" ALTER COLUMN "isExemptFromCheckIn" SET DEFAULT true;
ALTER TABLE "checkins" ADD COLUMN "electricityCondition" TEXT;