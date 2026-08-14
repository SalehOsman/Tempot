import type { InitResult } from './init.types.js';

export function renderInitResult(result: InitResult): string {
  if (!result.ok) {
    return ['Tempot Init', `[fail] ${result.error}`, ''].join('\n');
  }

  const status = result.createdEnvFile
    ? '[pass] Created .env from .env.example'
    : '[pass] Existing .env preserved';

  return [
    'Tempot Init',
    status,
    '',
    'Next steps:',
    '  pnpm install',
    '  pnpm tempot doctor --quick',
    '  Fill required .env values before running pnpm dev',
    '',
  ].join('\n');
}
