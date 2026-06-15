-- Expand-only migration for Spec #054.
-- Plaintext columns remain in place until the separately approved retirement gate.
ALTER TABLE "UserProfile"
ADD COLUMN "emailProtected" JSONB,
ADD COLUMN "emailLookupToken" TEXT,
ADD COLUMN "emailLookupKeyVersion" TEXT,
ADD COLUMN "emailNormalizationVersion" TEXT,
ADD COLUMN "nationalIdProtected" JSONB,
ADD COLUMN "nationalIdLookupToken" TEXT,
ADD COLUMN "nationalIdLookupKeyVersion" TEXT,
ADD COLUMN "nationalIdNormalizationVersion" TEXT,
ADD COLUMN "mobileNumberProtected" JSONB,
ADD COLUMN "birthDateProtected" JSONB;

CREATE INDEX "UserProfile_emailLookupToken_idx"
ON "UserProfile"("emailLookupToken");

CREATE INDEX "UserProfile_nationalIdLookupToken_idx"
ON "UserProfile"("nationalIdLookupToken");
