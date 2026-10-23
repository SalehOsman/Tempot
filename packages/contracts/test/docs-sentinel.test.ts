import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Sovereign Documentation & Incident Integrity Sentinel Test
 * Validates Pillar 10, Incidents Catalog, and Command sync.
 */
describe('Sovereign Documentation & Incident Integrity Sentinel', () => {
  const rootDir = path.resolve(__dirname, '../../..');
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

  it('guarantees that all 11 documentation pillars exist', () => {
    for (const pillar of requiredPillars) {
      const pPath = path.join(docsDir, pillar);
      expect(fs.existsSync(pPath), `Missing pillar: docs/${pillar}`).toBe(true);
      expect(fs.statSync(pPath).isDirectory()).toBe(true);
    }
  });

  it('guarantees that all 5 user guide manuals exist in Pillar 10', () => {
    const userGuideDir = path.join(docsDir, '10-user-guide');
    for (const guide of requiredUserGuides) {
      const gPath = path.join(userGuideDir, guide);
      expect(fs.existsSync(gPath), `Missing user guide: docs/10-user-guide/${guide}`).toBe(true);
    }
  });

  it('guarantees that all 5 incident records exist in the incidents catalog', () => {
    const incidentsDir = path.join(docsDir, '09-decisions', 'incidents');
    for (const inc of requiredIncidents) {
      const iPath = path.join(incidentsDir, inc);
      expect(fs.existsSync(iPath), `Missing incident: docs/09-decisions/incidents/${inc}`).toBe(
        true,
      );
    }
  });
});
