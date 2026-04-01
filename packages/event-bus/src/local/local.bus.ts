import { EventEmitter } from 'node:events';
import { ok, err } from 'neverthrow';
import { AsyncResult, AppError, Result } from '@tempot/shared';
import { validateEventName } from '../event-bus.contracts.js';

const MAX_EVENT_LISTENERS = 100;

export class LocalEventBus {
  private emitter: EventEmitter;

  constructor() {
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(MAX_EVENT_LISTENERS);
  }

  async publish(eventName: string, payload: unknown): AsyncResult<void> {
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

  subscribe(eventName: string, handler: (payload: unknown) => void): Result<void, AppError> {
    if (!validateEventName(eventName)) {
      return err(new AppError('event_bus.invalid_name', `Invalid event name: ${eventName}`));
    }
    this.emitter.on(eventName, handler);
    return ok(undefined);
  }

  unsubscribe(eventName: string, handler: (payload: unknown) => void): Result<void, AppError> {
    if (!validateEventName(eventName)) {
      return err(new AppError('event_bus.invalid_name', `Invalid event name: ${eventName}`));
    }
    this.emitter.off(eventName, handler);
    return ok(undefined);
  }
}
