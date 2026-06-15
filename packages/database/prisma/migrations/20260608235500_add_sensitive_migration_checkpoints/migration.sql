CREATE TABLE "SensitiveDataMigrationCheckpoint" (
    "migrationId" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "cursor" TEXT,
    "processedCount" INTEGER NOT NULL DEFAULT 0,
    "verifiedCount" INTEGER NOT NULL DEFAULT 0,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SensitiveDataMigrationCheckpoint_pkey" PRIMARY KEY ("migrationId")
);
