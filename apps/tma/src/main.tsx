import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { getTmaLocale } from './locales/index.js';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

interface WindowWithTelegram extends Window {
  Telegram?: {
    WebApp?: {
      ready(): void;
      expand(): void;
      close(): void;
      initData: string;
      initDataUnsafe?: {
        user?: TelegramUser;
      };
      themeParams?: {
        bg_color?: string;
        text_color?: string;
        button_color?: string;
        button_text_color?: string;
      };
    };
  };
}

declare const window: WindowWithTelegram;

const API_BASE_URL =
  (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_API_URL ||
  'http://localhost:4000';

export function TmaApp() {
  const [currentLocale, setCurrentLocale] = useState<'ar' | 'en'>('en');
  const dict = getTmaLocale(currentLocale);
  const [authStatus, setAuthStatus] = useState<string>(dict.auth.verifying);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isTelegramEnv, setIsTelegramEnv] = useState<boolean>(false);
  const [serverConnected, setServerConnected] = useState<boolean>(false);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg && typeof tg.ready === 'function') {
      tg.ready();
      tg.expand();
      setIsTelegramEnv(true);

      const rawInitData = tg.initData;
      if (rawInitData && rawInitData.length > 0) {
        // Authenticate cryptographically against backend gateway
        fetch(`${API_BASE_URL}/api/v1/auth/telegram`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData: rawInitData }),
        })
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data && data.status === 'authenticated') {
              setAuthStatus(dict.auth.verified);
              setIsVerified(true);
              setUser(data.user);
              if (data.user?.language_code === 'en') {
                setCurrentLocale('en');
              }
              setServerConnected(true);
            } else {
              setAuthStatus(dict.auth.failed);
              setIsVerified(false);
            }
          })
          .catch(() => {
            setAuthStatus(dict.auth.offlinePreview);
            setIsVerified(false);
            if (tg.initDataUnsafe?.user) {
              setUser(tg.initDataUnsafe.user);
            }
          });
      } else {
        setAuthStatus(dict.auth.browserDev);
        setIsVerified(false);
        setUser({
          id: 77889900,
          first_name: dict.auth.mockUserName,
          username: 'dev_user',
          language_code: 'ar',
        });
      }
    } else {
      setAuthStatus(dict.auth.browserPreview);
      setIsVerified(false);
      setUser({
        id: 77889900,
        first_name: dict.auth.mockUserName,
        username: 'dev_user',
        language_code: 'ar',
      });
    }
  }, [dict]);

  const isRtl = currentLocale === 'ar';

  return (
    <div
      style={{
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '1.25rem',
        maxWidth: '480px',
        margin: '0 auto',
        direction: isRtl ? 'rtl' : 'ltr',
        minHeight: '100vh',
        boxSizing: 'border-box',
      }}
    >
      {/* TMA Header */}
      <div
        style={{
          background: '#1e293b',
          borderRadius: '16px',
          padding: '1.25rem',
          border: '1px solid #334155',
          textAlign: 'center',
          marginBottom: '1rem',
        }}
      >
        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📱</div>
        <h1 style={{ margin: 0, fontSize: '1.4rem', color: '#38bdf8', fontWeight: 700 }}>
          {dict.header.title}
        </h1>
        <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>
          {dict.header.subtitle}
        </p>
      </div>

      {/* Security Authentication Status Badge */}
      <div
        style={{
          background: isVerified ? '#064e3b' : '#1e293b',
          color: isVerified ? '#34d399' : '#cbd5e1',
          padding: '0.75rem 1rem',
          borderRadius: '10px',
          border: `1px solid ${isVerified ? '#059669' : '#475569'}`,
          fontSize: '0.85rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '1.25rem',
        }}
      >
        <span>{dict.auth.statusLabel}</span>
        <span>{authStatus}</span>
      </div>

      {/* Verified User Identity Card */}
      {user && (
        <div
          style={{
            background: '#1e293b',
            borderRadius: '12px',
            padding: '1.25rem',
            border: '1px solid #334155',
            marginBottom: '1.25rem',
          }}
        >
          <h2 style={{ fontSize: '1rem', margin: '0 0 1rem', color: '#f8fafc', fontWeight: 600 }}>
            {dict.userCard.title}
          </h2>
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                borderBottom: '1px solid #334155',
                paddingBottom: '0.35rem',
              }}
            >
              <span style={{ color: '#94a3b8' }}>{dict.userCard.nameLabel}</span>
              <strong style={{ color: '#f1f5f9' }}>
                {user.first_name} {user.last_name ?? ''}
              </strong>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                borderBottom: '1px solid #334155',
                paddingBottom: '0.35rem',
              }}
            >
              <span style={{ color: '#94a3b8' }}>{dict.userCard.idLabel}</span>
              <code
                style={{
                  background: '#0f172a',
                  padding: '0.1rem 0.4rem',
                  borderRadius: '4px',
                  color: '#38bdf8',
                }}
              >
                {user.id}
              </code>
            </div>
            {user.username && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid #334155',
                  paddingBottom: '0.35rem',
                }}
              >
                <span style={{ color: '#94a3b8' }}>{dict.userCard.usernameLabel}</span>
                <span style={{ color: '#38bdf8' }}>@{user.username}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>{dict.userCard.langLabel}</span>
              <span style={{ color: '#f1f5f9' }}>{user.language_code ?? 'ar'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Surface Environment Status */}
      <div
        style={{
          background: '#0f172a',
          borderRadius: '12px',
          padding: '1rem',
          border: '1px solid #334155',
          fontSize: '0.85rem',
          color: '#94a3b8',
        }}
      >
        <p style={{ margin: '0 0 0.5rem', fontWeight: 600, color: '#cbd5e1' }}>
          {dict.environment.title}
        </p>
        <ul
          style={{
            margin: 0,
            paddingRight: isRtl ? '1.25rem' : '0',
            paddingLeft: isRtl ? '0' : '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem',
          }}
        >
          <li>
            {dict.environment.currentEnvLabel}{' '}
            {isTelegramEnv ? dict.environment.envTelegram : dict.environment.envBrowser}
          </li>
          <li>
            {dict.environment.gatewayConnectionLabel}{' '}
            {serverConnected ? dict.environment.connectedPort : dict.environment.localMode}
          </li>
          <li>
            {dict.environment.capabilityEngineLabel} <code>tma:access</code> (
            {dict.environment.activeStatus})
          </li>
        </ul>
      </div>
    </div>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(<TmaApp />);
}
