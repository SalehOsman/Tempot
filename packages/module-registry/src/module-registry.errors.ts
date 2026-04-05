export const MODULE_REGISTRY_ERRORS = {
  DISCOVERY_FAILED: 'module-registry.discovery.failed',
  DISCOVERY_NO_MODULES_DIR: 'module-registry.discovery.no_modules_dir',
  CONFIG_LOAD_FAILED: 'module-registry.config.load_failed',
  CONFIG_VALIDATION_FAILED: 'module-registry.config.validation_failed',
  STRUCTURE_INVALID: 'module-registry.structure.invalid',
  SPEC_GATE_FAILED: 'module-registry.spec_gate.failed',
  DEPENDENCY_MISSING: 'module-registry.dependency.missing',
  DUPLICATE_NAME: 'module-registry.name.duplicate',
  CORE_MODULE_FAILED: 'module-registry.core.validation_failed',
  REGISTRATION_FAILED: 'module-registry.registration.failed',
  NOT_DISCOVERED: 'module-registry.state.not_discovered',
  NOT_VALIDATED: 'module-registry.state.not_validated',
} as const;
