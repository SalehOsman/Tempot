/**
 * Centralized Shutdown Manager for Tempot
 * Rule: XVII (Graceful Shutdown)
 */
export class ShutdownManager {
  private static hooks: Array<() => Promise<void>> = [];

  /**
   * Register a new shutdown hook
   */
  static register(hook: () => Promise<void>): void {
    this.hooks.push(hook);
  }

  /**
   * Execute all registered hooks with a 30s timeout safety
   */
  static async execute(): Promise<void> {
    console.log(`🛑 Shutdown initiated. Executing ${this.hooks.length} hooks...`);

    const timeout = setTimeout(() => {
      console.error('FATAL: Shutdown exceeded 30s timeout. Forcing exit.');
      process.exit(1);
    }, 30000);

    // Execute hooks in FIFO order
    for (const hook of this.hooks) {
      try {
        await hook();
      } catch (e) {
        console.error('Error during shutdown hook:', e);
      }
    }

    clearTimeout(timeout);
    console.log('✅ All shutdown hooks completed.');
  }

  /**
   * Clear all hooks (primarily for testing)
   */
  static clearHooks(): void {
    this.hooks = [];
  }
}
