export interface GeneratedModuleFile {
  readonly path: string;
  readonly content: string;
}

export interface ModuleCreateInput {
  readonly cwd: string;
  readonly moduleName: string;
  readonly moduleType?: string;
  readonly blueprint?: string;
}

export interface ModuleCreateSuccess {
  readonly ok: true;
  readonly moduleName: string;
  readonly createdFiles: readonly string[];
}

export interface ModuleCreateFailure {
  readonly ok: false;
  readonly error: string;
}

export type ModuleCreateResult = ModuleCreateSuccess | ModuleCreateFailure;

export type ModuleNameValidation =
  | { readonly ok: true; readonly moduleName: string }
  | { readonly ok: false; readonly error: string };

export type ModuleOptionsValidation =
  | { readonly ok: true; readonly moduleType: ModuleType; readonly blueprint: ModuleBlueprint }
  | { readonly ok: false; readonly error: string };

export type ModuleType = 'core-platform' | 'operational' | 'product' | 'integration' | 'example';

export type ModuleBlueprint = 'basic';

export interface ModuleTemplateOptions {
  readonly moduleType: ModuleType;
  readonly blueprint: ModuleBlueprint;
}
