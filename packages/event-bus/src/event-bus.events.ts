export interface TempotEvents {
  'session-manager.session.updated': {
    userId: string;
    chatId: string;
    sessionData: unknown;
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
}
