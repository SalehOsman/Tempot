import type { HelpAssistantResult } from '../contracts/assistant.types.js';

const DEFAULT_RESPONSE_TIMEOUT_MS = 60_000;
const RESPONSE_TIMEOUT_KEY = 'TEMPOT_HELP_ASSISTANT_RESPONSE_TIMEOUT_MS';

export async function resolveAssistantResult(
  operation: Promise<HelpAssistantResult>,
  env: NodeJS.ProcessEnv = process.env,
): Promise<HelpAssistantResult> {
  return Promise.race([operation, timeoutResult(resolveTimeoutMs(env))]);
}

function resolveTimeoutMs(env: NodeJS.ProcessEnv): number {
  const configured = Number(env[RESPONSE_TIMEOUT_KEY]);
  return Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_RESPONSE_TIMEOUT_MS;
}

function timeoutResult(timeoutMs: number): Promise<HelpAssistantResult> {
  return new Promise((resolve) => {
    setTimeout(
      () => resolve({ success: false, error: { code: 'ai-core.provider.timeout' } }),
      timeoutMs,
    );
  });
}
