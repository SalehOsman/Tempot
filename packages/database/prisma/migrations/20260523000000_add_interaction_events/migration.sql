-- CreateTable
CREATE TABLE "interaction_events" (
    "id" TEXT NOT NULL,
    "trace_id" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "update_id" INTEGER,
    "update_type" TEXT NOT NULL,
    "command" TEXT,
    "callback_data" TEXT,
    "callback_namespace" TEXT,
    "module" TEXT NOT NULL,
    "user_id" TEXT,
    "chat_id" TEXT,
    "stage" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "action" TEXT,
    "view_key" TEXT,
    "response_type" TEXT,
    "reason" TEXT,
    "error_code" TEXT,
    "reference_code" TEXT,
    "metadata" JSONB,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" TEXT,

    CONSTRAINT "interaction_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "interaction_events_trace_sequence_key" ON "interaction_events"("trace_id", "sequence");

-- CreateIndex
CREATE INDEX "idx_interaction_events_trace_sequence" ON "interaction_events"("trace_id", "sequence");

-- CreateIndex
CREATE INDEX "idx_interaction_events_module_stage" ON "interaction_events"("module", "stage");

-- CreateIndex
CREATE INDEX "idx_interaction_events_status_time" ON "interaction_events"("status", "occurred_at");

-- CreateIndex
CREATE INDEX "idx_interaction_events_callback_namespace" ON "interaction_events"("callback_namespace");

-- CreateIndex
CREATE INDEX "idx_interaction_events_deleted" ON "interaction_events"("is_deleted");
