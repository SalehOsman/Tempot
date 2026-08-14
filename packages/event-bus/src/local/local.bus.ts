import { EventEmitter } from 'node:events';
import { ok, err } from 'neverthrow';
import { AsyncResult, AppError, Result } from '@tempot/shared';
import { validateEventName } from '../event-bus.contracts.js';
import type { TempotEvents } from '../event-bus.events.js';
import { eventBusToggle } from '../event-bus.toggle.js';

const MAX_EVENT_LISTENERS = 100;

export class LocalEventBus {
  private emitter: EventEmitter;

  constructor() {
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(MAX_EVENT_LISTENERS);
  }

  async publish<K extends string>(
    eventName: K,
    payload: K extends keyof TempotEvents ? TempotEvents[K] : unknown,
  ): AsyncResult<void> {
    const disabled = eventBusToggle.check();
    if (disabled) return disabled;

    if (!validateEventName(eventName)) {
      return err(new AppError('event_bus.invalid_name', `Invalid event name: ${eventName}`));
    }

    const listeners = this.emitter.listeners(eventName);

    for (const listener of listeners) {
      try {
        (listener as (payload: unknown) => void)(payload);
      } catch (error) {
        process.stderr.write(
          JSON.stringify({
            level: 'error',
            code: 'event_bus.listener_error',
            eventName,
            error: String(error),
          }) + '\n',
        );
      }
    }

    return ok(undefined);
  }

  subscribe<K extends string>(
    eventName: K,
    handler: (payload: K extends keyof TempotEvents ? TempotEvents[K] : unknown) => void,
  ): Result<void, AppError> {
    const disabled = eventBusToggle.check();
    if (disabled) return disabled;

    if (!validateEventName(eventName)) {
      return err(new AppError('event_bus.invalid_name', `Invalid event name: ${eventName}`));
    }
    this.emitter.on(eventName, handler);
    return ok(undefined);
  }

  unsubscribe<K extends string>(
    eventName: K,
    handler: (payload: K extends keyof TempotEvents ? TempotEvents[K] : unknown) => void,
  ): Result<void, AppError> {
    const disabled = eventBusToggle.check();
    if (disabled) return disabled;

    if (!validateEventName(eventName)) {
      return err(new AppError('event_bus.invalid_name', `Invalid event name: ${eventName}`));
    }
    this.emitter.off(eventName, handler);
    return ok(undefined);
  }
}
