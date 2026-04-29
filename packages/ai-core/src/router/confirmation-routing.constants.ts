export const CONFIRMATION_REQUIRED_RESPONSE_KEY = 'ai-core.confirmation.required';

export function createConfirmationRequiredStatus(params: {
  confirmationId: string;
  toolName: string;
}): string {
  return JSON.stringify({
    status: 'confirmation_required',
    confirmationId: params.confirmationId,
    toolName: params.toolName,
  });
}
