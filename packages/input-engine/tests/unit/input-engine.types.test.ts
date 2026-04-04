import { describe, it, expect } from 'vitest';
import type {
  FieldType,
  FieldMetadata,
  ChoiceOption,
  FieldCondition,
  MultiStepLevel,
  FormOptions,
  TimeSlot,
  CountryCode,
  NationalIDResult,
  ContactResult,
  SchedulePickerResult,
  EgyptianMobileResult,
  CurrencyAmountResult,
} from '../../src/input-engine.types.js';
import { DEFAULT_FORM_OPTIONS, FIELD_SKIPPED_SENTINEL } from '../../src/input-engine.types.js';
import { INPUT_ENGINE_ERRORS } from '../../src/input-engine.errors.js';
import type {
  StorageEngineClient,
  AIExtractionClient,
  RegionalClient,
  InputEngineLogger,
  InputEngineEventBus,
} from '../../src/input-engine.contracts.js';

describe('input-engine.types', () => {
  describe('FieldType union', () => {
    it('includes all 39 field types', () => {
      const allTypes: FieldType[] = [
        'ShortText',
        'LongText',
        'Email',
        'Phone',
        'URL',
        'RegexValidated',
        'Integer',
        'Float',
        'Currency',
        'Percentage',
        'CurrencyAmount',
        'SingleChoice',
        'MultipleChoice',
        'BooleanToggle',
        'SearchableList',
        'DatePicker',
        'TimePicker',
        'Location',
        'DateRange',
        'SchedulePicker',
        'Photo',
        'Document',
        'Video',
        'Audio',
        'FileGroup',
        'Contact',
        'ConditionalField',
        'AIExtractorField',
        'GeoSelectField',
        'GeoAddressField',
        'NationalID',
        'PassportNumber',
        'IBAN',
        'EgyptianMobile',
        'StarRating',
        'MultiStepChoice',
        'QRCode',
        'Toggle',
        'Tags',
      ];
      expect(allTypes).toHaveLength(39);
    });
  });

  describe('DEFAULT_FORM_OPTIONS', () => {
    it('has correct defaults', () => {
      expect(DEFAULT_FORM_OPTIONS.partialSave).toBe(false);
      expect(DEFAULT_FORM_OPTIONS.partialSaveTTL).toBe(86_400_000);
      expect(DEFAULT_FORM_OPTIONS.maxMilliseconds).toBe(600_000);
      expect(DEFAULT_FORM_OPTIONS.allowCancel).toBe(true);
      expect(DEFAULT_FORM_OPTIONS.formId).toBe('');
    });

    it('showProgress defaults to true', () => {
      expect(DEFAULT_FORM_OPTIONS.showProgress).toBe(true);
    });

    it('showConfirmation defaults to true', () => {
      expect(DEFAULT_FORM_OPTIONS.showConfirmation).toBe(true);
    });
  });

  describe('FIELD_SKIPPED_SENTINEL', () => {
    it('is a Symbol', () => {
      expect(typeof FIELD_SKIPPED_SENTINEL).toBe('symbol');
    });

    it('uses Symbol.for with deterministic key', () => {
      expect(FIELD_SKIPPED_SENTINEL).toBe(Symbol.for('input-engine.field.skipped'));
    });
  });

  describe('ChoiceOption interface', () => {
    it('accepts required and optional properties', () => {
      const option: ChoiceOption = {
        value: 'opt1',
        label: 'form.option1',
        emoji: '✅',
        disabled: false,
      };
      expect(option.value).toBe('opt1');
    });
  });

  describe('FieldCondition interface', () => {
    it('accepts condition with operator and value', () => {
      const condition: FieldCondition = {
        dependsOn: 'otherField',
        operator: 'equals',
        value: 'yes',
      };
      expect(condition.operator).toBe('equals');
    });
  });

  describe('MultiStepLevel interface', () => {
    it('accepts label and options', () => {
      const level: MultiStepLevel = {
        label: 'form.level1',
        options: [{ value: 'a', label: 'form.a' }],
      };
      expect(level.label).toBe('form.level1');
    });
  });

  describe('FormOptions interface', () => {
    it('accepts all optional properties', () => {
      const opts: FormOptions = {
        partialSave: true,
        partialSaveTTL: 3600_000,
        maxMilliseconds: 300_000,
        allowCancel: false,
        formId: 'test-form',
      };
      expect(opts.formId).toBe('test-form');
    });

    it('accepts showProgress and showConfirmation', () => {
      const opts: FormOptions = {
        showProgress: false,
        showConfirmation: false,
      };
      expect(opts.showProgress).toBe(false);
      expect(opts.showConfirmation).toBe(false);
    });
  });

  describe('TimeSlot interface', () => {
    it('accepts required properties', () => {
      const slot: TimeSlot = {
        startTime: '09:00',
        endTime: '09:30',
        available: true,
      };
      expect(slot.available).toBe(true);
    });
  });

  describe('CountryCode interface', () => {
    it('accepts required properties', () => {
      const cc: CountryCode = {
        code: 'EG',
        dialCode: '+20',
        name: 'countries.egypt',
      };
      expect(cc.code).toBe('EG');
    });
  });

  describe('FieldMetadata interface', () => {
    it('accepts all required and optional properties', () => {
      const meta: FieldMetadata = {
        fieldType: 'ShortText',
        i18nKey: 'form.name',
        optional: false,
        minLength: 2,
        maxLength: 100,
        extractData: true,
      };
      expect(meta.fieldType).toBe('ShortText');
    });
  });

  describe('Result types', () => {
    it('NationalIDResult has expected shape', () => {
      const result: NationalIDResult = {
        id: '12345678901234',
        birthDate: '1990-01-15',
        governorate: 'Cairo',
        gender: 'male',
      };
      expect(result.id).toBe('12345678901234');
    });

    it('ContactResult has expected shape', () => {
      const result: ContactResult = {
        phoneNumber: '+201234567890',
        firstName: 'Test',
      };
      expect(result.phoneNumber).toBe('+201234567890');
    });

    it('SchedulePickerResult has expected shape', () => {
      const result: SchedulePickerResult = {
        date: '2026-04-03',
        time: '14:30',
        slotId: 'slot-1',
      };
      expect(result.date).toBe('2026-04-03');
    });

    it('EgyptianMobileResult has expected shape', () => {
      const result: EgyptianMobileResult = {
        number: '01012345678',
        countryCode: '+20',
        operator: 'Vodafone',
      };
      expect(result.operator).toBe('Vodafone');
    });

    it('CurrencyAmountResult has expected shape', () => {
      const result: CurrencyAmountResult = {
        amount: 100.5,
        currency: 'EGP',
      };
      expect(result.currency).toBe('EGP');
    });
  });
});

