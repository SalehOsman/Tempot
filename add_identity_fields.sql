-- Add identity fields to UserProfile table
ALTER TABLE "UserProfile" ADD COLUMN "nationalId" TEXT;
ALTER TABLE "UserProfile" ADD COLUMN "mobileNumber" TEXT;
ALTER TABLE "UserProfile" ADD COLUMN "birthDate" TIMESTAMP(3);
ALTER TABLE "UserProfile" ADD COLUMN "gender" TEXT;
ALTER TABLE "UserProfile" ADD COLUMN "governorate" TEXT;
ALTER TABLE "UserProfile" ADD COLUMN "countryCode" TEXT DEFAULT '+20';

-- Create indexes
CREATE UNIQUE INDEX "UserProfile_nationalId_key" ON "UserProfile"("nationalId");
CREATE INDEX "UserProfile_nationalId_idx" ON "UserProfile"("nationalId");
CREATE INDEX "UserProfile_mobileNumber_idx" ON "UserProfile"("mobileNumber");
