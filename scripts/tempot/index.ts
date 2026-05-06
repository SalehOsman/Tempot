import { collectQuickDoctorInput, createQuickDoctorReport } from './doctor.checks.js';
import { parseTempotArgs, renderDoctorReport, renderHelp } from './doctor.presenter.js';
import { renderInitResult } from './init.presenter.js';
import { initializeTempotProject } from './init.writer.js';
import { createModuleDoctorReport } from './module-doctor.checks.js';
import { renderModuleDoctorReport } from './module-doctor.presenter.js';
import { renderModuleCreateResult } from './module-generator.presenter.js';
import { createModule } from './module-generator.writer.js';

async function run(): Promise<void> {
  const parsed = parseTempotArgs(process.argv.slice(2));

  if (parsed.command === 'doctor') {
    runDoctor();
    return;
  }

  if (parsed.command === 'init') {
    await runInit();
    return;
  }

  if (parsed.command === 'module-create') {
    await runModuleCreate(parsed.moduleName, parsed.moduleType, parsed.blueprint);
    return;
  }

  if (parsed.command === 'module-doctor') {
    await runModuleDoctor(parsed.moduleName);
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

async function runInit(): Promise<void> {
  const result = await initializeTempotProject({ cwd: process.cwd() });
  const output = renderInitResult(result);

  if (result.ok) {
    process.stdout.write(output);
    return;
  }

  process.stderr.write(output);
  process.exitCode = 1;
}

async function runModuleCreate(
  moduleName: string,
  moduleType: string,
  blueprint: string,
): Promise<void> {
  const result = await createModule({ cwd: process.cwd(), moduleName, moduleType, blueprint });
  const output = renderModuleCreateResult(result);

  if (result.ok) {
    process.stdout.write(output);
    return;
  }

  process.stderr.write(output);
  process.exitCode = 1;
}

async function runModuleDoctor(moduleName: string): Promise<void> {
  const report = await createModuleDoctorReport({ cwd: process.cwd(), moduleName });
  const output = renderModuleDoctorReport(report);

  if (report.hasBlockingFailure) {
    process.stderr.write(output);
    process.exitCode = 1;
    return;
  }

  process.stdout.write(output);
}

await run();
