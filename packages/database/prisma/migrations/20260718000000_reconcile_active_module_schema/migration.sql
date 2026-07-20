-- Reconcile active module models that are present in the merged Prisma schema
-- but were not committed as deployable Prisma migrations.

ALTER TABLE "UserProfile"
ADD COLUMN IF NOT EXISTS "nationalId" TEXT,
ADD COLUMN IF NOT EXISTS "mobileNumber" TEXT,
ADD COLUMN IF NOT EXISTS "birthDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "gender" TEXT,
ADD COLUMN IF NOT EXISTS "governorate" TEXT,
ADD COLUMN IF NOT EXISTS "countryCode" TEXT DEFAULT '+20';

CREATE UNIQUE INDEX IF NOT EXISTS "UserProfile_nationalId_key" ON "UserProfile"("nationalId");
CREATE INDEX IF NOT EXISTS "UserProfile_nationalId_idx" ON "UserProfile"("nationalId");
CREATE INDEX IF NOT EXISTS "UserProfile_mobileNumber_idx" ON "UserProfile"("mobileNumber");

CREATE TABLE IF NOT EXISTS "categories" (
  "id" TEXT NOT NULL,
  "name_ar" VARCHAR(255) NOT NULL,
  "name_en" VARCHAR(255) NOT NULL,
  "slug" VARCHAR(255) NOT NULL,
  "icon" VARCHAR(10),
  "parent_id" TEXT,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "depth" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "is_deleted" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "categories_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "categories_slug_key" ON "categories"("slug");
CREATE INDEX IF NOT EXISTS "idx_categories_parent" ON "categories"("parent_id");

CREATE TABLE IF NOT EXISTS "tags" (
  "id" TEXT NOT NULL,
  "name" VARCHAR(100) NOT NULL,
  "slug" VARCHAR(100) NOT NULL,
  "usage_count" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "tags_name_key" ON "tags"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "tags_slug_key" ON "tags"("slug");

CREATE TABLE IF NOT EXISTS "templates" (
  "id" TEXT NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT NOT NULL,
  "slug" VARCHAR(255) NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  "content" JSONB NOT NULL DEFAULT '{}',
  "category_id" TEXT,
  "author_id" TEXT NOT NULL,
  "cloned_from" TEXT,
  "language" VARCHAR(10) NOT NULL DEFAULT 'ar',
  "usage_count" INTEGER NOT NULL DEFAULT 0,
  "rating_avg" DECIMAL(3, 2) NOT NULL DEFAULT 0,
  "rating_count" INTEGER NOT NULL DEFAULT 0,
  "current_version" VARCHAR(20),
  "is_official" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "is_deleted" BOOLEAN NOT NULL DEFAULT false,
  "deleted_at" TIMESTAMP(3),
  "deleted_by" TEXT,
  CONSTRAINT "templates_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "templates_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "templates_cloned_from_fkey" FOREIGN KEY ("cloned_from") REFERENCES "templates"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "idx_templates_status" ON "templates"("status");
CREATE INDEX IF NOT EXISTS "idx_templates_author" ON "templates"("author_id");
CREATE INDEX IF NOT EXISTS "idx_templates_category" ON "templates"("category_id");
CREATE INDEX IF NOT EXISTS "idx_templates_slug" ON "templates"("slug");
CREATE INDEX IF NOT EXISTS "idx_templates_rating" ON "templates"("rating_avg" DESC);
CREATE INDEX IF NOT EXISTS "idx_templates_usage" ON "templates"("usage_count" DESC);

CREATE TABLE IF NOT EXISTS "template_versions" (
  "id" TEXT NOT NULL,
  "template_id" TEXT NOT NULL,
  "version" VARCHAR(20) NOT NULL,
  "content" JSONB NOT NULL,
  "metadata" JSONB NOT NULL,
  "change_summary" TEXT,
  "published_by" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "template_versions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "template_versions_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "template_versions_template_id_version_key" ON "template_versions"("template_id", "version");
CREATE INDEX IF NOT EXISTS "idx_versions_template" ON "template_versions"("template_id");

CREATE TABLE IF NOT EXISTS "template_tags" (
  "template_id" TEXT NOT NULL,
  "tag_id" TEXT NOT NULL,
  CONSTRAINT "template_tags_pkey" PRIMARY KEY ("template_id", "tag_id"),
  CONSTRAINT "template_tags_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "template_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "idx_template_tags_tag" ON "template_tags"("tag_id");

CREATE TABLE IF NOT EXISTS "template_ratings" (
  "id" TEXT NOT NULL,
  "template_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "stars" INTEGER NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "template_ratings_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "template_ratings_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "template_ratings_template_id_user_id_key" ON "template_ratings"("template_id", "user_id");
CREATE INDEX IF NOT EXISTS "idx_ratings_template" ON "template_ratings"("template_id");

CREATE TABLE IF NOT EXISTS "template_subscriptions" (
  "id" TEXT NOT NULL,
  "template_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "template_subscriptions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "template_subscriptions_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "template_subscriptions_template_id_user_id_key" ON "template_subscriptions"("template_id", "user_id");
CREATE INDEX IF NOT EXISTS "idx_subscriptions_template" ON "template_subscriptions"("template_id");
CREATE INDEX IF NOT EXISTS "idx_subscriptions_user" ON "template_subscriptions"("user_id");

CREATE TABLE IF NOT EXISTS "membership_requests" (
  "id" TEXT NOT NULL,
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
  "updated_at" TIMESTAMP(3) NOT NULL,
  "created_by" TEXT,
  "updated_by" TEXT,
  "is_deleted" BOOLEAN NOT NULL DEFAULT false,
  "deleted_at" TIMESTAMP(3),
  "deleted_by" TEXT,
  CONSTRAINT "membership_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_membership_requests_telegram" ON "membership_requests"("telegram_id");
CREATE INDEX IF NOT EXISTS "idx_membership_requests_status" ON "membership_requests"("status");
CREATE INDEX IF NOT EXISTS "idx_membership_requests_deleted" ON "membership_requests"("is_deleted");
CREATE UNIQUE INDEX IF NOT EXISTS "membership_requests_one_pending_per_telegram"
ON "membership_requests"("telegram_id")
WHERE "status" = 'PENDING' AND "is_deleted" = false;

CREATE TABLE IF NOT EXISTS "managed_bots" (
  "id" TEXT NOT NULL,
  "display_name" VARCHAR(120) NOT NULL,
  "telegram_username" VARCHAR(64) NOT NULL,
  "token_fingerprint" VARCHAR(255) NOT NULL,
  "token_redacted" VARCHAR(255) NOT NULL,
  "owner_id" TEXT NOT NULL,
  "runtime_mode" VARCHAR(20) NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  "default_locale" VARCHAR(10) NOT NULL DEFAULT 'ar-EG',
  "default_country" VARCHAR(10) NOT NULL DEFAULT 'EG',
  "timezone" VARCHAR(100) NOT NULL DEFAULT 'Africa/Cairo',
  "health_status" VARCHAR(20) NOT NULL DEFAULT 'unknown',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "created_by" TEXT,
  "updated_by" TEXT,
  "is_deleted" BOOLEAN NOT NULL DEFAULT false,
  "deleted_at" TIMESTAMP(3),
  "deleted_by" TEXT,
  CONSTRAINT "managed_bots_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "managed_bots_telegram_username_is_deleted_key" ON "managed_bots"("telegram_username", "is_deleted");
CREATE UNIQUE INDEX IF NOT EXISTS "managed_bots_token_fingerprint_is_deleted_key" ON "managed_bots"("token_fingerprint", "is_deleted");
CREATE INDEX IF NOT EXISTS "idx_managed_bots_status" ON "managed_bots"("status");
CREATE INDEX IF NOT EXISTS "idx_managed_bots_owner" ON "managed_bots"("owner_id");
CREATE INDEX IF NOT EXISTS "idx_managed_bots_runtime" ON "managed_bots"("runtime_mode");
CREATE INDEX IF NOT EXISTS "idx_managed_bots_deleted" ON "managed_bots"("is_deleted");

CREATE TABLE IF NOT EXISTS "bot_settings_profiles" (
  "id" TEXT NOT NULL,
  "bot_id" TEXT NOT NULL,
  "locale" VARCHAR(10) NOT NULL,
  "country" VARCHAR(10) NOT NULL,
  "timezone" VARCHAR(100) NOT NULL,
  "notifications_enabled" BOOLEAN NOT NULL DEFAULT true,
  "privacy_mode" VARCHAR(20) NOT NULL DEFAULT 'standard',
  "feature_toggles" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "bot_settings_profiles_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "bot_settings_profiles_bot_id_fkey" FOREIGN KEY ("bot_id") REFERENCES "managed_bots"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "bot_settings_profiles_bot_id_key" ON "bot_settings_profiles"("bot_id");

CREATE TABLE IF NOT EXISTS "bot_module_enablements" (
  "id" TEXT NOT NULL,
  "bot_id" TEXT NOT NULL,
  "module_name" VARCHAR(120) NOT NULL,
  "state" VARCHAR(20) NOT NULL,
  "blocked_reason" TEXT,
  "enabled_by" TEXT,
  "enabled_at" TIMESTAMP(3),
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "bot_module_enablements_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "bot_module_enablements_bot_id_fkey" FOREIGN KEY ("bot_id") REFERENCES "managed_bots"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "bot_module_enablements_bot_id_module_name_key" ON "bot_module_enablements"("bot_id", "module_name");
CREATE INDEX IF NOT EXISTS "idx_bot_modules_name" ON "bot_module_enablements"("module_name");
CREATE INDEX IF NOT EXISTS "idx_bot_modules_state" ON "bot_module_enablements"("state");

CREATE TABLE IF NOT EXISTS "bot_template_sources" (
  "id" TEXT NOT NULL,
  "bot_id" TEXT NOT NULL,
  "template_id" TEXT NOT NULL,
  "template_version_id" TEXT NOT NULL,
  "template_name_snapshot" VARCHAR(255) NOT NULL,
  "provisioned_by" TEXT NOT NULL,
  "provisioned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "bot_template_sources_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "bot_template_sources_bot_id_fkey" FOREIGN KEY ("bot_id") REFERENCES "managed_bots"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "bot_template_sources_bot_id_key" ON "bot_template_sources"("bot_id");
CREATE INDEX IF NOT EXISTS "idx_bot_template_source_template" ON "bot_template_sources"("template_id");

CREATE TABLE IF NOT EXISTS "bot_lifecycle_events" (
  "id" TEXT NOT NULL,
  "bot_id" TEXT NOT NULL,
  "from_status" VARCHAR(20),
  "to_status" VARCHAR(20) NOT NULL,
  "actor_id" TEXT NOT NULL,
  "reason" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "bot_lifecycle_events_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "bot_lifecycle_events_bot_id_fkey" FOREIGN KEY ("bot_id") REFERENCES "managed_bots"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "idx_bot_lifecycle_bot" ON "bot_lifecycle_events"("bot_id");
CREATE INDEX IF NOT EXISTS "idx_bot_lifecycle_status" ON "bot_lifecycle_events"("to_status");

CREATE TABLE IF NOT EXISTS "bot_health_snapshots" (
  "id" TEXT NOT NULL,
  "bot_id" TEXT NOT NULL,
  "status" VARCHAR(20) NOT NULL,
  "summary_key" VARCHAR(255) NOT NULL,
  "details" JSONB,
  "observed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "bot_health_snapshots_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "bot_health_snapshots_bot_id_fkey" FOREIGN KEY ("bot_id") REFERENCES "managed_bots"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "idx_bot_health_bot_observed" ON "bot_health_snapshots"("bot_id", "observed_at");
CREATE INDEX IF NOT EXISTS "idx_bot_health_status" ON "bot_health_snapshots"("status");

CREATE TABLE IF NOT EXISTS "bot_profile_exports" (
  "id" TEXT NOT NULL,
  "bot_id" TEXT NOT NULL,
  "requested_by" TEXT NOT NULL,
  "format" VARCHAR(20) NOT NULL,
  "artifact_id" TEXT,
  "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completed_at" TIMESTAMP(3),
  CONSTRAINT "bot_profile_exports_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "bot_profile_exports_bot_id_fkey" FOREIGN KEY ("bot_id") REFERENCES "managed_bots"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "idx_bot_exports_bot" ON "bot_profile_exports"("bot_id");
CREATE INDEX IF NOT EXISTS "idx_bot_exports_status" ON "bot_profile_exports"("status");

CREATE TABLE IF NOT EXISTS "bot_profile_imports" (
  "id" TEXT NOT NULL,
  "requested_by" TEXT NOT NULL,
  "source_artifact_id" TEXT NOT NULL,
  "created_bot_id" TEXT,
  "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  "validation_errors" JSONB,
  "blocked_requirements" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completed_at" TIMESTAMP(3),
  CONSTRAINT "bot_profile_imports_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_bot_imports_created_bot" ON "bot_profile_imports"("created_bot_id");
CREATE INDEX IF NOT EXISTS "idx_bot_imports_status" ON "bot_profile_imports"("status");
