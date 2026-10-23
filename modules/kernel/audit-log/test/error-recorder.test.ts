import { describe, it, expect, vi } from 'vitest';
import { ok, ValidationError, InternalServerError } from '@tembot/shared-types';
import { ErrorRecorder } from '../src/application/error-recorder.js';
import type { AuditService } from '../src/application/audit-service.js';

describe('ErrorRecorder Specification', () => {
  it('serializes DomainError with status code, error code, and details', async () => {
    const recordMock = vi.fn().mockResolvedValue(
      ok({
        id: 'log-1',
        status: 'FAILURE',
      })
    );

    const mockAuditService = {
      record: recordMock,
    } as unknown as AuditService;

    const recorder = new ErrorRecorder(mockAuditService);

    const domainErr = new ValidationError('Invalid input payload', [
      { name: 'amount', reason: 'Must be positive' },
    ]);

    const result = await recorder.captureError({
      tenantId: '00000000-0000-0000-0000-000000000000',
      action: 'order.checkout',
      error: domainErr,
    });

    expect(result.isOk()).toBe(true);
    expect(recordMock).toHaveBeenCalledTimes(1);

    const passedInput = recordMock.mock.calls[0][0];
    expect(passedInput.status).toBe('FAILURE');
    expect(passedInput.action).toBe('error:order.checkout');
    expect(passedInput.errorDetails.code).toBe('VALIDATION_ERROR');
    expect(passedInput.errorDetails.httpStatus).toBe(400);
  });

  it('serializes native Javascript Error instances', async () => {
    const recordMock = vi.fn().mockResolvedValue(ok({ id: 'log-2' }));
    const mockAuditService = { record: recordMock } as unknown as AuditService;
    const recorder = new ErrorRecorder(mockAuditService);

    const nativeError = new TypeError('Cannot read properties of undefined');

    await recorder.captureError({
      tenantId: '00000000-0000-0000-0000-000000000000',
      action: 'worker.process',
      error: nativeError,
    });

    const passedInput = recordMock.mock.calls[0][0];
    expect(passedInput.errorDetails.name).toBe('TypeError');
    expect(passedInput.errorDetails.message).toBe('Cannot read properties of undefined');
  });
});
