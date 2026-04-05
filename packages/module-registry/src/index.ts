// Types, interfaces, and constants
export type {
  UserRole,
  AiDegradationMode,
  ModuleCommand,
  ModuleFeatures,
  ModuleRequirements,
  ModuleConfig,
  DiscoveredModule,
  ValidatedModule,
  ValidationError,
  DiscoveryResult,
  ValidationResult,
  RegistryLogger,
  RegistryEventBus,
  RegistryBot,
  ModuleDiscoveryPort,
  ModuleValidatorPort,
} from './module-registry.types.js';

export { FEATURE_PACKAGE_MAP, TOGGLE_GUARD_PACKAGES } from './module-registry.types.js';

// Error codes
export { MODULE_REGISTRY_ERRORS } from './module-registry.errors.js';

// Schema
export { moduleConfigSchema } from './module-config.schema.js';

// Services
export type { ModuleDiscoveryDeps } from './module-discovery.service.js';
export { ModuleDiscovery } from './module-discovery.service.js';

export type { ModuleValidatorDeps } from './module-validator.service.js';
export { ModuleValidator } from './module-validator.service.js';

export type { ModuleRegistryDeps } from './module-registry.service.js';
export { ModuleRegistry } from './module-registry.service.js';
