import type { FormRunnerInput } from './form.runner.js';

interface ExternalConversation {
  external?: <T>(task: () => T | Promise<T>) => Promise<T>;
}

function getConversation(input: FormRunnerInput): ExternalConversation {
  return input.conversation as ExternalConversation;
}

export async function runConversationSideEffect(
  input: FormRunnerInput,
  task: () => void,
): Promise<void> {
  const conversation = getConversation(input);
  if (!conversation.external) {
    task();
    return;
  }

  await conversation.external(() => {
    task();
    return undefined;
  });
}
