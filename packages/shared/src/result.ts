import { Result as NTResult } from 'neverthrow';
import { AppError } from './errors';

/**
 * Unified Result type for synchronous operations
 */
export type Result<T, E = AppError> = NTResult<T, E>;

/**
 * Unified Result type for asynchronous operations
 */
export type AsyncResult<T, E = AppError> = Promise<Result<T, E>>;
