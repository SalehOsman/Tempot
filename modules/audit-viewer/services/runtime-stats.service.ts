type TranslationFn = (key: string, options?: Record<string, unknown>) => string;

const BYTES_PER_MEBIBYTE = 1024 * 1024;

export class RuntimeStatsService {
  render(t: TranslationFn): string {
    const memory = process.memoryUsage();
    return [
      t('audit-viewer.runtime.title'),
      t('audit-viewer.runtime.summary', {
        nodeVersion: escapeHtml(process.version),
        platform: escapeHtml(process.platform),
        pid: process.pid,
        uptimeSeconds: Math.round(process.uptime()),
        rssMb: toMiB(memory.rss),
        heapUsedMb: toMiB(memory.heapUsed),
      }),
    ].join('\n\n');
  }
}

function toMiB(bytes: number): number {
  return Math.round(bytes / BYTES_PER_MEBIBYTE);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
