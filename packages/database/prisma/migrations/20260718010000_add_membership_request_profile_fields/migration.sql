ALTER TABLE "membership_requests"
  ADD COLUMN IF NOT EXISTS "full_name" TEXT,
  ADD COLUMN IF NOT EXISTS "nickname" TEXT,
  ADD COLUMN IF NOT EXISTS "mobile_number" TEXT;
