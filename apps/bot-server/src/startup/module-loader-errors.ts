import { err, ok } from 'neverthrow';
import type { AsyncResult } from '@tempot/shared';
import { AppError } from '@tempot/shared';
import { BOT_SERVER_ERRORS } from '../bot-server.errors.js';
import type { ModuleLogger } from '../bot-server.types.js';
import type { ValidatedModuleInput } from './module-loader.js';

export function handleMissingExport(
  mod: ValidatedModuleInput,
  logger: ModuleLogger,
): AsyncResult<string | undefined> {
  if (mod.config.isCore) {
    logger.error({ msg: 'Core module missing default export', module: mod.config.name });
    return Promise.resolve(
      err(new AppError(BOT_SERVER_ERRORS.MODULE_SETUP_MISSING, { module: mod.config.name })),
    );
  }
  logger.warn({ msg: 'Module missing default export, skipping', module: mod.config.name });
  return Promise.resolve(ok(undefined));
}

export function handleImportError(
  mod: ValidatedModuleInput,
  error: unknown,
  logger: ModuleLogger,
): AsyncResult<string | undefined> {
  const details = extractErrorDetails(error);
  if (mod.config.isCore) {
    logger.error({ msg: 'Core module import failed', module: mod.config.name, ...details });
    return Promise.resolve(
      err(
        new AppError(BOT_SERVER_ERRORS.CORE_MODULE_HANDLER_FAILED, {
          module: mod.config.name,
          ...details,
        }),
      ),
    );
  }
  logger.warn({
    msg: 'Non-core module import failed, skipping',
    module: mod.config.name,
    ...details,
  });
  return Promise.resolve(ok(undefined));
}

export function handleSetupError(
  mod: ValidatedModuleInput,
  error: unknown,
  logger: ModuleLogger,
): AsyncResult<string | undefined> {
  const details = extractErrorDetails(error);
  if (mod.config.isCore) {
    logger.error({ msg: 'Core module setup failed', module: mod.config.name, ...details });
    return Promise.resolve(
      err(
        new AppError(BOT_SERVER_ERRORS.CORE_MODULE_HANDLER_FAILED, {
          module: mod.config.name,
          ...details,
        }),
      ),
    );
  }
  logger.warn({
    msg: 'Non-core module setup failed, skipping',
    module: mod.config.name,
    ...details,
  });
  return Promise.resolve(ok(undefined));
}

function extractErrorDetails(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      code: (error as NodeJS.ErrnoException).code,
      stack: error.stack?.split('\n').slice(0, 3).join(' -> '),
    };
  }
  return { error: String(error) };
}
