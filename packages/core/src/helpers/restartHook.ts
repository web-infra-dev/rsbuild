type Callback = () => unknown;

let callbacks: Callback[] = [];

export const restartHook = (callback: Callback): void => {
  callbacks.push(callback);
};

export const callRestartHook = async (): Promise<void> => {
  for (const callback of callbacks) {
    await callback();
  }
  callbacks = [];
};
