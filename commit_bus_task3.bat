@echo off
git add packages/event-bus/src/distributed/redis.bus.ts packages/event-bus/tests/integration/redis-bus.test.ts
git commit -m "feat(event-bus): implement Redis distributed messaging"
