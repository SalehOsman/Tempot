---
'@tempot/shared': patch
---

Handle publish() Result in cache fallback (Rule X - no silent failures)

Changed `fallbackToMemory` to inspect the `AsyncResult` returned by
`eventBus.publish()` and log a warning when it fails, instead of
silently discarding the Result. Changed visibility from private to
protected to enable direct unit testing.
