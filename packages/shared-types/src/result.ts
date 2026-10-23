import { Result, ResultAsync, err, ok } from 'neverthrow';

export { Result, ResultAsync, ok, err };

export type AsyncResult<T, E> = ResultAsync<T, E>;

export function isSuccess<T, E>(result: Result<T, E>): result is Result<T, never> {
  return result.isOk();
}

export function isFailure<T, E>(result: Result<T, E>): result is Result<never, E> {
  return result.isErr();
}
