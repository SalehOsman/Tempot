export type EventLevel = 'LOCAL' | 'INTERNAL' | 'EXTERNAL';

export interface EventEnvelope<T = unknown> {
  eventId: string;
  eventName: string;
  module: string;
  userId?: string;
  payload: T;
  timestamp: Date;
  level: EventLevel;
}

/**
 * Validates the event name against the {module}.{entity}.{action} convention.
 * @param name The event name to validate.
 * @returns boolean True if valid, false otherwise.
 */
export function validateEventName(name: string): boolean {
  // Pattern: {module}.{entity}.{action}
  // Each part must be alphanumeric and start with a letter.
  const pattern = /^[a-z][a-z0-9-]*\.[a-z][a-z0-9-]*\.[a-z][a-z0-9-]*$/i;
  return pattern.test(name);
}
