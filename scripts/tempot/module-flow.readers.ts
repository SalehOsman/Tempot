import { join } from 'node:path';
import type { ModuleDoctorFileContext } from './module-doctor.types.js';
import type { ModuleFlowCallback, ModuleFlowMap, ModuleFlowSurface } from './module-flow.types.js';
import { isRecord, readJsonObject } from './module-doctor.readers.js';

export async function readModuleFlowMap(
  context: ModuleDoctorFileContext,
): Promise<ModuleFlowMap | undefined> {
  const value = await readJsonObject(join(context.modulePath, 'module.flow.json'));

  if (value === undefined) {
    return undefined;
  }

  const entryPoints = readStringArray(value['entryPoints']);
  const surfaces = readSurfaces(value['surfaces']);
  const callbacks = readCallbacks(value['callbackActions']);
  const exitPaths = readStringArray(value['exitPaths']);

  if (
    typeof value['moduleName'] !== 'string' ||
    entryPoints === undefined ||
    surfaces === undefined ||
    callbacks === undefined ||
    exitPaths === undefined
  ) {
    return undefined;
  }

  return {
    moduleName: value['moduleName'],
    entryPoints,
    surfaces,
    callbackActions: callbacks,
    exitPaths,
  };
}

function readStringArray(value: unknown): readonly string[] | undefined {
  if (!Array.isArray(value) || !value.every((item) => typeof item === 'string')) {
    return undefined;
  }

  return value;
}

function readSurfaces(value: unknown): readonly ModuleFlowSurface[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const surfaces = value.map(readSurface);
  if (surfaces.some((surface) => surface === undefined)) {
    return undefined;
  }

  return surfaces.filter((surface): surface is ModuleFlowSurface => surface !== undefined);
}

function readSurface(value: unknown): ModuleFlowSurface | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const visibleActions = readStringArray(value['visibleActions']);
  if (
    typeof value['surfaceId'] !== 'string' ||
    typeof value['surfaceType'] !== 'string' ||
    visibleActions === undefined
  ) {
    return undefined;
  }

  return {
    surfaceId: value['surfaceId'],
    surfaceType: value['surfaceType'],
    openedBy: typeof value['openedBy'] === 'string' ? value['openedBy'] : undefined,
    visibleActions,
  };
}

function readCallbacks(value: unknown): readonly ModuleFlowCallback[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const callbacks = value.map(readCallback);
  if (callbacks.some((callback) => callback === undefined)) {
    return undefined;
  }

  return callbacks.filter((callback): callback is ModuleFlowCallback => callback !== undefined);
}

function readCallback(value: unknown): ModuleFlowCallback | undefined {
  if (
    !isRecord(value) ||
    typeof value['callbackData'] !== 'string' ||
    typeof value['actionKind'] !== 'string' ||
    typeof value['handlerStatus'] !== 'string'
  ) {
    return undefined;
  }

  return {
    callbackData: value['callbackData'],
    actionKind: value['actionKind'],
    handlerStatus: value['handlerStatus'],
    labelKey: typeof value['labelKey'] === 'string' ? value['labelKey'] : undefined,
  };
}
