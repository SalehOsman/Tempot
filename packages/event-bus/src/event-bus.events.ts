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
}
