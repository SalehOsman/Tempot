import type { InputEngineEventBus, InputEngineLogger } from '../input-engine.contracts.js';

/** Bundled dependencies for safe event emission */
interface EventEmitterDeps {
  eventBus: InputEngineEventBus;
  logger: InputEngineLogger;
}

/**
 * Safely emit an event. Failures are logged but never propagated.
 */
export async function emitEvent(
  deps: EventEmitterDeps,
  eventName: string,
  payload: unknown,
): Promise<void> {
  const result = await deps.eventBus.publish(eventName, payload);
  if (result.isErr()) {
    deps.logger.warn({
      msg: 'Event emission failed',
      eventName,
      errorCode: result.error.code,
    });
  }
}
