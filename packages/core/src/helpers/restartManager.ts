import type { RestartContext, RestartFn } from '../types/hooks';
import type { MaybePromise } from '../types/utils';

type Cleanup = () => MaybePromise<void>;

export type RestartManager = {
  /** Whether a restart executor is available. */
  readonly canRestart: boolean;
  /** Get the port used before a restart. */
  getPort(): number | undefined;
  /** Set the port to reuse after a restart. */
  setPort(port: number): void;
  /** Register a cleanup callback and return a function that unregisters it. */
  registerCleanup(cleanup: Cleanup): () => void;
  /** Handle a restart request and return whether the restart succeeded. */
  requestRestart(context: RestartContext): Promise<boolean>;
};

// Replacement instances use the same restart callback, so its identity can be
// used to share the last port without exposing a public option.
const restartPorts = new WeakMap<RestartFn, number>();

export const createRestartManager = ({
  onRestart,
  restart,
}: {
  onRestart: (context: RestartContext) => MaybePromise<unknown>;
  restart?: RestartFn;
}): RestartManager => {
  let cleanups = new Set<Cleanup>();

  return {
    canRestart: Boolean(restart),
    getPort() {
      return restart ? restartPorts.get(restart) : undefined;
    },
    setPort(port) {
      if (restart) {
        restartPorts.set(restart, port);
      }
    },
    registerCleanup(cleanup) {
      cleanups.add(cleanup);

      return () => {
        cleanups.delete(cleanup);
      };
    },
    async requestRestart(context) {
      if (!restart) {
        await onRestart(context);
        return false;
      }

      const currentCleanups = cleanups;
      cleanups = new Set();

      let hasError = false;
      let firstError: unknown;

      try {
        await onRestart(context);
      } catch (error) {
        hasError = true;
        firstError = error;
      }

      for (const cleanup of currentCleanups) {
        try {
          await cleanup();
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
