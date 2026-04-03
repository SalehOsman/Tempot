/** Check if input-engine is enabled (Rule XVI) */
export function isInputEngineEnabled(): boolean {
  return process.env.TEMPOT_INPUT_ENGINE !== 'false';
}
