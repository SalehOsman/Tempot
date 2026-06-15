import { logger } from './pino.logger.js';

export interface ModuleLoggerInstance {
  info: (data: Record<string, unknown>) => void;
  warn: (data: Record<string, unknown>) => void;
  error: (data: Record<string, unknown>) => void;
  debug: (data: Record<string, unknown>) => void;
  child: (bindings: Record<string, unknown>) => ModuleLoggerInstance;
  /** Starts an operation timer and logs its duration when end() is called. */
  startTimer: (operationName: string) => { end: (meta?: Record<string, unknown>) => void };
}

function wrapPinoChild(pinoChild: unknown): ModuleLoggerInstance {
  const child = pinoChild as {
    info: (data: unknown) => void;
    warn: (data: unknown) => void;
    error: (data: unknown) => void;
    debug: (data: unknown) => void;
    child: (bindings: Record<string, unknown>) => unknown;
  };

  return {
    info: (data) => child.info(data),
    warn: (data) => child.warn(data),
    error: (data) => child.error(data),
    debug: (data) => child.debug(data),
    child: (bindings) => wrapPinoChild(child.child(bindings)),
    startTimer: (operationName) => {
      const start = Date.now();
      return {
        end: (meta = {}) => {
          child.debug({
            msg: 'operation_timed',
            operation: operationName,
            durationMs: Date.now() - start,
            ...meta,
          });
        },
      };
    },
  };
}

/** Creates a logger child bound to a module name. */
export function createModuleLogger(moduleName: string): ModuleLoggerInstance {
  const child = logger.child({ module: moduleName });
  return wrapPinoChild(child);
}
