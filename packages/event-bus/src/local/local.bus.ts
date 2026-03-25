import { EventEmitter } from 'node:events';
import { ok, err } from 'neverthrow';
import { AsyncResult, AppError, Result } from '@tempot/shared';
import { validateEventName } from '../contracts';

export class LocalEventBus {
  private emitter: EventEmitter;

  constructor() {
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(100);
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
            code: 'EVENT_BUS_LISTENER_ERROR',
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

  unsubscribe(eventName: string, handler: (payload: unknown) => void): void {
    this.emitter.off(eventName, handler);
  }
}
