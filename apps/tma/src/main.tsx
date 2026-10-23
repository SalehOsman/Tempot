import { ArrowLeft, ArrowRight, Globe, Moon, Settings, Sun, X } from 'lucide-react';
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
      setHeaderColor?(color: string): void;
      setBackgroundColor?(color: string): void;
      BackButton?: {
        show(): void;
        hide(): void;
        onClick(callback: () => void): void;
        offClick(callback: () => void): void;
      };
      HapticFeedback?: {
        impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void;
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
  const isDark = theme === 'dark';

  // Explicit color palette derived from Telegram brand identity
  const palette = {
    bgBase: isDark ? '#0e1621' : '#f0f2f5',
    bgSurface: isDark ? '#17212b' : '#ffffff',
    bgElevated: isDark ? '#242f3d' : '#f4f6f8',
    border: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
    textPrimary: isDark ? '#f5f5f5' : '#111827',
    textSecondary: isDark ? '#7f91a4' : '#707579',
    textMuted: isDark ? '#5f7082' : '#9aa0a6',
    primary: '#24a1de',
    shadow: isDark ? '0 4px 16px rgba(0, 0, 0, 0.35)' : '0 4px 16px rgba(0, 0, 0, 0.06)',
  };

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

  // Synchronize theme across DOM, body and Telegram native chrome
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
    document.documentElement.style.backgroundColor = palette.bgBase;
    document.body.style.backgroundColor = palette.bgBase;

    const tg = window.Telegram?.WebApp;
    if (tg && typeof tg.setHeaderColor === 'function') {
      try {
        tg.setHeaderColor(palette.bgBase);
      } catch {
        // Optional outside Telegram
      }
    }
    if (tg && typeof tg.setBackgroundColor === 'function') {
      try {
        tg.setBackgroundColor(palette.bgBase);
      } catch {
        // Optional outside Telegram
      }
    }
  }, [theme, palette.bgBase]);

  // Sync Telegram native BackButton
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg?.BackButton) return undefined;

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
        minHeight: '100vh',
        background: palette.bgBase,
        color: palette.textPrimary,
        transition: 'background 180ms ease, color 180ms ease',
      }}
    >
      {/* Universal Compact Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--space-2) var(--space-3)',
          background: palette.bgSurface,
          borderRadius: 'var(--radius-md)',
          border: `1px solid ${palette.border}`,
          boxShadow: palette.shadow,
          transition: 'background 180ms ease, border-color 180ms ease',
        }}
      >
        {currentView === 'home' ? (
          /* Home Header: Bot Identity */
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-sm)',
                background: palette.primary,
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
                color: palette.textPrimary,
              }}
            >
              {dict.botName}
            </h1>
          </div>
        ) : (
          /* Settings Header: Back Button + Title */
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
            }}
          >
            <button
              type="button"
              onClick={handleGoHome}
              aria-label={dict.backButton}
              style={{
                background: 'transparent',
                border: 'none',
                color: palette.primary,
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
                color: palette.textPrimary,
              }}
            >
              {dict.settingsTitle}
            </h1>
          </div>
        )}

        {/* Action Controls */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-1)',
          }}
        >
          {currentView === 'home' && (
            <button
              type="button"
              onClick={handleOpenSettings}
              aria-label={dict.settingsTitle}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-sm)',
                border: `1px solid ${palette.border}`,
                background: palette.bgElevated,
                color: palette.primary,
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
              border: `1px solid ${palette.border}`,
              background: palette.bgElevated,
              color: palette.textSecondary,
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

      {/* VIEW: HOME (Clean canvas reserved for future operational modules) */}
      {currentView === 'home' && <main style={{ flex: 1 }} />}

      {/* VIEW: SETTINGS */}
      {currentView === 'settings' && (
        <main
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-2)',
          }}
        >
          <div
            style={{
              padding: '0 var(--space-2)',
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              color: palette.textMuted,
              letterSpacing: '0.04em',
            }}
          >
            {dict.preferencesHeader}
          </div>

          <div
            style={{
              background: palette.bgSurface,
              borderRadius: 'var(--radius-md)',
              border: `1px solid ${palette.border}`,
              boxShadow: palette.shadow,
              overflow: 'hidden',
              transition: 'background 180ms ease, border-color 180ms ease',
            }}
          >
            {/* Setting Row 1: Language */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--space-3) var(--space-4)',
                borderBottom: `1px solid ${palette.border}`,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                }}
              >
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(36, 161, 222, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: palette.primary,
                  }}
                >
                  <Globe size={16} />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: palette.textPrimary,
                    }}
                  >
                    {dict.languageTitle}
                  </div>
                  <div
                    style={{
                      fontSize: '0.72rem',
                      color: palette.textSecondary,
                    }}
                  >
                    {dict.languageSubtitle}
                  </div>
                </div>
              </div>

              {/* Segmented Control */}
              <div
                style={{
                  display: 'inline-flex',
                  background: palette.bgElevated,
                  borderRadius: 'var(--radius-sm)',
                  padding: '2px',
                  border: `1px solid ${palette.border}`,
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
                    background: locale === 'en' ? palette.primary : 'transparent',
                    color: locale === 'en' ? '#ffffff' : palette.textSecondary,
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
                    background: locale === 'ar' ? palette.primary : 'transparent',
                    color: locale === 'ar' ? '#ffffff' : palette.textSecondary,
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
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                }}
              >
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(36, 161, 222, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: palette.primary,
                  }}
                >
                  {isDark ? <Moon size={16} /> : <Sun size={16} />}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: palette.textPrimary,
                    }}
                  >
                    {dict.themeTitle}
                  </div>
                  <div
                    style={{
                      fontSize: '0.72rem',
                      color: palette.textSecondary,
                    }}
                  >
                    {dict.themeSubtitle}
                  </div>
                </div>
              </div>

              {/* Segmented Control */}
              <div
                style={{
                  display: 'inline-flex',
                  background: palette.bgElevated,
                  borderRadius: 'var(--radius-sm)',
                  padding: '2px',
                  border: `1px solid ${palette.border}`,
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
                    fontWeight: isDark ? 700 : 500,
                    cursor: 'pointer',
                    background: isDark ? palette.primary : 'transparent',
                    color: isDark ? '#ffffff' : palette.textSecondary,
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
                    fontWeight: !isDark ? 700 : 500,
                    cursor: 'pointer',
                    background: !isDark ? palette.primary : 'transparent',
                    color: !isDark ? '#ffffff' : palette.textSecondary,
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
