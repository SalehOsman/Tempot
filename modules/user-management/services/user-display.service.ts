import type { ModuleI18n } from '../types/module-deps.types.js';
import type { UserProfile } from '../types/index.js';

export function formatRegionalLabel(
  value: string | undefined,
  i18n: ModuleI18n,
  fallback: string,
): string {
  if (!value) return fallback;
  const translated = i18n.t(value);
  if (translated !== value) return translated;
  return humanizeKey(value);
}

export function buildUserDetailMessage(user: UserProfile, i18n: ModuleI18n): string {
  const undef = i18n.t('user-management.common.undefined');
  return i18n.t('user-management.users.detail_message', {
    username: user.username ?? undef,
    telegramId: user.telegramId,
    email: user.email ?? undef,
    language: i18n.t(`user-management.language.${user.language}`),
    role: i18n.t(`user-management.role.${user.role}`),
    nationalId: user.nationalId ?? undef,
    mobile: user.mobileNumber ?? undef,
    birthDate: formatDate(user.birthDate, undef),
    gender: user.gender ? i18n.t(`user-management.gender.${user.gender}`) : undef,
    governorate: formatRegionalLabel(user.governorate, i18n, undef),
    countryCode: user.countryCode ?? undef,
    createdAt: formatDate(user.createdAt, undef),
    updatedAt: formatDate(user.updatedAt, undef),
  });
}

function formatDate(value: Date | undefined, fallback: string): string {
  return value ? new Date(value).toLocaleDateString('ar-EG') : fallback;
}

function humanizeKey(value: string): string {
  const segment = value.split('.').at(-1) ?? value;
  return segment
    .split(/[-_]/)
    .filter((part) => part.length > 0)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
