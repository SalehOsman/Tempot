import { ArrowLeft, ArrowRight, ChevronRight, Globe, Moon, Settings, Sun, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { getTmaLocale } from './locales/index.js';
import './theme/tokens.css';

interface WindowWithTelegram extends Window {
  Telegram?: {
    WebApp?: {
      ready(): void;
      expand(): void;
      close(): void;
      BackButton?: {
        show(): void;
        hide(): void;
        onClick(callback: () => void): void;
        offClick(callback: () => void): void;
      };
      HapticFeedback?: {
        impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void;
      };
      themeParams?: {
        bg_color?: string;
        text_color?: string;
        button_color?: string;
      };
    };
  };
}

declare const window: WindowWithTelegram;

export function TmaApp() {
  const [currentView, setCurrentView] = useState<'home' | 'settings'>('home');
  const [locale, setLocale] = useState<'en' | 'ar'>('en');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const dict = getTmaLocale(locale);
  const isRtl = locale === 'ar';

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg && typeof tg.ready === 'function') {
      tg.ready();
      tg.expand();
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
  }, [locale, isRtl]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Sync Telegram native BackButton
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg?.BackButton) return;

    if (currentView === 'settings') {
      tg.BackButton.show();
      const onBack = () => {
        triggerHaptic();
        setCurrentView('home');
      };
      tg.BackButton.onClick(onBack);
      return () => {
        tg.BackButton?.offClick(onBack);
        tg.BackButton?.hide();
      };
    }

    tg.BackButton.hide();
    return undefined;
  }, [currentView]);

  const triggerHaptic = () => {
    try {
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
    } catch {
      // Optional outside Telegram client
    }
  };

  const handleOpenSettings = () => {
    triggerHaptic();
    setCurrentView('settings');
  };

  const handleGoHome = () => {
    triggerHaptic();
    setCurrentView('home');
  };

  const handleClose = () => {
    triggerHaptic();
    if (window.Telegram?.WebApp && typeof window.Telegram.WebApp.close === 'function') {
      window.Telegram.WebApp.close();
    } else {
      window.close();
    }
  };

  const handleLanguageChange = (newLocale: 'en' | 'ar') => {
    triggerHaptic();
    setLocale(newLocale);
  };

  const handleThemeChange = (newTheme: 'dark' | 'light') => {
    triggerHaptic();
    setTheme(newTheme);
  };

  return (
    <div
      style={{
        maxWidth: '440px',
        margin: '0 auto',
        padding: 'var(--space-2)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
      }}
    >
      {/* Universal Compact Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--space-2) var(--space-3)',
          background: 'var(--color-bg-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-subtle)',
        }}
      >
        {currentView === 'home' ? (
          /* Home Header: Bot Identity */
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--color-telegram)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.85rem',
              }}
            >
              TB
            </div>
            <h1
              style={{
                fontSize: '0.95rem',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
              }}
            >
              {dict.botName}
            </h1>
          </div>
        ) : (
          /* Settings Header: Back + Title */
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <button
              type="button"
              onClick={handleGoHome}
              aria-label={dict.backButton}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--color-telegram)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: 'var(--space-1)',
              }}
            >
              {isRtl ? <ArrowRight size={18} /> : <ArrowLeft size={18} />}
            </button>
            <h1
              style={{
                fontSize: '0.95rem',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
              }}
            >
              {dict.settingsTitle}
            </h1>
          </div>
        )}

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
          {currentView === 'home' && (
            <button
              type="button"
              onClick={handleOpenSettings}
              aria-label={dict.settingsTitle}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg-elevated)',
                color: 'var(--color-telegram)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              <Settings size={18} />
            </button>
          )}

          <button
            type="button"
            onClick={handleClose}
            aria-label={dict.closeButton}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              background: 'var(--color-bg-elevated)',
              color: 'var(--color-text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
          >
            <X size={18} />
          </button>
        </div>
      </header>

      {/* VIEW: HOME */}
      {currentView === 'home' && (
        <main style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div
            style={{
              background: 'var(--color-bg-surface)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-5) var(--space-4)',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-subtle)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'var(--space-2)',
            }}
          >
            {/* Online Status Pill */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-1)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(34, 197, 94, 0.12)',
                color: '#22c55e',
                fontSize: '0.75rem',
                fontWeight: 600,
                marginBottom: 'var(--space-1)',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#22c55e',
                }}
              />
              <span>{dict.systemReady}</span>
            </div>

            <h2
              style={{
                fontSize: '1.15rem',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
              }}
            >
              {dict.homeTitle}
            </h2>
            <p
              style={{
                fontSize: '0.85rem',
                color: 'var(--color-text-secondary)',
                maxWidth: '280px',
                lineHeight: 1.4,
              }}
            >
              {dict.homeSubtitle}
            </p>

            {/* Compact Gear Card Shortcut */}
            <button
              type="button"
              onClick={handleOpenSettings}
              style={{
                marginTop: 'var(--space-2)',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--space-3) var(--space-4)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg-elevated)',
                color: 'var(--color-text-primary)',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background var(--transition-fast)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Settings size={16} style={{ color: 'var(--color-telegram)' }} />
                <span>{dict.openSettings}</span>
              </div>
              <ChevronRight
                size={16}
                style={{
                  color: 'var(--color-text-muted)',
                  transform: isRtl ? 'rotate(180deg)' : 'none',
                }}
              />
            </button>
          </div>
        </main>
      )}

      {/* VIEW: SETTINGS */}
      {currentView === 'settings' && (
        <main style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <div
            style={{
              padding: '0 var(--space-2)',
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              color: 'var(--color-text-muted)',
              letterSpacing: '0.04em',
            }}
          >
            {dict.preferencesHeader}
          </div>

          <div
            style={{
              background: 'var(--color-bg-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-subtle)',
              overflow: 'hidden',
            }}
          >
            {/* Setting Row 1: Language */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--space-3) var(--space-4)',
                borderBottom: '1px solid var(--color-border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(36, 161, 222, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-telegram)',
                  }}
                >
                  <Globe size={16} />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    {dict.languageTitle}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>
                    {dict.languageSubtitle}
                  </div>
                </div>
              </div>

              {/* Segmented Control */}
              <div
                style={{
                  display: 'inline-flex',
                  background: 'var(--color-bg-elevated)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '2px',
                  border: '1px solid var(--color-border)',
                }}
              >
                <button
                  type="button"
                  onClick={() => handleLanguageChange('en')}
                  style={{
                    border: 'none',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: locale === 'en' ? 700 : 500,
                    cursor: 'pointer',
                    background: locale === 'en' ? 'var(--color-telegram)' : 'transparent',
                    color: locale === 'en' ? '#ffffff' : 'var(--color-text-secondary)',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => handleLanguageChange('ar')}
                  style={{
                    border: 'none',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: locale === 'ar' ? 700 : 500,
                    cursor: 'pointer',
                    background: locale === 'ar' ? 'var(--color-telegram)' : 'transparent',
                    color: locale === 'ar' ? '#ffffff' : 'var(--color-text-secondary)',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  AR
                </button>
              </div>
            </div>

            {/* Setting Row 2: Theme */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--space-3) var(--space-4)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(36, 161, 222, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-telegram)',
                  }}
                >
                  {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    {dict.themeTitle}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>
                    {dict.themeSubtitle}
                  </div>
                </div>
              </div>

              {/* Segmented Control */}
              <div
                style={{
                  display: 'inline-flex',
                  background: 'var(--color-bg-elevated)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '2px',
                  border: '1px solid var(--color-border)',
                }}
              >
                <button
                  type="button"
                  onClick={() => handleThemeChange('dark')}
                  style={{
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: theme === 'dark' ? 700 : 500,
                    cursor: 'pointer',
                    background: theme === 'dark' ? 'var(--color-telegram)' : 'transparent',
                    color: theme === 'dark' ? '#ffffff' : 'var(--color-text-secondary)',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <Moon size={12} />
                  <span>{dict.themeDark}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleThemeChange('light')}
                  style={{
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: theme === 'light' ? 700 : 500,
                    cursor: 'pointer',
                    background: theme === 'light' ? 'var(--color-telegram)' : 'transparent',
                    color: theme === 'light' ? '#ffffff' : 'var(--color-text-secondary)',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <Sun size={12} />
                  <span>{dict.themeLight}</span>
                </button>
              </div>
            </div>
          </div>
        </main>
      )}
    </div>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(<TmaApp />);
}
