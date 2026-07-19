import type { RestartContext } from '../types/hooks';
import type { MaybePromise } from '../types/utils';

type Cleanup = () => MaybePromise<void>;

export type RestartExecutor = (context: RestartContext) => MaybePromise<boolean>;

export type RestartManager = {
  /** Whether a restart executor is available. */
  readonly canRestart: boolean;
  /** Register a cleanup callback and return a function that unregisters it. */
  registerCleanup(cleanup: Cleanup): () => void;
  /** Handle a restart request and return whether the restart succeeded. */
  requestRestart(context: RestartContext): Promise<boolean>;
};

export const createRestartManager = ({
  onRestart,
  restart,
}: {
  onRestart: (context: RestartContext) => MaybePromise<unknown>;
  restart?: RestartExecutor;
}): RestartManager => {
  let cleanups = new Set<Cleanup>();

  return {
    canRestart: Boolean(restart),
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
