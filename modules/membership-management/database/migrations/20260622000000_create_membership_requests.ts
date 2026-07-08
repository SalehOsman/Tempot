import { Prisma } from '@tempot/database';

export const up = async (prisma: Prisma.TransactionClient): Promise<void> => {
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS "membership_requests" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "telegram_id" BIGINT NOT NULL,
      "telegram_username" TEXT,
      "telegram_first_name" TEXT,
      "telegram_last_name" TEXT,
      "telegram_language_code" TEXT,
      "status" TEXT NOT NULL DEFAULT 'PENDING',
      "request_message" TEXT,
      "reviewer_user_id" TEXT,
      "reviewer_note" TEXT,
      "rejection_reason" TEXT,
      "created_user_profile_id" TEXT,
      "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "reviewed_at" TIMESTAMP(3),
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "created_by" TEXT,
      "updated_by" TEXT,
      "is_deleted" BOOLEAN NOT NULL DEFAULT FALSE,
      "deleted_at" TIMESTAMP(3),
      "deleted_by" TEXT
    );
  `;

  await prisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS "idx_membership_requests_telegram"
      ON "membership_requests"("telegram_id");
  `;

  await prisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS "idx_membership_requests_status"
      ON "membership_requests"("status");
  `;

  await prisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS "idx_membership_requests_deleted"
      ON "membership_requests"("is_deleted");
  `;

  await prisma.$executeRaw`
    CREATE UNIQUE INDEX IF NOT EXISTS "membership_requests_one_pending_per_telegram"
      ON "membership_requests"("telegram_id")
      WHERE "status" = 'PENDING' AND "is_deleted" = FALSE;
  `;
};

export const down = async (prisma: Prisma.TransactionClient): Promise<void> => {
  await prisma.$executeRaw`
    DROP TABLE IF EXISTS "membership_requests" CASCADE;
  `;
};
