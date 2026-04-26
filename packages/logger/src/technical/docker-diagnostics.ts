/**
 * Docker Diagnostics — طباعة تشخيصية عند بدء التشغيل في بيئة Docker
 *
 * يحل مشكلة: "لماذا فشل الـ container؟" — يطبع كل المعلومات المهمة
 * قبل أن يبدأ أي كود آخر، حتى لو فشل الـ startup لاحقاً تعرف السبب.
 *
 * يُطبع عند NODE_ENV=production فقط (أو عند TEMPOT_DIAGNOSTICS=true).
 *
 * المعلومات المطبوعة:
 *  - Node.js version
 *  - وجود متغيرات البيئة الحرجة (بدون قيمها)
 *  - مسار dist/index.js (هل يوجد فعلاً)
 *  - معلومات الذاكرة والنظام
 */

import { logger } from './pino.logger.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

interface EnvCheckResult {
  key: string;
  present: boolean;
  /** true = التطبيق لن يعمل بدونه */
  required: boolean;
}

const REQUIRED_ENV_KEYS = ['BOT_TOKEN', 'DATABASE_URL', 'REDIS_URL', 'BOT_MODE'] as const;
const OPTIONAL_ENV_KEYS = ['SUPER_ADMIN_IDS', 'PORT', 'LOG_LEVEL', 'NODE_ENV'] as const;

function checkEnvVars(): EnvCheckResult[] {
  const results: EnvCheckResult[] = [];

  for (const key of REQUIRED_ENV_KEYS) {
    results.push({ key, present: Boolean(process.env[key]), required: true });
  }
  for (const key of OPTIONAL_ENV_KEYS) {
    results.push({ key, present: Boolean(process.env[key]), required: false });
  }

  return results;
}

function checkEntryPoint(): { path: string; exists: boolean } {
  const thisFile = fileURLToPath(import.meta.url);
  // dist/index.js هو نفس المجلد الذي يحتوي على هذا الملف المجمّع في الإنتاج
  // نصعد من dist/technical/ → dist/ → ابحث عن index.js
  const distDir = path.resolve(path.dirname(thisFile), '..', '..');
  const entryPoint = path.join(distDir, 'index.js');
  return { path: entryPoint, exists: fs.existsSync(entryPoint) };
}

function memoryMB(): { rss: number; heapUsed: number; heapTotal: number } {
  const m = process.memoryUsage();
  return {
    rss: Math.round(m.rss / 1024 / 1024),
    heapUsed: Math.round(m.heapUsed / 1024 / 1024),
    heapTotal: Math.round(m.heapTotal / 1024 / 1024),
  };
}

/**
 * يجب استدعاؤه في أول سطر من index.ts قبل أي import آخر غير مباشر
 */
export function runDockerDiagnostics(): void {
  const shouldRun =
    process.env['NODE_ENV'] === 'production' || process.env['TEMPOT_DIAGNOSTICS'] === 'true';

  if (!shouldRun) return;

  const envChecks = checkEnvVars();
  const missingRequired = envChecks.filter((c) => c.required && !c.present).map((c) => c.key);
  const entryPoint = checkEntryPoint();

  logger.info({
    msg: 'docker_diagnostics',
    phase: 'pre_startup',
    node_version: process.version,
    platform: process.platform,
    arch: process.arch,
    pid: process.pid,
    cwd: process.cwd(),
    entry_point: entryPoint,
    env: {
      NODE_ENV: process.env['NODE_ENV'],
      BOT_MODE: process.env['BOT_MODE'],
      PORT: process.env['PORT'] ?? '3000 (default)',
      LOG_LEVEL: process.env['LOG_LEVEL'] ?? 'info (default)',
      // القيم الحساسة: نُظهر فقط هل هي موجودة أم لا
      BOT_TOKEN: process.env['BOT_TOKEN'] ? '[PRESENT]' : '[MISSING]',
      DATABASE_URL: process.env['DATABASE_URL'] ? '[PRESENT]' : '[MISSING]',
      REDIS_URL: process.env['REDIS_URL'] ? '[PRESENT]' : '[MISSING]',
      SUPER_ADMIN_IDS: process.env['SUPER_ADMIN_IDS'] ? '[PRESENT]' : '[MISSING]',
    },
    memory_mb: memoryMB(),
    missing_required_env: missingRequired,
    status: missingRequired.length === 0 ? 'env_ok' : 'env_incomplete',
  });

  // طباعة تحذير فوري إذا كانت متغيرات بيئة حرجة مفقودة
  if (missingRequired.length > 0) {
    logger.error({
      msg: 'docker_diagnostics_env_error',
      phase: 'pre_startup',
      missing: missingRequired,
      hint: 'Check your docker-compose.yml env_file or environment section',
    });
  }
}
