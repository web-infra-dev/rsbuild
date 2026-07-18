type Callback = () => unknown;

let callbacks: Callback[] = [];

export const restartHook = (callback: Callback): void => {
  callbacks.push(callback);
};

export const callRestartHook = async (): Promise<void> => {
  const currentCallbacks = callbacks;
  callbacks = [];

  let hasError = false;
  let firstError: unknown;

  for (const callback of currentCallbacks) {
    try {
      await callback();
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
