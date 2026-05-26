export interface ModuleFlowMap {
  readonly moduleName: string;
  readonly entryPoints: readonly string[];
  readonly surfaces: readonly ModuleFlowSurface[];
  readonly callbackActions: readonly ModuleFlowCallback[];
  readonly exitPaths: readonly string[];
}

export interface ModuleFlowSurface {
  readonly surfaceId: string;
  readonly surfaceType: string;
  readonly openedBy?: string;
  readonly visibleActions: readonly string[];
}

export interface ModuleFlowCallback {
  readonly callbackData: string;
  readonly actionKind: string;
  readonly handlerStatus: string;
  readonly labelKey?: string;
}
