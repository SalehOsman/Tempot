import { InlineKeyboard } from 'grammy';
import type { UserProfile } from '../types/index.js';
import type { ModuleI18n } from '../types/module-deps.types.js';

const STATS_LOCALE = 'ar-EG';
const PROFILE_COMPLETENESS_FIELDS: ReadonlyArray<(user: UserProfile) => unknown> = [
  (user) => user.username,
  (user) => user.email,
  (user) => user.language,
  (user) => user.role,
  (user) => user.nationalId,
  (user) => user.mobileNumber,
  (user) => user.birthDate,
  (user) => user.gender,
  (user) => user.governorate,
  (user) => user.countryCode,
];

export class ProfileMenuFactory {
  static createView(_user: UserProfile, i18n: ModuleI18n): InlineKeyboard {
    return new InlineKeyboard()
      .text(i18n.t('user-management.profile.button.edit'), 'profile:edit')
      .row()
      .text(i18n.t('user-management.profile.button.stats'), 'profile:stats')
      .row()
      .text(i18n.t('user-management.menu.back'), 'menu:main');
  }

  static createEdit(i18n: ModuleI18n): InlineKeyboard {
    return new InlineKeyboard()
      .text(i18n.t('user-management.profile.button.name'), 'profile:edit:name')
      .text(i18n.t('user-management.profile.button.email'), 'profile:edit:email')
      .row()
      .text(i18n.t('user-management.profile.button.language'), 'profile:edit:language')
      .text(i18n.t('user-management.profile.button.role'), 'profile:edit:role')
      .row()
      .text(i18n.t('user-management.profile.button.personal'), 'profile:edit:personal')
      .row()
      .text(i18n.t('user-management.menu.back'), 'profile:view');
  }

  static createEditPersonal(i18n: ModuleI18n): InlineKeyboard {
    return new InlineKeyboard()
      .text(i18n.t('user-management.profile.button.national_id'), 'profile:edit:national_id')
      .row()
      .text(i18n.t('user-management.profile.button.mobile'), 'profile:edit:mobile')
      .row()
      .text(i18n.t('user-management.profile.button.birth_date'), 'profile:edit:birth_date')
      .row()
      .text(i18n.t('user-management.profile.button.gender'), 'profile:edit:gender')
      .row()
      .text(i18n.t('user-management.profile.button.governorate'), 'profile:edit:governorate')
      .row()
      .text(i18n.t('user-management.profile.button.country_code'), 'profile:edit:country_code')
      .row()
      .text(i18n.t('user-management.menu.back'), 'profile:edit');
  }

  static createStats(
    user: UserProfile,
    i18n: ModuleI18n,
  ): { keyboard: InlineKeyboard; message: string } {
    const keyboard = new InlineKeyboard().text(i18n.t('user-management.menu.back'), 'profile:view');
    const message = i18n.t(
      'user-management.profile.stats_message',
      buildStatsViewModel(user, i18n),
    );

    return { keyboard, message };
  }
}

function buildStatsViewModel(user: UserProfile, i18n: ModuleI18n): Record<string, string> {
  const completedFields = countCompletedProfileFields(user);
  const totalFields = PROFILE_COMPLETENESS_FIELDS.length;
  return {
    createdAt: formatDate(user.createdAt),
    updatedAt: formatDate(user.updatedAt),
    accountAgeDays: formatNumber(daysSince(user.createdAt)),
    role: i18n.t(`user-management.role.${user.role}`),
    language: i18n.t(`user-management.language.${user.language}`),
    completedFields: formatNumber(completedFields),
    totalFields: formatNumber(totalFields),
    completionPercent: formatPercent(completedFields, totalFields),
    profileStatus: completionStatus(completedFields, totalFields, i18n),
    contactStatus: contactStatus(user, i18n),
    identityStatus: identityStatus(user, i18n),
    messageCount: formatOptionalNumber(user.messageCount, i18n),
    completedTasks: formatOptionalNumber(user.completedTasks, i18n),
    activeTime: user.activeTime ?? i18n.t('user-management.profile.metric_unavailable'),
    rating: user.rating ?? i18n.t('user-management.profile.metric_unavailable'),
  };
}

function countCompletedProfileFields(user: UserProfile): number {
  return PROFILE_COMPLETENESS_FIELDS.filter((readValue) => hasValue(readValue(user))).length;
}

function hasValue(value: unknown): boolean {
  return value !== undefined && value !== null && value !== '';
}

function formatDate(date: Date): string {
  return date.toLocaleDateString(STATS_LOCALE);
}

function formatNumber(value: number): string {
  return value.toLocaleString(STATS_LOCALE);
}

function formatOptionalNumber(value: number | undefined, i18n: ModuleI18n): string {
  return value === undefined
    ? i18n.t('user-management.profile.metric_unavailable')
    : formatNumber(value);
}

function formatPercent(completedFields: number, totalFields: number): string {
  return `${Math.round((completedFields / totalFields) * 100).toLocaleString(STATS_LOCALE)}%`;
}

function daysSince(date: Date): number {
  const millisecondsPerDay = 86_400_000;
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / millisecondsPerDay));
}

function completionStatus(completedFields: number, totalFields: number, i18n: ModuleI18n): string {
  const key =
    completedFields === totalFields
      ? 'user-management.profile.status.complete'
      : 'user-management.profile.status.incomplete';
  return i18n.t(key);
}

function contactStatus(user: UserProfile, i18n: ModuleI18n): string {
  const key =
    hasValue(user.email) && hasValue(user.mobileNumber)
      ? 'user-management.profile.status.verified'
      : 'user-management.profile.status.needs_update';
  return i18n.t(key);
}

function identityStatus(user: UserProfile, i18n: ModuleI18n): string {
  const key =
    hasValue(user.nationalId) && hasValue(user.birthDate) && hasValue(user.governorate)
      ? 'user-management.profile.status.verified'
      : 'user-management.profile.status.needs_update';
  return i18n.t(key);
}
