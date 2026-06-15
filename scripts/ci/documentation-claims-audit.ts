import { readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export interface DocumentationClaimsInput {
  rootReadme: string;
  botServerReadme: string;
  compose: string;
  environmentExample: string;
  roadmap: string;
}

export interface DocumentationClaimFinding {
  ruleId:
    | 'docs.deferred_packages'
    | 'docs.configuration_name'
    | 'docs.bot_server_phase'
    | 'docs.compose_phase'
    | 'docs.roadmap_status';
  file: string;
  message: string;
}

export function auditDocumentationClaims(
  input: DocumentationClaimsInput,
): DocumentationClaimFinding[] {
  const findings: DocumentationClaimFinding[] = [];
  const declaresNoDeferredPackages = input.rootReadme
    .toLowerCase()
    .includes('no package remains deferred');

  if (
    !declaresNoDeferredPackages &&
    /remain(?:s)? deferred|currently activated deferred package/i.test(input.rootReadme)
  ) {
    findings.push({
      ruleId: 'docs.deferred_packages',
      file: 'README.md',
      message: 'Root README still describes active packages as deferred',
    });
  }

  if (
    input.rootReadme.includes('TEMPOT_AI_PROVIDER') ||
    !input.environmentExample.includes('AI_PROVIDER=')
  ) {
    findings.push({
      ruleId: 'docs.configuration_name',
      file: 'README.md',
      message: 'AI provider documentation must use AI_PROVIDER from .env.example',
    });
  }

  if (/Minimal mode|happens in Phase 5|Phase 0/i.test(input.botServerReadme)) {
    findings.push({
      ruleId: 'docs.bot_server_phase',
      file: 'apps/bot-server/README.md',
      message: 'bot-server README describes a completed implementation as future work',
    });
  }

  if (/TODO.*Phase 5.*bot-server/i.test(input.compose)) {
    findings.push({
      ruleId: 'docs.compose_phase',
      file: 'docker-compose.yml',
      message: 'Compose comments describe the existing bot-server service as future work',
    });
  }

  if (!input.roadmap.includes('No package remains deferred under Rule XC')) {
    findings.push({
      ruleId: 'docs.roadmap_status',
      file: 'docs/ROADMAP.md',
      message: 'Roadmap must explicitly state the current Rule XC package status',
    });
  }

  return findings;
}

function main(): void {
  const repositoryRoot = path.resolve(process.cwd());
  const findings = auditDocumentationClaims({
    rootReadme: readFileSync(path.join(repositoryRoot, 'README.md'), 'utf8'),
    botServerReadme: readFileSync(
      path.join(repositoryRoot, 'apps', 'bot-server', 'README.md'),
      'utf8',
    ),
    compose: readFileSync(path.join(repositoryRoot, 'docker-compose.yml'), 'utf8'),
    environmentExample: readFileSync(path.join(repositoryRoot, '.env.example'), 'utf8'),
    roadmap: readFileSync(path.join(repositoryRoot, 'docs', 'ROADMAP.md'), 'utf8'),
  });

  for (const finding of findings) {
    process.stderr.write(`${finding.file}: ${finding.ruleId} ${finding.message}\n`);
  }
  process.stdout.write(`Documentation claims: findings=${findings.length}\n`);
  if (findings.length > 0) process.exitCode = 1;
}

const entryPoint = process.argv[1];
if (entryPoint && import.meta.url === pathToFileURL(entryPoint).href) {
  main();
}