describe('input-engine.errors', () => {
  it('exports INPUT_ENGINE_ERRORS with all error codes', () => {
    expect(INPUT_ENGINE_ERRORS.DISABLED).toBe('input-engine.disabled');
    expect(INPUT_ENGINE_ERRORS.SCHEMA_INVALID).toBe('input-engine.schema.invalid');
    expect(INPUT_ENGINE_ERRORS.FORM_CANCELLED).toBe('input-engine.form.cancelled');
    expect(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED).toBe(
      'input-engine.field.validation_failed',
    );
    expect(INPUT_ENGINE_ERRORS.MEDIA_SIZE_EXCEEDED).toBe('input-engine.media.size_exceeded');
    expect(INPUT_ENGINE_ERRORS.IBAN_INVALID_CHECKSUM).toBe('input-engine.iban.invalid_checksum');
    expect(INPUT_ENGINE_ERRORS.QR_DECODE_FAILED).toBe('input-engine.qr.decode_failed');
    expect(INPUT_ENGINE_ERRORS.NATIONAL_ID_CHECKSUM_FAILED).toBe(
      'input-engine.national_id.checksum_failed',
    );
    expect(INPUT_ENGINE_ERRORS.TAGS_DUPLICATE).toBe('input-engine.tags.duplicate');
    expect(INPUT_ENGINE_ERRORS.CONTACT_NOT_SHARED).toBe('input-engine.contact.not_shared');
  });

  it('has hierarchical dot-separated codes', () => {
    const codes = Object.values(INPUT_ENGINE_ERRORS);
    codes.forEach((code) => {
      expect(code).toMatch(/^input-engine\./);
    });
  });
});

describe('input-engine.contracts', () => {
  it('InputEngineLogger accepts compatible objects', () => {
    const logger: InputEngineLogger = {
      info: () => {},
      warn: () => {},
      error: () => {},
      debug: () => {},
    };
    expect(logger.info).toBeDefined();
  });

  it('InputEngineEventBus accepts compatible objects', () => {
    const eventBus: InputEngineEventBus = {
      publish: () => Promise.resolve({ isOk: () => true }) as never,
    };
    expect(eventBus.publish).toBeDefined();
  });

  it('StorageEngineClient accepts compatible objects', () => {
    const storage: StorageEngineClient = {
      upload: () => Promise.resolve({ isOk: () => true }) as never,
      validate: () => Promise.resolve({ isOk: () => true }) as never,
    };
    expect(storage.upload).toBeDefined();
  });

  it('AIExtractionClient accepts compatible objects', () => {
    const ai: AIExtractionClient = {
      extract: () => Promise.resolve({ isOk: () => true }) as never,
      isAvailable: () => true,
    };
    expect(ai.isAvailable()).toBe(true);
  });

  it('RegionalClient accepts compatible objects', () => {
    const regional: RegionalClient = {
      getStates: () => Promise.resolve({ isOk: () => true }) as never,
      getCities: () => Promise.resolve({ isOk: () => true }) as never,
    };
    expect(regional.getStates).toBeDefined();
  });
});
