import type { InteractionRecorderLike } from '@tempot/interaction-observability';

export interface ObserverLogger {
  info: (data: object) => void;
  warn?: (data: object) => void;
  error: (data: object) => void;
}

export interface InteractionObserverDeps {
  logger: ObserverLogger;
  commandModuleMap?: Record<string, string>;
  traceIdFactory?: () => string;
  interactionRecorder?: InteractionRecorderLike;
}
