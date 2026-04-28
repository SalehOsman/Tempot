export type NotificationPriority = 'low' | 'normal' | 'high';

export type NotificationTarget =
  | { kind: 'user'; userId: string }
  | { kind: 'users'; userIds: readonly string[] }
  | { kind: 'role'; role: string }
  | { kind: 'broadcast' };

export interface NotificationPayload {
  templateKey: string;
  variables?: Readonly<Record<string, unknown>>;
  locale?: string;
  silent?: boolean;
  priority?: NotificationPriority;
  metadata?: Readonly<Record<string, string>>;
}

export interface NotificationRecipient {
  userId: string;
  chatId: string;
  locale?: string;
  role?: string;
}

export interface NotificationJobData {
  id: string;
  recipient: NotificationRecipient;
  templateKey: string;
  variables: Readonly<Record<string, unknown>>;
  locale?: string;
  silent: boolean;
  priority: NotificationPriority;
  metadata: Readonly<Record<string, string>>;
  createdAt: string;
}

export interface NotificationEnqueueOptions {
  delayMs: number;
}

export interface DeliveryRequest {
  recipient: NotificationRecipient;
  text: string;
  silent: boolean;
  metadata: Readonly<Record<string, string>>;
}

export interface DeliveryReceipt {
  providerMessageId?: string;
}

export interface NotificationAttempt {
  jobId: string;
  userId: string;
  templateKey: string;
  status: 'success' | 'failed';
  errorCode?: string;
  referenceCode?: string;
  attemptedAt: string;
}

export interface NotificationRatePolicyOptions {
  maxPerSecond?: number;
}
