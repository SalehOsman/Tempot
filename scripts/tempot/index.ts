import { collectQuickDoctorInput, createQuickDoctorReport } from './doctor.checks.js';
import { parseTempotArgs, renderDoctorReport, renderHelp } from './doctor.presenter.js';
import { renderModuleCreateResult } from './module-generator.presenter.js';
import { createModule } from './module-generator.writer.js';

async function run(): Promise<void> {
  const parsed = parseTempotArgs(process.argv.slice(2));

  if (parsed.command === 'doctor') {
    runDoctor();
    return;
  }

  if (parsed.command === 'module-create') {
    await runModuleCreate(parsed.moduleName);
    return;
  }

  process.stderr.write(renderHelp());
  process.exitCode = 1;
}

function runDoctor(): void {
  const report = createQuickDoctorReport(collectQuickDoctorInput());

  process.stdout.write(renderDoctorReport(report));
  process.exitCode = report.hasBlockingFailure ? 1 : 0;
}

async function runModuleCreate(moduleName: string): Promise<void> {
  const result = await createModule({ cwd: process.cwd(), moduleName });
  const output = renderModuleCreateResult(result);

  if (result.ok) {
    process.stdout.write(output);
    return;
  }

  process.stderr.write(output);
  process.exitCode = 1;
}

await run();
