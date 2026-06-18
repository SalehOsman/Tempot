---
'bot-server': patch
---

Upgrade Alpine packages during the production image build and remove build-time
package managers from the runner image so Trivy HIGH/CRITICAL image scans pass
without shipping npm/pnpm runtime CVE surface.
