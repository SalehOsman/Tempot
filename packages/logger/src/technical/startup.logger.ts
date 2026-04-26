/**
 * Startup Logger — تتبع دقيق لكل خطوة في دورة حياة التطبيق
 *
 * يُحل المشكلة الجذرية: عند فشل Docker أو الـ startup، يعرف المطور
 * بالضبط أي خطوة فشلت، ولماذا، وكم استغرقت.
 *
 * الاستخدام:
 *   startupLogger.begin('loadConfig', 1)
 *   startupLogger.ok('loadConfig', { mode: 'polling' })
 *   startupLogger.fail('loadConfig', error)
 */

import { logger } from './pino.logger.js';

export interface StepMeta {
  /** بيانات إضافية تُطبع عند النجاح */
  data?: Record<string, unknown>;
}

interface ActiveStep {
  name: string;
  order: number;
  startedAt: number;
}

const activeSteps = new Map<string, ActiveStep>();

function elapsed(startedAt: number): number {
  return Date.now() - startedAt;
}

/**
 * يُسجّل بداية خطوة — يجب استدعاؤه قبل ok() أو fail()
 */
function begin(stepName: string, order: number): void {
  activeSteps.set(stepName, { name: stepName, order, startedAt: Date.now() });
  logger.debug({
    msg: 'step_begin',
    step: stepName,
    order,
    phase: 'startup',
  });
}

/**
 * يُسجّل نجاح خطوة مع مدتها بالمللي‌ثانية
 */
function ok(stepName: string, meta?: StepMeta): void {
  const step = activeSteps.get(stepName);
  const durationMs = step ? elapsed(step.startedAt) : -1;
  activeSteps.delete(stepName);

  logger.info({
    msg: 'step_ok',
    step: stepName,
    order: step?.order,
    durationMs,
    phase: 'startup',
    ...meta?.data,
  });
}

/**
 * يُسجّل فشل خطوة مع السبب الكامل — يُفرّق بين fatal وnon-fatal
 */
function fail(stepName: string, error: unknown, fatal = true): void {
  const step = activeSteps.get(stepName);
  const durationMs = step ? elapsed(step.startedAt) : -1;
  activeSteps.delete(stepName);

  const errorCode =
    error instanceof Error
      ? (error as { code?: string }).code ?? error.message
      : String(error);

  logger.error({
    msg: fatal ? 'step_fatal' : 'step_warn',
    step: stepName,
    order: step?.order,
    durationMs,
    phase: 'startup',
    errorCode,
    fatal,
  });
}

/**
 * يُسجّل اكتمال الـ startup بالكامل
 */
function complete(totalDurationMs: number, loadedModules: string[]): void {
  logger.info({
    msg: 'startup_complete',
    totalDurationMs,
    modulesLoaded: loadedModules.length,
    modules: loadedModules,
    phase: 'startup',
  });
}

/**
 * يُسجّل بداية الـ shutdown
 */
function shutdownBegin(signal: string): void {
  logger.info({ msg: 'shutdown_begin', signal, phase: 'shutdown' });
}

/**
 * يُسجّل اكتمال خطوة shutdown
 */
function shutdownStep(stepName: string, durationMs: number): void {
  logger.info({ msg: 'shutdown_step_ok', step: stepName, durationMs, phase: 'shutdown' });
}

/**
 * يُسجّل اكتمال الـ shutdown بالكامل
 */
function shutdownComplete(totalDurationMs: number): void {
  logger.info({ msg: 'shutdown_complete', totalDurationMs, phase: 'shutdown' });
}

export const startupLogger = {
  begin,
  ok,
  fail,
  complete,
  shutdownBegin,
  shutdownStep,
  shutdownComplete,
} as const;
