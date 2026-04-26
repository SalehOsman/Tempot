/**
 * Module Logger Factory — يُنشئ logger مرتبط بموديول محدد
 *
 * كل موديول يحصل على logger يحمل اسمه تلقائياً في كل سطر لوج،
 * مما يُسهّل البحث في الـ logs: `grep "module:user-management"`.
 *
 * يُطبع تلقائياً:
 *  - اسم الموديول
 *  - userId من الـ session context (إذا وُجد)
 *  - مدة العملية عبر timing helpers
 *
 * الاستخدام:
 *   const log = createModuleLogger('user-management');
 *   log.info({ msg: 'profile_fetched', telegramId });
 *   const timer = log.startTimer('db_query');
 *   timer.end({ rowCount: 5 }); // يُطبع durationMs تلقائياً
 */

import { logger } from './pino.logger.js';

export interface ModuleLoggerInstance {
  info: (data: Record<string, unknown>) => void;
  warn: (data: Record<string, unknown>) => void;
  error: (data: Record<string, unknown>) => void;
  debug: (data: Record<string, unknown>) => void;
  child: (bindings: Record<string, unknown>) => ModuleLoggerInstance;
  /** يبدأ مؤقتاً — استدعِ .end() عند انتهاء العملية لطباعة durationMs */
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

/**
 * يُنشئ logger مرتبطاً بموديول محدد
 * @param moduleName — اسم الموديول (مثل 'user-management')
 */
export function createModuleLogger(moduleName: string): ModuleLoggerInstance {
  const child = logger.child({ module: moduleName });
  return wrapPinoChild(child);
}
