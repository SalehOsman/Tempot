export interface TempotEvents {
  'session-manager.session.updated': {
    userId: string;
    chatId: string;
    sessionData: unknown;
  };
}
