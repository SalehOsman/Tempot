export interface TempotEvents {
  'session-manager.session.updated': {
    userId: string;
    chatId: string;
    sessionData: unknown;
  };
  'session.redis.degraded': {
    operation: string;
    errorCode: string;
    errorMessage: string;
    timestamp: string;
  };
  'storage.file.uploaded': {
    attachmentId: string;
    fileName: string;
    originalName: string;
    mimeType: string;
    size: number;
    provider: string;
    moduleId?: string;
    entityId?: string;
    uploadedBy?: string;
  };
  'storage.file.deleted': {
    attachmentId: string;
    provider: string;
    providerKey: string;
    deletedBy?: string;
    permanent: boolean;
  };
  'system.alert.critical': {
    message: string;
    error: string;
  };
  'system.ai.degraded': {
    reason: string;
    failureCount: number;
    disabledUntil: Date;
    lastError: string;
  };
  'ai-core.tool.executed': {
    userId: string;
    toolName: string;
    success: boolean;
    executionMs: number;
    tokenUsage: number;
  };
  'ai-core.tool.version_changed': {
    toolName: string;
    oldVersion: string;
    newVersion: string;
  };
  'ai-core.conversation.ended': {
    userId: string;
    messageCount: number;
    summarized: boolean;
    durationMs: number;
  };
  'ai-core.content.indexed': {
    contentId: string;
    contentType: string;
    chunkCount: number;
    source: string;
  };
  'module.tools.registered': {
    moduleName: string;
    toolCount: number;
    toolNames: string[];
  };
  // Input Engine events
  'input-engine.form.started': {
    formId: string;
    userId: string;
    chatId: number;
    fieldCount: number;
    timestamp: Date;
  };
  'input-engine.form.completed': {
    formId: string;
    userId: string;
    fieldCount: number;
    durationMs: number;
    hadPartialSave: boolean;
  };
  'input-engine.form.cancelled': {
    formId: string;
    userId: string;
    fieldsCompleted: number;
    totalFields: number;
    reason: 'user_cancel' | 'timeout' | 'max_retries';
  };
  'input-engine.form.resumed': {
    formId: string;
    userId: string;
    resumedFromField: number;
    totalFields: number;
  };
  'input-engine.field.validated': {
    formId: string;
    userId: string;
    fieldType: string;
    fieldName: string;
    valid: boolean;
    retryCount: number;
  };
  'input-engine.field.skipped': {
    formId: string;
    userId: string;
    fieldName: string;
    fieldType: string;
    reason: 'user_skip' | 'max_retries_skip' | 'condition';
  };
  // Settings events (DC-5: inline payloads, no imports)
  'settings.setting.updated': {
    key: string;
    oldValue: unknown;
    newValue: unknown;
    changedBy: string | null;
  };
  'settings.setting.created': {
    key: string;
    oldValue: unknown;
    newValue: unknown;
    changedBy: string | null;
  };
  'settings.setting.deleted': {
    key: string;
    oldValue: unknown;
    newValue: unknown;
    changedBy: string | null;
  };
  'settings.maintenance.toggled': {
    enabled: boolean;
    changedBy: string | null;
  };
}
