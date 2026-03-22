@echo off
git add packages/event-bus/src/local/local.bus.ts packages/event-bus/tests/unit/local-bus.test.ts
git commit -m "feat(event-bus): implement Local EventEmitter fallback"
