import { describe, expect, it } from 'vitest';
import { auditDocumentationClaims } from '../../documentation-claims-audit.js';

const current = {
  rootReadme: 'No package remains deferred.\nTEMPOT_AI_PROVIDER=gemini',
  botServerReadme: 'The application is implemented and production-capable.',
  compose: '# Current: bot-server + PostgreSQL + Redis',
  environmentExample: 'TEMPOT_AI_PROVIDER=gemini',
  roadmap: 'No package remains deferred under Rule XC.',
};

describe('auditDocumentationClaims', () => {
  it('accepts current active documentation claims', () => {
    expect(auditDocumentationClaims(current)).toEqual([]);
  });

  it('reports stale phase, package, and configuration claims', () => {
    const findings = auditDocumentationClaims({
      ...current,
      rootReadme: 'cms-engine and search-engine remain deferred.\nAI_PROVIDER=gemini',
      environmentExample: 'AI_PROVIDER=gemini',
      botServerReadme: 'Minimal mode (Phase 0). Full assembly happens in Phase 5.',
      compose: '# TODO Phase 5: Add bot-server service',
    });

    expect(findings.map((finding) => finding.ruleId)).toEqual([
      'docs.deferred_packages',
      'docs.configuration_name',
      'docs.bot_server_phase',
      'docs.compose_phase',
    ]);
  });
});
