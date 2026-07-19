import type { RestartContext } from '../types/hooks';
import type { RsbuildInstance } from '../types/rsbuild';
import type { MaybePromise } from '../types/utils';

type Entry = { callback: () => MaybePromise<void> };

export type RestartExecutor = (context: RestartContext) => MaybePromise<boolean>;

export type RestartManager = {
  /** Register a cleanup callback and return a function that unregisters it. */
  register(callback: () => MaybePromise<void>): () => void;
  /** Handle a restart request and return whether the restart succeeded. */
  request(context: RestartContext): Promise<boolean>;
};

const restartManagers = new WeakMap<RsbuildInstance, RestartManager>();

export const createRestartManager = ({
  onRestart,
  restart,
}: {
  onRestart: (context: RestartContext) => MaybePromise<unknown>;
  restart?: RestartExecutor;
}): RestartManager => {
  let entries = new Set<Entry>();

  return {
    register(callback) {
      const entry = { callback };
      entries.add(entry);

      return () => {
        entries.delete(entry);
      };
    },
    async request(context) {
      if (!restart) {
        await onRestart(context);
        return false;
      }

      const currentEntries = entries;
      entries = new Set();

      let hasError = false;
      let firstError: unknown;

      try {
        await onRestart(context);
      } catch (error) {
        hasError = true;
        firstError = error;
      }

      for (const entry of currentEntries) {
        try {
          await entry.callback();
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

      return restart(context);
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
