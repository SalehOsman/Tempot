import { ok, err } from 'neverthrow';
import type { Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import type { AsyncResult } from '@tempot/shared';
import type { FieldHandler, RenderContext } from '../field.handler.js';
import type { FieldMetadata } from '../../input-engine.types.js';
import { INPUT_ENGINE_ERRORS } from '../../input-engine.errors.js';

/** Parsed location value */
interface LocationValue {
  latitude: number;
  longitude: number;
}

/** Validate latitude is within [-90, 90] */
function isValidLatitude(lat: number): boolean {
  return lat >= -90 && lat <= 90;
}

/** Validate longitude is within [-180, 180] */
function isValidLongitude(lng: number): boolean {
  return lng >= -180 && lng <= 180;
}

export class LocationFieldHandler implements FieldHandler {
  readonly fieldType = 'Location' as const;

  async render(_renderCtx: RenderContext, _metadata: FieldMetadata): AsyncResult<void, AppError> {
    return ok(undefined);
  }

  parseResponse(message: unknown, _metadata: FieldMetadata): Result<unknown, AppError> {
    const msg = message as { location?: { latitude: number; longitude: number } };

    if (!msg.location) {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED, {
          fieldType: this.fieldType,
          reason: 'No location in message',
        }),
      );
    }

    const result: LocationValue = {
      latitude: msg.location.latitude,
      longitude: msg.location.longitude,
    };
    return ok(result);
  }

  validate(value: unknown, _schema: unknown, _metadata: FieldMetadata): Result<unknown, AppError> {
    const location = value as LocationValue;

    if (!isValidLatitude(location.latitude)) {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED, {
          fieldType: this.fieldType,
          reason: 'Latitude out of range (-90 to 90)',
          actual: location.latitude,
        }),
      );
    }

    if (!isValidLongitude(location.longitude)) {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED, {
          fieldType: this.fieldType,
          reason: 'Longitude out of range (-180 to 180)',
          actual: location.longitude,
        }),
      );
    }

    return ok(location);
  }
}
