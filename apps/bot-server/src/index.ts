/**
 * Tempot Bot Server — Production Entry Point
 *
 * Thin shell: builds real deps via deps.factory.ts, then delegates
 * entirely to the startup orchestrator. No business logic here.
 *
 * @see specs/020-bot-server/spec.md
 * @see specs/020-bot-server/plan.md — research.md decision 12
 */

import { startApplication } from './startup/orchestrator.js';
import { buildDeps } from './startup/deps.factory.js';

async function main(): Promise<void> {
  const depsResult = await buildDeps();

  if (depsResult.isErr()) {
    process.stderr.write(
      JSON.stringify({
        level: 'fatal',
        module: 'bot-server',
        msg: 'deps_build_failed',
        error: depsResult.error.code,
      }) + '\n',
    );
    process.exit(1);
  }

  const result = await startApplication(depsResult.value);

  if (result.isErr()) {
    process.stderr.write(
      JSON.stringify({
        level: 'fatal',
        module: 'bot-server',
        msg: 'startup_failed',
        error: result.error.code,
      }) + '\n',
    );
    process.exit(1);
  }
}

void main();
