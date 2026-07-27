CREATE TABLE IF NOT EXISTS "backup_jobs" (
  "id" TEXT PRIMARY KEY,
  "requested_by" TEXT NOT NULL,
  "scope" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "source_environment" TEXT NOT NULL,
  "requested_at" TIMESTAMP(3) NOT NULL,
  "started_at" TIMESTAMP(3),
  "completed_at" TIMESTAMP(3),
  "failure_category" TEXT,
  "safe_failure_message" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_by" TEXT,
  "updated_by" TEXT,
  "is_deleted" BOOLEAN NOT NULL DEFAULT FALSE,
  "deleted_at" TIMESTAMP(3),
  "deleted_by" TEXT
);

CREATE TABLE IF NOT EXISTS "backup_artifacts" (
  "id" TEXT PRIMARY KEY,
  "backup_job_id" TEXT NOT NULL,
  "artifact_type" TEXT NOT NULL,
  "checksum" TEXT NOT NULL,
  "encrypted" BOOLEAN NOT NULL,
  "size_bytes" INTEGER NOT NULL,
  "storage_attachment_id" TEXT,
  "storage_reference" TEXT,
  "storage_provider" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_by" TEXT,
  "updated_by" TEXT,
  "is_deleted" BOOLEAN NOT NULL DEFAULT FALSE,
  "deleted_at" TIMESTAMP(3),
  "deleted_by" TEXT,
  CONSTRAINT "backup_artifacts_backup_job_id_fkey"
    FOREIGN KEY ("backup_job_id") REFERENCES "backup_jobs"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "restore_rehearsals" (
  "id" TEXT PRIMARY KEY,
  "backup_job_id" TEXT NOT NULL,
  "confirmed_by" TEXT NOT NULL,
  "target_classification" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "requested_at" TIMESTAMP(3) NOT NULL,
  "completed_at" TIMESTAMP(3),
  "schema_check" TEXT NOT NULL,
  "data_check" TEXT NOT NULL,
  "protected_data_check" TEXT NOT NULL,
  "file_coverage_check" TEXT NOT NULL,
  "safe_failure_message" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_by" TEXT,
  "updated_by" TEXT,
  "is_deleted" BOOLEAN NOT NULL DEFAULT FALSE,
  "deleted_at" TIMESTAMP(3),
  "deleted_by" TEXT,
  CONSTRAINT "restore_rehearsals_backup_job_id_fkey"
    FOREIGN KEY ("backup_job_id") REFERENCES "backup_jobs"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "idx_backup_jobs_status_requested"
  ON "backup_jobs"("status", "requested_at");
CREATE INDEX IF NOT EXISTS "idx_backup_jobs_requested_by"
  ON "backup_jobs"("requested_by");
CREATE INDEX IF NOT EXISTS "idx_backup_jobs_deleted"
  ON "backup_jobs"("is_deleted");

CREATE INDEX IF NOT EXISTS "idx_backup_artifacts_job"
  ON "backup_artifacts"("backup_job_id");
CREATE INDEX IF NOT EXISTS "idx_backup_artifacts_type"
  ON "backup_artifacts"("artifact_type");
CREATE INDEX IF NOT EXISTS "idx_backup_artifacts_deleted"
  ON "backup_artifacts"("is_deleted");

CREATE INDEX IF NOT EXISTS "idx_restore_rehearsals_backup"
  ON "restore_rehearsals"("backup_job_id");
CREATE INDEX IF NOT EXISTS "idx_restore_rehearsals_status_requested"
  ON "restore_rehearsals"("status", "requested_at");
CREATE INDEX IF NOT EXISTS "idx_restore_rehearsals_deleted"
  ON "restore_rehearsals"("is_deleted");
