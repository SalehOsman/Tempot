import type { TmaLocaleDictionary } from './ar.js';

export const en: TmaLocaleDictionary = {
  auth: {
    verifying: 'Cryptographic verification in progress...',
    verified: 'HMAC-SHA256 Cryptographically Verified 🛡️',
    failed: 'Cryptographic Signature Verification Failed ⚠️',
    offlinePreview: 'Local Preview Mode (Gateway Disconnected)',
    browserDev: 'Standalone Browser Development Mode',
    browserPreview: 'Preview Mode (External Browser)',
    mockUserName: 'Demo Developer',
    statusLabel: 'Security Status:',
  },
  header: {
    title: 'Telegram Mini App (TMA)',
    subtitle: 'Tembot Sovereign Telegram Mini App',
  },
  userCard: {
    title: '👤 Verified User Identity:',
    nameLabel: 'Name:',
    idLabel: 'User ID:',
    usernameLabel: 'Username:',
    langLabel: 'Locale:',
  },
  environment: {
    title: '⚙️ Runtime Environment Specs:',
    currentEnvLabel: 'Current Runtime:',
    envTelegram: 'Inside Telegram (Telegram WebApp)',
    envBrowser: 'External Web Browser',
    gatewayConnectionLabel: 'Gateway Connection:',
    connectedPort: 'Connected to Gateway',
    localMode: 'Local Standalone',
    capabilityEngineLabel: 'Capability Engine:',
    activeStatus: 'Active',
  },
};
