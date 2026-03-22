export type ShutdownHook = () => Promise<void>;

export class ShutdownManager {
  private static hooks: ShutdownHook[] = [];

  /**
   * Register a new shutdown hook.
   * Hooks are executed sequentially in the order they were registered.
   */
  static register(hook: ShutdownHook): void {
    this.hooks.push(hook);
  }

  /**
   * Execute all registered shutdown hooks.
   * Includes a 30s timeout safeguard that calls process.exit(1) if hooks hang.
   */
  static async execute(): Promise<void> {
    const timeout = setTimeout(() => {
      console.error('FATAL: Shutdown exceeded 30s timeout.');
      process.exit(1);
    }, 30000);

    for (const hook of this.hooks) {
      try {
        await hook();
      } catch (err) {
        console.error('Error during shutdown hook', err);
      }
    }

    clearTimeout(timeout);
  }
}
