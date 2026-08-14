/**
 * Re-export sessionContext from @tempot/shared for backward compatibility.
 * The canonical location is now @tempot/shared/context.
 * This breaks the circular dependency: database <-> session-manager.
 */
export { sessionContext, type ContextSession } from '@tempot/shared';
