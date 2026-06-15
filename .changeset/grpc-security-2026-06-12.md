---
"bot-server": patch
---

Security: pin transitive `@grpc/grpc-js` to patched `>=1.14.4` to resolve
GHSA-99f4-grh7-6pcq and GHSA-5375-pq7m-f5r2 (HIGH severity, server/client
crash via malformed message). Affects dev-only path
`testcontainers > dockerode > @grpc/grpc-js`; no production runtime impact.
Added to `pnpm-workspace.yaml` overrides alongside patched `protobufjs` and
`vite` pins for the remaining high-severity dev/test advisories.
