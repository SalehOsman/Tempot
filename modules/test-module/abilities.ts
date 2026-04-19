/**
 * Test Module — abilities.ts
 *
 * CASL ability definitions for the test-module (Constitution Rule XXVI).
 * Defines what each role is permitted to do within this module.
 *
 * Remove when the module is removed.
 */
import type { UserRole } from '@tempot/module-registry';

export type TestModuleAction = 'view-status' | 'run-diagnostics';
export type TestModuleSubject = 'TestModule';

export interface TestModuleAbilityRule {
  action: TestModuleAction;
  subject: TestModuleSubject;
  allowedRoles: UserRole[];
}

/**
 * All users may view status. Only admins may run extended diagnostics.
 */
export const TEST_MODULE_ABILITIES: TestModuleAbilityRule[] = [
  {
    action: 'view-status',
    subject: 'TestModule',
    allowedRoles: ['GUEST', 'USER', 'ADMIN', 'SUPER_ADMIN'],
  },
  {
    action: 'run-diagnostics',
    subject: 'TestModule',
    allowedRoles: ['ADMIN', 'SUPER_ADMIN'],
  },
];
