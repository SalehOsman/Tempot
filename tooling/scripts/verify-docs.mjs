import fs from 'node:fs';
import path from 'node:path';

/**
 * Sovereign Documentation & Completeness Sentinel Gate
 * Authority: Quality Gate, Pillar 10, Delivery Protocol
 */

const rootDir = process.cwd();
const docsDir = path.join(rootDir, 'docs');

const requiredPillars = [
  '00-overview',
  '01-architecture',
  '02-surfaces',
  '03-kernel-modules',
  '04-domain-extension',
  '05-executable-contracts',
  '06-security-and-compliance',
  '07-operations-and-deployment',
  '08-developer-playbooks',
  '09-decisions',
  '10-user-guide',
];

const requiredUserGuides = [
  'README.md',
  '01-platform-tour.md',
  '02-telegram-bot-manual.md',
  '03-telegram-mini-app-manual.md',
  '04-tunneling-and-ngrok-manual.md',
  '05-admin-operations-manual.md',
];

const requiredIncidents = [
  'README.md',
  'INC-20261023-01-DATABASE-MIGRATION-DRIFT.md',
  'INC-20261023-02-PER-USER-LOCALE-ISOLATION.md',
  'INC-20261023-03-TMA-SERVER-AUTH-BRIDGE.md',
  'INC-20261023-04-DASHBOARD-OPERATOR-AUTH.md',
  'INC-20261023-05-PRODUCTION-DOCKER-TOPOLOGY.md',
];

const violations = [];

// 1. Check Pillars
for (const pillar of requiredPillars) {
  const pPath = path.join(docsDir, pillar);
  if (!fs.existsSync(pPath) || !fs.statSync(pPath).isDirectory()) {
    violations.push(`Missing documentation pillar directory: docs/${pillar}`);
  }
}

// 2. Check User Guides
const userGuideDir = path.join(docsDir, '10-user-guide');
for (const guide of requiredUserGuides) {
  const gPath = path.join(userGuideDir, guide);
  if (!fs.existsSync(gPath)) {
    violations.push(`Missing user guide manual: docs/10-user-guide/${guide}`);
  }
}

// 3. Check Incidents
const incidentsDir = path.join(docsDir, '09-decisions', 'incidents');
for (const inc of requiredIncidents) {
  const iPath = path.join(incidentsDir, inc);
  if (!fs.existsSync(iPath)) {
    violations.push(`Missing incident record: docs/09-decisions/incidents/${inc}`);
  }
}

// 4. Verify package.json script references in docs
const pkgJsonPath = path.join(rootDir, 'package.json');
if (fs.existsSync(pkgJsonPath)) {
  const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
  const scripts = Object.keys(pkg.scripts || {});

  // Aggregate docs text
  function collectDocsText(dir) {
    let text = '';
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        text += collectDocsText(full);
      } else if (entry.name.endsWith('.md')) {
        text += `\n${fs.readFileSync(full, 'utf8')}`;
      }
    }
    return text;
  }

  const allDocsText = collectDocsText(docsDir);

  const criticalScripts = [
    'dev',
    'bot:dev',
    'tma:dev',
    'tunnel',
    'check:biome',
    'check:i18n',
    'test',
    'typecheck',
  ];
  for (const script of criticalScripts) {
    if (scripts.includes(script)) {
      if (!allDocsText.includes(script)) {
        violations.push(`Critical package script "${script}" is not documented in any docs file`);
      }
    }
  }
}

if (violations.length > 0) {
  console.error('\n❌ SOVEREIGN DOCUMENTATION SENTINEL FAILED:');
  console.error(`Found ${violations.length} documentation integrity violations:\n`);
  for (const v of violations) {
    console.error(`  - ${v}`);
  }
  process.exit(1);
}

console.log(
  '✅ SOVEREIGN DOCUMENTATION PASS: All 11 pillars, user guides, incidents, and scripts are fully synchronized.',
);
process.exit(0);
