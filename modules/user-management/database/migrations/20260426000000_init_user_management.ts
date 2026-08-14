import { Prisma } from '@tempot/database';

/**
 * Initial migration for user-management module
 * Creates UserProfile table for storing user profile information
 */

export const up = async (prisma: Prisma.TransactionClient): Promise<void> => {
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS "user_management_profile" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "telegram_id" BIGINT NOT NULL UNIQUE,
      "username" TEXT,
      "email" TEXT,
      "language" TEXT NOT NULL DEFAULT 'ar',
      "role" TEXT NOT NULL DEFAULT 'USER',
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "created_by" TEXT,
      "updated_by" TEXT,
      "is_deleted" BOOLEAN NOT NULL DEFAULT FALSE,
      "deleted_at" TIMESTAMP(3),
      "deleted_by" TEXT
    );

    CREATE INDEX IF NOT EXISTS "user_management_profile_telegram_id_idx" 
      ON "user_management_profile"("telegram_id");

    CREATE INDEX IF NOT EXISTS "user_management_profile_username_idx" 
      ON "user_management_profile"("username");

    CREATE INDEX IF NOT EXISTS "user_management_profile_email_idx" 
      ON "user_management_profile"("email");

    CREATE INDEX IF NOT EXISTS "user_management_profile_role_idx" 
      ON "user_management_profile"("role");
  `;

  // Insert default SUPER_ADMIN user if not exists
  await prisma.$executeRaw`
    INSERT INTO "user_management_profile" 
    ("id", "telegram_id", "username", "language", "role", "created_at", "updated_at")
    VALUES 
    ('super-admin-001', 7594239391, 'super_admin', 'ar', 'SUPER_ADMIN', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT ("telegram_id") DO NOTHING
  `;
};

export const down = async (prisma: Prisma.TransactionClient): Promise<void> => {
  await prisma.$executeRaw`
    DROP TABLE IF EXISTS "user_management_profile" CASCADE;
  `;
};
