export interface GeneratedModuleFile {
  readonly path: string;
  readonly content: string;
}

export interface ModuleCreateInput {
  readonly cwd: string;
  readonly moduleName: string;
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
