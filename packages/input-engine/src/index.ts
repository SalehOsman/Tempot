// @tempot/input-engine barrel exports

// Types
export type {
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
} from './input-engine.types.js';
export { DEFAULT_FORM_OPTIONS } from './input-engine.types.js';

// Contracts
export type {
  StorageEngineClient,
  AIExtractionClient,
  RegionalClient,
  InputEngineLogger,
  InputEngineEventBus,
} from './input-engine.contracts.js';

// Errors
export { INPUT_ENGINE_ERRORS } from './input-engine.errors.js';

// Config
export { isInputEngineEnabled } from './input-engine.config.js';

// Guard
export { guardEnabled } from './input-engine.guard.js';

// Storage
export { ConversationsStorageAdapter } from './storage/conversations-storage.adapter.js';

// Fields
export type { FieldHandler, RenderContext } from './fields/field.handler.js';
export { FieldHandlerRegistry } from './fields/field.handler.js';

// Text Field Handlers
export { ShortTextFieldHandler } from './fields/text/short-text.field.js';
export { LongTextFieldHandler } from './fields/text/long-text.field.js';
export { EmailFieldHandler } from './fields/text/email.field.js';
export { PhoneFieldHandler } from './fields/text/phone.field.js';
export { UrlFieldHandler } from './fields/text/url.field.js';
export { RegexValidatedFieldHandler } from './fields/text/regex-validated.field.js';

// Choice Field Handlers
export { SingleChoiceFieldHandler } from './fields/choice/single-choice.field.js';
export { BooleanToggleFieldHandler } from './fields/choice/boolean-toggle.field.js';

// Number Field Handlers
export { IntegerFieldHandler } from './fields/numbers/integer.field.js';
export { FloatFieldHandler } from './fields/numbers/float.field.js';
export { CurrencyFieldHandler } from './fields/numbers/currency.field.js';
export { PercentageFieldHandler } from './fields/numbers/percentage.field.js';
export { CurrencyAmountFieldHandler } from './fields/numbers/currency-amount.field.js';

// Runner
export { SchemaValidator } from './runner/schema.validator.js';
export type { FormRunnerDeps, FormRunnerInput } from './runner/form.runner.js';
export { runForm } from './runner/form.runner.js';
