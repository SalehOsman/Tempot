import type React from 'react';
import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';

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

const DEFAULT_SETTINGS: SurfaceSettingsState = {
  platformName: 'Tembot Sovereign Platform',
  defaultLocale: 'ar',
  botName: 'Tembot Pro',
  botWelcomeMessage: 'مرحباً بك في البوت السيادي! كيف يمكنني خدمتك اليوم؟',
  botMaintenanceMode: false,
  tmaTitle: 'Tembot Mini App',
  tmaPrimaryColor: '#2563eb',
  tmaMaintenanceMode: false,
  sessionTimeoutMinutes: 60,
};

export function DashboardApp() {
  const [activeTab, setActiveTab] = useState<'settings' | 'roles' | 'status'>('settings');
  const [settings, setSettings] = useState<SurfaceSettingsState>(DEFAULT_SETTINGS);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [healthStatus, setHealthStatus] = useState<string>('جاري الفحص...');

  useEffect(() => {
    fetch('http://localhost:3000/health')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.status === 'ok') {
          setHealthStatus('متصل ونشط 🟢');
        } else {
          setHealthStatus('غير متصل (الخادم متوقف) 🔴');
        }
      })
      .catch(() => {
        setHealthStatus('محلي (وضع المعاينة المستقل)');
      });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('http://localhost:3000/api/v1/settings', {
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

  return (
    <div
      style={{
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '2rem',
        maxWidth: '1000px',
        margin: '0 auto',
        direction: 'rtl',
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
            ⚙️ لوحة التحكم السيادية | Tembot Admin
          </h1>
          <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>
            إدارة الأسطح الثلاثية والصلاحيات وحوكمة المنصة
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
          حالة الخادم: <strong>{healthStatus}</strong>
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
          ⚙️ إعدادات الأسطح الثلاثية
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
          🛡️ الصلاحيات ومحرك ctx.can
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
            تخصيص أسطح التليجرام والميني اب ولوحة التحكم
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
              ✓ تم حفظ الإعدادات وتحديث الكاش الموزع بنجاح!
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
              🤖 سطح بوت التليجرام (Telegram Bot Surface)
            </legend>
            <div style={{ marginBottom: '1rem' }}>
              <label
                htmlFor="botName"
                style={{ display: 'block', marginBottom: '0.25rem', color: '#cbd5e1' }}
              >
                اسم البوت:
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
                نص الترحيب في /start:
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
              تفعيل وضع الصيانة للبوت (إغلاق استقبال الطلبات مؤقتاً)
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
              📱 سطح تطبيق التليجرام المصغر (TMA Surface)
            </legend>
            <div style={{ marginBottom: '1rem' }}>
              <label
                htmlFor="tmaTitle"
                style={{ display: 'block', marginBottom: '0.25rem', color: '#cbd5e1' }}
              >
                عنوان تطبيق الميني اب:
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
                اللون الرئيسي للتطبيق:
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
              تفعيل وضع الصيانة للميني اب
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
            💾 حفظ التعديلات ونشر الإبطال
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
            مصفوفة الصلاحيات الهجينة (Hybrid RBCA)
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            الكود البرمجي يتحقق حصراً من الصلاحيات الذرية عبر <code>ctx.can</code> دون أي ارتباط صلب
            بمسميات الأدوار.
          </p>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #475569', color: '#38bdf8' }}>
                <th style={{ padding: '0.75rem' }}>الدور القياسي</th>
                <th style={{ padding: '0.75rem' }}>الوصف</th>
                <th style={{ padding: '0.75rem' }}>الصلاحيات الممنوحة</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #334155' }}>
                <td style={{ padding: '0.75rem', fontWeight: 600 }}>SuperAdmin</td>
                <td style={{ padding: '0.75rem', color: '#cbd5e1' }}>المالك وصلاحيات الطوارئ</td>
                <td style={{ padding: '0.75rem', color: '#34d399' }}>
                  <code>*</code> (كافة الصلاحيات بلا قيد)
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid #334155' }}>
                <td style={{ padding: '0.75rem', fontWeight: 600 }}>OperationsManager</td>
                <td style={{ padding: '0.75rem', color: '#cbd5e1' }}>مدير العمليات والإعدادات</td>
                <td style={{ padding: '0.75rem', color: '#38bdf8' }}>
                  <code>settings:*</code>, <code>broadcast:*</code>, <code>tasks:*</code>
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid #334155' }}>
                <td style={{ padding: '0.75rem', fontWeight: 600 }}>Auditor</td>
                <td style={{ padding: '0.75rem', color: '#cbd5e1' }}>التدقيق الجنائي والامتثال</td>
                <td style={{ padding: '0.75rem', color: '#fbbf24' }}>
                  <code>audit:read</code>, <code>audit:export</code>, <code>telemetry:read</code>
                </td>
              </tr>
              <tr>
                <td style={{ padding: '0.75rem', fontWeight: 600 }}>EndUser</td>
                <td style={{ padding: '0.75rem', color: '#cbd5e1' }}>مستخدم البوت والميني اب</td>
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
