import type { RestartContext, RestartFn } from '../types/hooks';
import type { MaybePromise } from '../types/utils';

type Cleanup = () => MaybePromise<void>;

export type RestartManager = {
  /** Whether a restart executor is available. */
  readonly canRestart: boolean;
  /** Store the dynamic port for the next restart. */
  setPort(port: number): void;
  /** Consume the dynamic port associated with restart options. */
  inheritPort(options?: object): number | undefined;
  /** Register a cleanup callback and return a function that unregisters it. */
  registerCleanup(cleanup: Cleanup): () => void;
  /** Handle a restart request and return whether the restart succeeded. */
  requestRestart(context: RestartContext): Promise<boolean>;
};

// The options object temporarily links the current and replacement managers.
const restartPorts = new WeakMap<object, number>();

export const createRestartManager = ({
  onRestart,
  restart,
}: {
  onRestart: (context: RestartContext) => MaybePromise<unknown>;
  restart?: RestartFn;
}): RestartManager => {
  let cleanups = new Set<Cleanup>();
  let port: number | undefined;

  return {
    canRestart: Boolean(restart),
    setPort(nextPort) {
      port = nextPort;
    },
    inheritPort(options) {
      const inheritedPort = options ? restartPorts.get(options) : undefined;
      if (options) {
        restartPorts.delete(options);
      }
      return inheritedPort;
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

      if (context.action !== 'dev' || port === undefined) {
        return restart(context);
      }

      // Expose the port only while the replacement task is being created.
      restartPorts.set(context.options, port);
      try {
        return await restart(context);
      } finally {
        restartPorts.delete(context.options);
      }
    },
  };
};
