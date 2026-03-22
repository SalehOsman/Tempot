@echo off
git add packages/event-bus/src/distributed/connection.watcher.ts packages/event-bus/tests/unit/watcher.test.ts
git commit -m "feat(event-bus): implement auto-recovery with stabilization threshold"
