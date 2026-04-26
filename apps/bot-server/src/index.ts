/**
 * Tempot Bot Server — Production Entry Point
 *
 * Thin shell: builds real deps via deps.factory.ts, then delegates
 * entirely to the startup orchestrator. No business logic here.
 *
 * @see specs/020-bot-server/spec.md
 * @see specs/020-bot-server/plan.md — research.md decision 12
 */

import { runDockerDiagnostics, startupLogger } from '@tempot/logger';
import { startApplication } from './startup/orchestrator.js';
import { buildDeps } from './startup/deps.factory.js';

// أول شيء يعمل — يطبع تشخيص كامل للبيئة قبل أي خطوة
runDockerDiagnostics();

async function main(): Promise<void> {
  startupLogger.begin('buildDeps', 1);

  const depsResult = await buildDeps();

  if (depsResult.isErr()) {
    startupLogger.fail('buildDeps', depsResult.error, true);
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

  startupLogger.ok('buildDeps');

  startupLogger.begin('startApplication', 2);
  const result = await startApplication(depsResult.value);

  if (result.isErr()) {
    startupLogger.fail('startApplication', result.error, true);
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

  startupLogger.ok('startApplication');
}

void main();
