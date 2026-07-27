ALTER TABLE "backup_artifacts"
  ADD COLUMN IF NOT EXISTS "storage_reference" TEXT;
