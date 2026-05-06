export function isDynamicCmsEnabled(override?: boolean): boolean {
  if (override !== undefined) return override;
  return process.env.TEMPOT_DYNAMIC_CMS === 'true';
}
