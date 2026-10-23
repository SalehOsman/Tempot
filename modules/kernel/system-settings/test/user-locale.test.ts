import { describe, expect, it } from 'vitest';
import { SettingsService } from '../src/application/settings-service.js';

/**
 * Sovereign Per-User Locale Preference Test
 * Validates INC-20261023-02: User-level locale isolation.
 */
describe('Sovereign Per-User Locale Preference (INC-20261023-02)', () => {
  const tenantId = '00000000-0000-0000-0000-000000000000';

  it('falls back to tenant default locale when user preference is unset', async () => {
    const service = new SettingsService();
    const res = await service.getUserLocale(tenantId, 'user_new_1');
    expect(res.isOk()).toBe(true);
    if (res.isOk()) {
      expect(res.value).toBe('en');
    }
  });

  it('isolates User A preference to Arabic while User B remains English', async () => {
    const service = new SettingsService();

    // User A sets locale to Arabic
    const setRes = await service.setUserLocale(tenantId, 'user_a_100', 'ar', {
      username: 'saleh',
      firstName: 'Saleh',
    });
    expect(setRes.isOk()).toBe(true);

    // User A should now receive 'ar'
    const userARes = await service.getUserLocale(tenantId, 'user_a_100');
    expect(userARes.isOk()).toBe(true);
    if (userARes.isOk()) {
      expect(userARes.value).toBe('ar');
    }

    // User B should remain 'en' (tenant default, isolated)
    const userBRes = await service.getUserLocale(tenantId, 'user_b_200');
    expect(userBRes.isOk()).toBe(true);
    if (userBRes.isOk()) {
      expect(userBRes.value).toBe('en');
    }

    // Tenant-wide default must NOT be mutated
    const tenantSettings = await service.getSettings(tenantId);
    expect(tenantSettings.isOk()).toBe(true);
    if (tenantSettings.isOk()) {
      expect(tenantSettings.value.defaultLocale).toBe('en');
    }
  });
});
