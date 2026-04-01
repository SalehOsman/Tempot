/** Session TTL in seconds. Configurable via TEMPOT_SESSION_TTL_HOURS (default: 24). */
const SESSION_TTL_HOURS = Number(process.env['TEMPOT_SESSION_TTL_HOURS']) || 24;
const SECONDS_PER_HOUR = 3600;
export const DEFAULT_SESSION_TTL = SESSION_TTL_HOURS * SECONDS_PER_HOUR;
