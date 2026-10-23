import { describe, expect, it } from 'vitest';
import { OperatorLoginSchema } from '../src/auth.dto.js';
import { UpdateSystemSettingsSchema } from '../src/settings.dto.js';

describe('Browser-Safe Contracts & DTOs Specification', () => {
  it('validates correct hex colors and locales in UpdateSystemSettingsSchema', () => {
    const valid = UpdateSystemSettingsSchema.safeParse({
      botName: 'MyBot',
      defaultLocale: 'ar',
      brandingPrimaryColor: '#2563eb',
      maintenanceMode: false,
    });

    expect(valid.success).toBe(true);
  });

  it('rejects invalid hex color format', () => {
    const invalid = UpdateSystemSettingsSchema.safeParse({
      brandingPrimaryColor: 'not-a-color',
    });

    expect(invalid.success).toBe(false);
    if (!invalid.success) {
      expect(invalid.error.issues[0].message).toBe('Invalid hex color');
    }
  });

  it('validates email and password constraints in OperatorLoginSchema', () => {
    const invalidEmail = OperatorLoginSchema.safeParse({
      email: 'not-email',
      password: 'password123',
    });
    expect(invalidEmail.success).toBe(false);

    const shortPassword = OperatorLoginSchema.safeParse({
      email: 'admin@tembot.dev',
      password: 'short',
    });
    expect(shortPassword.success).toBe(false);

    const validLogin = OperatorLoginSchema.safeParse({
      email: 'admin@tembot.dev',
      password: 'validStrongPassword123',
    });
    expect(validLogin.success).toBe(true);
  });
});
