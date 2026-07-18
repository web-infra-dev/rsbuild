import type { RestartManager } from '../types/context';
import type { OnRestartFn } from '../types/hooks';
import type { RsbuildInstance } from '../types/rsbuild';

type Entry = { callback: OnRestartFn };

const restartManagers = new WeakMap<RsbuildInstance, RestartManager>();

export const createRestartManager = (): RestartManager => {
  let entries = new Set<Entry>();

  return {
    register(callback) {
      const entry = { callback };
      entries.add(entry);

      return () => {
        entries.delete(entry);
      };
    },
    async call(context) {
      const currentEntries = entries;
      entries = new Set();

      let hasError = false;
      let firstError: unknown;

      for (const entry of currentEntries) {
        try {
          await entry.callback(context);
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
    },
  };
};

export const setRestartManager = (instance: RsbuildInstance, manager: RestartManager): void => {
  restartManagers.set(instance, manager);
};

export const getRestartManager = (instance: RsbuildInstance): RestartManager => {
  const manager = restartManagers.get(instance);
  if (!manager) {
    throw new Error('Restart manager is not initialized.');
  }
  return manager;
};
