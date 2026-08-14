import type { Session, SessionProvider } from '@tempot/session-manager';

export function buildModuleSessionProviderAdapter(sessionProvider: SessionProvider) {
  return {
    getSession: async (userId: string, chatId: string) => {
      const result = await sessionProvider.getSession(userId, chatId);
      return result.isOk() ? result.value : null;
    },
    saveSession: async (session: Session) => {
      const result = await sessionProvider.saveSession(session);
      return result.isOk() ? result.value : null;
    },
  };
}
