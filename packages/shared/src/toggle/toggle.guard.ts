import { err } from 'neverthrow';
import type { Result } from '../shared.result.js';
import { AppError } from '../shared.errors.js';

/**
 * Toggle guard for Rule XVI (Pluggable Architecture).
 *
 * Each optional package creates a guard instance that checks
 * `process.env[envVar]`. Packages default to enabled (`true`).
 * Set `TEMPOT_{NAME}=false` to disable a package at runtime.
 *
 * @example
 * ```typescript
 * const guard = createToggleGuard('TEMPOT_AUTH_CORE', 'auth-core');
 * // In every public function:
 * const disabled = guard.check();
 * if (disabled) return disabled;
 * ```
 */
export interface ToggleGuard {
  /**
   * Returns `Result.err` if the package is disabled, `null` if enabled.
   * Call at the top of every public function that returns Result.
   */
  check: () => Result<never, AppError> | null;
  /** Returns `true` if the package is currently enabled. */
  isEnabled: () => boolean;
  /** The environment variable name this guard reads. */
  readonly envVar: string;
  /** The package name for error messages. */
  readonly packageName: string;
}

/**
 * Creates a toggle guard for an optional package.
 *
 * @param envVar - Environment variable name (e.g. `'TEMPOT_AUTH_CORE'`)
 * @param packageName - Package identifier for error codes
 * @returns A `ToggleGuard` instance
 */
export function createToggleGuard(envVar: string, packageName: string): ToggleGuard {
  const errorCode = `${packageName}.disabled`;

  function isEnabled(): boolean {
    return process.env[envVar] !== 'false';
  }

  function check(): Result<never, AppError> | null {
    if (isEnabled()) return null;
    return err(new AppError(errorCode, { envVar }));
  }

  return { check, isEnabled, envVar, packageName };
}
