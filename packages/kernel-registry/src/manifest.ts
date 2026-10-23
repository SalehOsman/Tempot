export type SliceKind = 'interactive' | 'headless';

export type SliceEntrypoint =
  | 'bot'
  | 'dashboard'
  | 'tma'
  | 'http'
  | 'event'
  | 'job'
  | 'cron'
  | 'internal';

export interface SliceDescriptor {
  readonly sliceId: string;
  readonly kind: SliceKind;
  readonly entrypoints: readonly SliceEntrypoint[];
}

export interface ModuleManifest {
  readonly id: string;
  readonly version: string;
  readonly category: 'kernel' | 'domain';
  readonly context?: string;
  readonly requires: readonly string[];
  readonly optional?: readonly string[];
  readonly capabilities: readonly string[];
  readonly slices: readonly SliceDescriptor[];
}

export interface TembotModule {
  readonly manifest: ModuleManifest;
  register?(): Promise<void> | void;
  boot?(): Promise<void> | void;
}
