ALTER TABLE "UserProfile"
ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'ACTIVE';

CREATE INDEX IF NOT EXISTS "UserProfile_status_idx" ON "UserProfile"("status");
