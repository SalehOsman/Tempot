import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ModuleDoctorCheck, ModuleDoctorFileContext } from './module-doctor.types.js';
import type { ModuleFlowCallback, ModuleFlowMap } from './module-flow.types.js';
import {
  collectJsonKeys,
  collectTypeScriptFiles,
  readJsonObject,
} from './module-doctor.readers.js';
import { readModuleFlowMap } from './module-flow.readers.js';

export async function checkModuleFlowMap(
  context: ModuleDoctorFileContext,
): Promise<ModuleDoctorCheck> {
  const flow = await readModuleFlowMap(context);

  if (flow === undefined) {
    return {
      name: 'Module flow map',
      status: 'warn',
      summary: 'module.flow.json is missing or invalid.',
      suggestion: 'Add a governed module.flow.json before production flow changes.',
      blocking: false,
    };
  }

  const findings = [
    ...findUnmappedVisibleActions(flow),
    ...findRepeatedLeafActions(flow),
    ...(await findMissingHandlerNamespaces(context, flow)),
    ...(await findMissingLocaleKeys(context, flow)),
  ];

  return {
    name: 'Module flow map',
    status: findings.length === 0 ? 'pass' : 'fail',
    summary:
      findings.length === 0
        ? 'Module flow map callbacks, leaf surfaces, handlers, and labels are aligned.'
        : findings.join('; '),
    suggestion:
      findings.length === 0
        ? 'No action needed.'
        : 'Align module.flow.json, handlers, menus, and locale keys.',
    blocking: findings.length > 0,
  };
}

function findUnmappedVisibleActions(flow: ModuleFlowMap): readonly string[] {
  const callbacks = new Set(flow.callbackActions.map((callback) => callback.callbackData));
  const exits = new Set(flow.exitPaths);
  return flow.surfaces.flatMap((surface) =>
    surface.visibleActions
      .filter((action) => !callbacks.has(action) && !exits.has(action))
      .map((action) => `Surface ${surface.surfaceId} exposes unmapped callback ${action}`),
  );
}

function findRepeatedLeafActions(flow: ModuleFlowMap): readonly string[] {
  const callbackKinds = new Map(
    flow.callbackActions.map((callback) => [callback.callbackData, callback.actionKind]),
  );

  return flow.surfaces.flatMap((surface) => {
    if (surface.surfaceType !== 'leaf' || surface.openedBy === undefined) {
      return [];
    }

    if (
      surface.visibleActions.includes(surface.openedBy) &&
      callbackKinds.get(surface.openedBy) !== 'state-change'
    ) {
      return [`Leaf surface ${surface.surfaceId} repeats ${surface.openedBy}`];
    }

    return [];
  });
}

async function findMissingHandlerNamespaces(
  context: ModuleDoctorFileContext,
  flow: ModuleFlowMap,
): Promise<readonly string[]> {
  const files = await collectTypeScriptFiles(context.modulePath);
  const source = (await Promise.all(files.map((file) => readFile(file, 'utf8')))).join('\n');
  return flow.callbackActions
    .filter((callback) => callback.handlerStatus === 'handled')
    .filter((callback) => !source.includes(callbackNamespace(callback.callbackData)))
    .map(
      (callback) =>
        `Callback ${callback.callbackData} has no matching handler namespace ${callbackNamespace(
          callback.callbackData,
        )}`,
    );
}

async function findMissingLocaleKeys(
  context: ModuleDoctorFileContext,
  flow: ModuleFlowMap,
): Promise<readonly string[]> {
  const ar = await readJsonObject(join(context.modulePath, 'locales', 'ar.json'));
  const en = await readJsonObject(join(context.modulePath, 'locales', 'en.json'));
  const localeKeys = new Set([...collectJsonKeys(ar ?? {}), ...collectJsonKeys(en ?? {})]);

  return flow.callbackActions
    .filter(hasLabelKey)
    .filter((callback) => !localeKeys.has(callback.labelKey))
    .map((callback) => `Callback ${callback.callbackData} label key ${callback.labelKey} missing`);
}

function hasLabelKey(callback: ModuleFlowCallback): callback is ModuleFlowCallback & {
  readonly labelKey: string;
} {
  return callback.labelKey !== undefined;
}

function callbackNamespace(callbackData: string): string {
  const separator = callbackData.indexOf(':');
  return separator === -1 ? callbackData : callbackData.slice(0, separator + 1);
}
