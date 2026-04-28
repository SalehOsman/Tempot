import { collectQuickDoctorInput, createQuickDoctorReport } from './doctor.checks.js';
import { parseTempotArgs, renderDoctorReport, renderHelp } from './doctor.presenter.js';

const parsed = parseTempotArgs(process.argv.slice(2));

if (parsed.command === 'doctor') {
  const report = createQuickDoctorReport(collectQuickDoctorInput());
  process.stdout.write(renderDoctorReport(report));
  process.exitCode = report.hasBlockingFailure ? 1 : 0;
} else {
  process.stderr.write(renderHelp());
  process.exitCode = 1;
}
