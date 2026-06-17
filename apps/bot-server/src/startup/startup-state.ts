export const DEFAULT_STARTUP_STAGES = [
  'config',
  'database',
  'superAdmins',
  'cache',
  'moduleDiscovery',
  'moduleValidation',
  'moduleHandlers',
  'commandRegistration',
  'shutdownHooks',
  'signalHandlers',
  'httpServer',
  'botPolling',
] as const;

export type StartupStageName = (typeof DEFAULT_STARTUP_STAGES)[number];
export type StartupStageStatus = 'pending' | 'started' | 'ready' | 'degraded' | 'failed';

export interface StartupStageSnapshot {
  name: StartupStageName;
  status: StartupStageStatus;
  updatedAt: string;
  errorCode: string | undefined;
}

export interface StartupStateSnapshot {
  ready: boolean;
  stages: StartupStageSnapshot[];
}

export interface StartupStateStore {
  markStarted: (stage: StartupStageName) => void;
  markReady: (stage: StartupStageName) => void;
  markDegraded: (stage: StartupStageName, errorCode?: string) => void;
  markFailed: (stage: StartupStageName, errorCode?: string) => void;
  activateReadiness: () => void;
  deactivateReadiness: () => void;
  snapshot: () => StartupStateSnapshot;
}

export function createStartupStateStore(
  stageNames: readonly StartupStageName[] = DEFAULT_STARTUP_STAGES,
): StartupStateStore {
  let ready = false;
  const stages = new Map<StartupStageName, StartupStageSnapshot>();

  for (const name of stageNames) {
    stages.set(name, createStageSnapshot(name, 'pending'));
  }

  const updateStage = (
    stage: StartupStageName,
    status: StartupStageStatus,
    errorCode?: string,
  ): void => {
    stages.set(stage, createStageSnapshot(stage, status, errorCode));
    if (status === 'failed') {
      ready = false;
    }
  };

  return {
    markStarted: (stage) => updateStage(stage, 'started'),
    markReady: (stage) => updateStage(stage, 'ready'),
    markDegraded: (stage, errorCode) => updateStage(stage, 'degraded', errorCode),
    markFailed: (stage, errorCode) => updateStage(stage, 'failed', errorCode),
    activateReadiness: () => {
      ready = true;
    },
    deactivateReadiness: () => {
      ready = false;
    },
    snapshot: () => ({
      ready,
      stages: Array.from(stages.values()),
    }),
  };
}

function createStageSnapshot(
  name: StartupStageName,
  status: StartupStageStatus,
  errorCode?: string,
): StartupStageSnapshot {
  return {
    name,
    status,
    updatedAt: new Date().toISOString(),
    errorCode,
  };
}
