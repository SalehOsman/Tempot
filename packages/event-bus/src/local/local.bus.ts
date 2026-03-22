import { EventEmitter } from 'node:events';
import { ok, err } from 'neverthrow';
import { AsyncResult, AppError } from '@tempot/shared';
import { validateEventName } from '../contracts';

/**
 * Local implementation of the event bus using Node.js EventEmitter.
 * Provides sync-like delivery and listener isolation.
 */
export class LocalEventBus {
  private emitter: EventEmitter;

  constructor() {
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(100);
  }

  /**
   * Publishes an event to all local subscribers.
   * Ensures listener isolation by catching errors in each handler.
   */
  async publish(eventName: string, payload: unknown): AsyncResult<void> {
    if (!validateEventName(eventName)) {
      return err(new AppError('event_bus.invalid_name', `Invalid event name: ${eventName}`));
    }

    const listeners = this.emitter.listeners(eventName);

    /* eslint-disable @typescript-eslint/no-explicit-any */
    for (const listener of listeners) {
      try {
        // Local listeners are executed synchronously
        (listener as any)(payload);
      } catch (error) {
        // Listener isolation: errors in one listener do not stop others.
        // We log the error but continue.
        console.error(`[LocalEventBus] Error in listener for ${eventName}:`, error);
      }
    }
    /* eslint-enable @typescript-eslint/no-explicit-any */

    return ok(undefined);
  }

  /**
   * Subscribes a handler to an event.
   * Validates the event name convention.
   */
  /* eslint-disable @typescript-eslint/no-explicit-any */
  subscribe(eventName: string, handler: (payload: any) => void): void {
    if (!validateEventName(eventName)) {
      throw new AppError('event_bus.invalid_name', `Invalid event name: ${eventName}`);
    }

    this.emitter.on(eventName, handler);
  }

  /**
   * Unsubscribes a handler from an event.
   */
  unsubscribe(eventName: string, handler: (payload: any) => void): void {
    this.emitter.off(eventName, handler);
  }
  /* eslint-enable @typescript-eslint/no-explicit-any */
}
