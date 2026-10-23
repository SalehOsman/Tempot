import { Check, Globe, Moon, Settings, Sun, X } from 'lucide-react';
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
      HapticFeedback?: {
        impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void;
        notificationOccurred(type: 'error' | 'success' | 'warning'): void;
      };
      themeParams?: {
        bg_color?: string;
        text_color?: string;
      };
    };
  };
}

declare const window: WindowWithTelegram;

export function TmaApp() {
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

  const triggerHaptic = () => {
    try {
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
    } catch {
      // Haptics optional outside Telegram client
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

  const handleClose = () => {
    triggerHaptic();
    if (window.Telegram?.WebApp && typeof window.Telegram.WebApp.close === 'function') {
      window.Telegram.WebApp.close();
    } else {
      window.close();
    }
  };

  return (
    <div
      style={{
        maxWidth: '460px',
        margin: '0 auto',
        padding: 'var(--space-4)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-6)',
      }}
    >
      {/* Top Bar: Bot Name & Settings Icon & Close */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--space-3) var(--space-4)',
          background: 'var(--color-bg-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
            }}
          >
            <Settings size={20} />
          </div>
          <div>
            <h1
              style={{
                fontSize: '1.05rem',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
                letterSpacing: '-0.01em',
              }}
            >
              {dict.botName}
            </h1>
            <span
              style={{
                fontSize: '0.75rem',
                color: 'var(--color-text-muted)',
                fontWeight: 500,
              }}
            >
              {dict.settingsTitle}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleClose}
          aria-label={dict.closeButton}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-1)',
            minHeight: 'var(--min-touch-target)',
            padding: '0 var(--space-3)',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--color-border)',
            background: 'var(--color-bg-elevated)',
            color: 'var(--color-text-secondary)',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
          }}
        >
          <X size={16} />
          <span>{dict.closeButton}</span>
        </button>
      </header>

      {/* Main Settings Container */}
      <main
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
        }}
      >
        {/* Function 1: Language Switcher */}
        <section
          style={{
            background: 'var(--color-bg-surface)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-5)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
              marginBottom: 'var(--space-1)',
            }}
          >
            <Globe size={18} style={{ color: 'var(--color-primary)' }} />
            <h2
              style={{
                fontSize: '0.95rem',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
              }}
            >
              {dict.languageTitle}
            </h2>
          </div>
          <p
            style={{
              fontSize: '0.8rem',
              color: 'var(--color-text-muted)',
              marginBottom: 'var(--space-4)',
            }}
          >
            {dict.languageSubtitle}
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 'var(--space-3)',
            }}
          >
            {/* English Button */}
            <button
              type="button"
              onClick={() => handleLanguageChange('en')}
              style={{
                minHeight: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 var(--space-4)',
                borderRadius: 'var(--radius-md)',
                border: `1.5px solid ${locale === 'en' ? 'var(--color-border-active)' : 'var(--color-border)'}`,
                background:
                  locale === 'en' ? 'var(--color-bg-elevated)' : 'var(--color-bg-surface)',
                boxShadow: locale === 'en' ? 'var(--shadow-active)' : 'none',
                color: locale === 'en' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                fontWeight: locale === 'en' ? 700 : 500,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              <span>{dict.langEn}</span>
              {locale === 'en' && <Check size={16} />}
            </button>

            {/* Arabic Button */}
            <button
              type="button"
              onClick={() => handleLanguageChange('ar')}
              style={{
                minHeight: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 var(--space-4)',
                borderRadius: 'var(--radius-md)',
                border: `1.5px solid ${locale === 'ar' ? 'var(--color-border-active)' : 'var(--color-border)'}`,
                background:
                  locale === 'ar' ? 'var(--color-bg-elevated)' : 'var(--color-bg-surface)',
                boxShadow: locale === 'ar' ? 'var(--shadow-active)' : 'none',
                color: locale === 'ar' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                fontWeight: locale === 'ar' ? 700 : 500,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              <span>{dict.langAr}</span>
              {locale === 'ar' && <Check size={16} />}
            </button>
          </div>
        </section>

        {/* Function 2: Theme Switcher */}
        <section
          style={{
            background: 'var(--color-bg-surface)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-5)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
              marginBottom: 'var(--space-1)',
            }}
          >
            {theme === 'dark' ? (
              <Moon size={18} style={{ color: 'var(--color-primary)' }} />
            ) : (
              <Sun size={18} style={{ color: 'var(--color-primary)' }} />
            )}
            <h2
              style={{
                fontSize: '0.95rem',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
              }}
            >
              {dict.themeTitle}
            </h2>
          </div>
          <p
            style={{
              fontSize: '0.8rem',
              color: 'var(--color-text-muted)',
              marginBottom: 'var(--space-4)',
            }}
          >
            {dict.themeSubtitle}
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 'var(--space-3)',
            }}
          >
            {/* Dark Theme Button */}
            <button
              type="button"
              onClick={() => handleThemeChange('dark')}
              style={{
                minHeight: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'var(--space-2)',
                padding: '0 var(--space-4)',
                borderRadius: 'var(--radius-md)',
                border: `1.5px solid ${theme === 'dark' ? 'var(--color-border-active)' : 'var(--color-border)'}`,
                background:
                  theme === 'dark' ? 'var(--color-bg-elevated)' : 'var(--color-bg-surface)',
                boxShadow: theme === 'dark' ? 'var(--shadow-active)' : 'none',
                color: theme === 'dark' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                fontWeight: theme === 'dark' ? 700 : 500,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              <Moon size={16} />
              <span>{dict.themeDark}</span>
            </button>

            {/* Light Theme Button */}
            <button
              type="button"
              onClick={() => handleThemeChange('light')}
              style={{
                minHeight: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'var(--space-2)',
                padding: '0 var(--space-4)',
                borderRadius: 'var(--radius-md)',
                border: `1.5px solid ${theme === 'light' ? 'var(--color-border-active)' : 'var(--color-border)'}`,
                background:
                  theme === 'light' ? 'var(--color-bg-elevated)' : 'var(--color-bg-surface)',
                boxShadow: theme === 'light' ? 'var(--shadow-active)' : 'none',
                color: theme === 'light' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                fontWeight: theme === 'light' ? 700 : 500,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              <Sun size={16} />
              <span>{dict.themeLight}</span>
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(<TmaApp />);
}
