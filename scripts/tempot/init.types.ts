export type InitOptions = {
  readonly cwd: string;
};

export type InitResult =
  | {
      readonly ok: true;
      readonly createdEnvFile: boolean;
      readonly skippedExistingEnvFile: boolean;
    }
  | {
      readonly ok: false;
      readonly error: string;
    };
