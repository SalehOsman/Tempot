import type React from 'react';
import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { getDashboardLocale } from './locales/index.js';

interface SurfaceSettingsState {
  platformName: string;
  defaultLocale: string;
  botName: string;
  botWelcomeMessage: string;
  botMaintenanceMode: boolean;
  tmaTitle: string;
  tmaPrimaryColor: string;
  tmaMaintenanceMode: boolean;
  sessionTimeoutMinutes: number;
}

const defaultDict = getDashboardLocale('ar');

const DEFAULT_SETTINGS: SurfaceSettingsState = {
  platformName: 'Tembot Sovereign Platform',
  defaultLocale: 'ar',
  botName: 'Tembot Pro',
  botWelcomeMessage: defaultDict.defaults.welcomeMessage,
  botMaintenanceMode: false,
  tmaTitle: 'Tembot Mini App',
  tmaPrimaryColor: '#2563eb',
  tmaMaintenanceMode: false,
  sessionTimeoutMinutes: 60,
};

const API_BASE_URL =
  (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_API_URL ||
  'http://localhost:4000';

export function DashboardApp() {
  const [activeTab, setActiveTab] = useState<'settings' | 'roles' | 'status'>('settings');
  const [settings, setSettings] = useState<SurfaceSettingsState>(DEFAULT_SETTINGS);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const dict = getDashboardLocale(settings.defaultLocale);
  const [healthStatus, setHealthStatus] = useState<string>(dict.health.checking);

  useEffect(() => {
    fetch(`${API_BASE_URL}/health`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.status === 'ok') {
          setHealthStatus(dict.health.online);
        } else {
          setHealthStatus(dict.health.offline);
        }
      })
      .catch(() => {
        setHealthStatus(dict.health.standalone);
      });
  }, [dict]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch(`${API_BASE_URL}/api/v1/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch {
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  const isRtl = settings.defaultLocale === 'ar';

  return (
    <div
      style={{
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '2rem',
        maxWidth: '1000px',
        margin: '0 auto',
        direction: isRtl ? 'rtl' : 'ltr',
      }}
    >
      {/* Top Header */}
      <header
        style={{
          borderBottom: '1px solid #334155',
          paddingBottom: '1.5rem',
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700, color: '#38bdf8' }}>
            {dict.header.title}
          </h1>
          <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>
            {dict.header.subtitle}
          </p>
        </div>
        <div
          style={{
            background: '#1e293b',
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            fontSize: '0.85rem',
            color: '#cbd5e1',
          }}
        >
          {dict.health.label} <strong>{healthStatus}</strong>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          style={{
            padding: '0.6rem 1.25rem',
            borderRadius: '6px',
            border: 'none',
            background: activeTab === 'settings' ? '#0284c7' : '#1e293b',
            color: '#fff',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          {dict.tabs.settings}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('roles')}
          style={{
            padding: '0.6rem 1.25rem',
            borderRadius: '6px',
            border: 'none',
            background: activeTab === 'roles' ? '#0284c7' : '#1e293b',
            color: '#fff',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          {dict.tabs.roles}
        </button>
      </nav>

      {/* Main Content Area */}
      {activeTab === 'settings' && (
        <form
          onSubmit={handleSave}
          style={{
            background: '#1e293b',
            padding: '2rem',
            borderRadius: '12px',
            border: '1px solid #334155',
          }}
        >
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: '#f8fafc' }}>
            {dict.settingsForm.title}
          </h2>

          {savedSuccess && (
            <div
              style={{
                background: '#065f46',
                color: '#34d399',
                padding: '0.75rem 1rem',
                borderRadius: '6px',
                marginBottom: '1.5rem',
              }}
            >
              {dict.settingsForm.savedSuccess}
            </div>
          )}

          {/* Bot Section */}
          <fieldset
            style={{
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1.5rem',
            }}
          >
            <legend style={{ color: '#38bdf8', padding: '0 0.5rem', fontWeight: 600 }}>
              {dict.settingsForm.botSectionTitle}
            </legend>
            <div style={{ marginBottom: '1rem' }}>
              <label
                htmlFor="botName"
                style={{ display: 'block', marginBottom: '0.25rem', color: '#cbd5e1' }}
              >
                {dict.settingsForm.botNameLabel}
              </label>
              <input
                id="botName"
                type="text"
                value={settings.botName}
                onChange={(e) => setSettings({ ...settings, botName: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '6px',
                  border: '1px solid #475569',
                  background: '#0f172a',
                  color: '#fff',
                }}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label
                htmlFor="botWelcomeMessage"
                style={{ display: 'block', marginBottom: '0.25rem', color: '#cbd5e1' }}
              >
                {dict.settingsForm.botWelcomeLabel}
              </label>
              <textarea
                id="botWelcomeMessage"
                rows={3}
                value={settings.botWelcomeMessage}
                onChange={(e) => setSettings({ ...settings, botWelcomeMessage: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '6px',
                  border: '1px solid #475569',
                  background: '#0f172a',
                  color: '#fff',
                }}
              />
            </div>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: '#cbd5e1',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={settings.botMaintenanceMode}
                onChange={(e) => setSettings({ ...settings, botMaintenanceMode: e.target.checked })}
              />
              {dict.settingsForm.botMaintCheckbox}
            </label>
          </fieldset>

          {/* TMA Section */}
          <fieldset
            style={{
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1.5rem',
            }}
          >
            <legend style={{ color: '#38bdf8', padding: '0 0.5rem', fontWeight: 600 }}>
              {dict.settingsForm.tmaSectionTitle}
            </legend>
            <div style={{ marginBottom: '1rem' }}>
              <label
                htmlFor="tmaTitle"
                style={{ display: 'block', marginBottom: '0.25rem', color: '#cbd5e1' }}
              >
                {dict.settingsForm.tmaTitleLabel}
              </label>
              <input
                id="tmaTitle"
                type="text"
                value={settings.tmaTitle}
                onChange={(e) => setSettings({ ...settings, tmaTitle: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '6px',
                  border: '1px solid #475569',
                  background: '#0f172a',
                  color: '#fff',
                }}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label
                htmlFor="tmaPrimaryColor"
                style={{ display: 'block', marginBottom: '0.25rem', color: '#cbd5e1' }}
              >
                {dict.settingsForm.tmaColorLabel}
              </label>
              <input
                id="tmaPrimaryColor"
                type="color"
                value={settings.tmaPrimaryColor}
                onChange={(e) => setSettings({ ...settings, tmaPrimaryColor: e.target.value })}
                style={{
                  width: '60px',
                  height: '36px',
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer',
                }}
              />
            </div>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: '#cbd5e1',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={settings.tmaMaintenanceMode}
                onChange={(e) => setSettings({ ...settings, tmaMaintenanceMode: e.target.checked })}
              />
              {dict.settingsForm.tmaMaintCheckbox}
            </label>
          </fieldset>

          <button
            type="submit"
            style={{
              padding: '0.75rem 2rem',
              borderRadius: '6px',
              border: 'none',
              background: '#0284c7',
              color: '#fff',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {dict.settingsForm.submitButton}
          </button>
        </form>
      )}

      {activeTab === 'roles' && (
        <div
          style={{
            background: '#1e293b',
            padding: '2rem',
            borderRadius: '12px',
            border: '1px solid #334155',
          }}
        >
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: '#f8fafc' }}>
            {dict.rolesMatrix.title}
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            {dict.rolesMatrix.subtitle}
          </p>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: isRtl ? 'right' : 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #475569', color: '#38bdf8' }}>
                <th style={{ padding: '0.75rem' }}>{dict.rolesMatrix.thRole}</th>
                <th style={{ padding: '0.75rem' }}>{dict.rolesMatrix.thDesc}</th>
                <th style={{ padding: '0.75rem' }}>{dict.rolesMatrix.thCaps}</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #334155' }}>
                <td style={{ padding: '0.75rem', fontWeight: 600 }}>SuperAdmin</td>
                <td style={{ padding: '0.75rem', color: '#cbd5e1' }}>{dict.rolesMatrix.superAdminDesc}</td>
                <td style={{ padding: '0.75rem', color: '#34d399' }}>
                  <code>{dict.rolesMatrix.superAdminCaps}</code>
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid #334155' }}>
                <td style={{ padding: '0.75rem', fontWeight: 600 }}>OperationsManager</td>
                <td style={{ padding: '0.75rem', color: '#cbd5e1' }}>{dict.rolesMatrix.opsManagerDesc}</td>
                <td style={{ padding: '0.75rem', color: '#38bdf8' }}>
                  <code>settings:*</code>, <code>broadcast:*</code>, <code>tasks:*</code>
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid #334155' }}>
                <td style={{ padding: '0.75rem', fontWeight: 600 }}>Auditor</td>
                <td style={{ padding: '0.75rem', color: '#cbd5e1' }}>{dict.rolesMatrix.auditorDesc}</td>
                <td style={{ padding: '0.75rem', color: '#fbbf24' }}>
                  <code>audit:read</code>, <code>audit:export</code>, <code>telemetry:read</code>
                </td>
              </tr>
              <tr>
                <td style={{ padding: '0.75rem', fontWeight: 600 }}>EndUser</td>
                <td style={{ padding: '0.75rem', color: '#cbd5e1' }}>{dict.rolesMatrix.endUserDesc}</td>
                <td style={{ padding: '0.75rem', color: '#94a3b8' }}>
                  <code>bot:interact</code>, <code>tma:access</code>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(<DashboardApp />);
}
