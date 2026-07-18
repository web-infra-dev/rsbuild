import type { RestartContext } from '../types/hooks';

type Callback = (context: RestartContext) => unknown;

let callbacks: Callback[] = [];

export const restartHook = (callback: Callback): void => {
  callbacks.push(callback);
};

export const callRestartHook = async (context: RestartContext): Promise<void> => {
  const currentCallbacks = callbacks;
  callbacks = [];

  let hasError = false;
  let firstError: unknown;

  for (const callback of currentCallbacks) {
    try {
      await callback(context);
    } catch (error) {
      if (!hasError) {
        hasError = true;
        firstError = error;
      }
    }
  }

  if (hasError) {
    throw firstError;
  }
};
