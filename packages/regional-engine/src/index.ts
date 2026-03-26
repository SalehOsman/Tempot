// Types
export type { RegionalContext, GeoState, GeoCity, GeoOption } from './types.js';
export { DEFAULT_REGIONAL_CONTEXT } from './types.js';

// Services
export { DateService } from './date.service.js';
export type { DateFormatOptions } from './date.service.js';
export { FormatService } from './format.service.js';
export { GeoService } from './geo.service.js';
export { GeoSelectField } from './geo-select.field.js';
export { RegionalService } from './regional.service.js';

// Arch spec compatibility: Section 11.3 uses "RegionalEngine" as the facade name
export { RegionalService as RegionalEngine } from './regional.service.js';
