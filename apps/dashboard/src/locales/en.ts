import type { DashboardLocaleDictionary } from './ar.js';

export const en: DashboardLocaleDictionary = {
  defaults: {
    welcomeMessage: 'Welcome to the Sovereign Bot! How may I assist you today?',
  },
  health: {
    checking: 'Checking...',
    online: 'Connected & Active 🟢',
    offline: 'Disconnected (Server Offline) 🔴',
    standalone: 'Local (Standalone Preview Mode)',
    label: 'Server Status:',
  },
  header: {
    title: '⚙️ Sovereign Admin Dashboard | Tembot Admin',
    subtitle: 'Tri-Surface Orchestration, Capabilities & Platform Governance',
  },
  tabs: {
    settings: '⚙️ Tri-Surface Settings',
    roles: '🛡️ Capabilities & ctx.can Engine',
  },
  settingsForm: {
    title: 'Customize Telegram Bot, TMA & Dashboard Surfaces',
    savedSuccess: '✓ Settings saved and distributed cache invalidated successfully!',
    botSectionTitle: '🤖 Telegram Bot Surface',
    botNameLabel: 'Bot Name:',
    botWelcomeLabel: 'Welcome Message in /start:',
    botMaintCheckbox: 'Enable Bot Maintenance Mode (temporarily suspend ingress)',
    tmaSectionTitle: '📱 Telegram Mini App (TMA Surface)',
    tmaTitleLabel: 'Mini App Title:',
    tmaColorLabel: 'Brand Primary Color:',
    tmaMaintCheckbox: 'Enable TMA Maintenance Mode',
    submitButton: '💾 Save Changes & Broadcast Invalidation',
  },
  rolesMatrix: {
    title: 'Hybrid RBCA Capabilities Matrix',
    subtitle:
      'System code checks atomic capabilities exclusively via ctx.can with zero rigid role coupling.',
    thRole: 'Standard Role',
    thDesc: 'Description',
    thCaps: 'Granted Capabilities',
    superAdminDesc: 'Owner & Emergency Authority',
    superAdminCaps: '* (Unrestricted capabilities)',
    opsManagerDesc: 'Operations & Settings Manager',
    auditorDesc: 'Forensic Audit & Compliance',
    endUserDesc: 'End User (Bot & Mini App)',
  },
};
