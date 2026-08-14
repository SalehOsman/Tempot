import { logger } from './pino.logger.js';

export interface StepMeta {
  /** Additional structured fields emitted when the step succeeds. */
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

function begin(stepName: string, order: number): void {
  activeSteps.set(stepName, { name: stepName, order, startedAt: Date.now() });
  logger.debug({
    msg: 'step_begin',
    step: stepName,
    order,
    phase: 'startup',
  });
}

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

function fail(stepName: string, error: unknown, fatal = true): void {
  const step = activeSteps.get(stepName);
  const durationMs = step ? elapsed(step.startedAt) : -1;
  activeSteps.delete(stepName);

  const errorCode =
    error instanceof Error ? ((error as { code?: string }).code ?? error.message) : String(error);

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

function complete(totalDurationMs: number, loadedModules: string[]): void {
  logger.info({
    msg: 'startup_complete',
    totalDurationMs,
    modulesLoaded: loadedModules.length,
    modules: loadedModules,
    phase: 'startup',
  });
}

function shutdownBegin(signal: string): void {
  logger.info({ msg: 'shutdown_begin', signal, phase: 'shutdown' });
}

function shutdownStep(stepName: string, durationMs: number): void {
  logger.info({ msg: 'shutdown_step_ok', step: stepName, durationMs, phase: 'shutdown' });
}

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
