import { constants } from 'node:os';
import { isCI } from '../helpers/isCI';

/**
 * A set to store all cleanup callbacks that should be executed before process termination
 */
const cleanupCallbacks = new Set<() => Promise<void>>();

/**
 * Run all registered cleanup functions and terminates the process
 */
const handleTermination = async (exitCode: number): Promise<void> => {
  try {
    await Promise.all([...cleanupCallbacks].map((cb) => cb()));
  } finally {
    // Set exit code and terminate process
    process.exitCode ??= exitCode;
    process.exit();
  }
};

/**
 * Registers a cleanup callback to be executed before process termination
 */
export const registerCleanup = (callback: () => Promise<void>): void => {
  cleanupCallbacks.add(callback);
};
export const removeCleanup = (callback: () => Promise<void>): void => {
  cleanupCallbacks.delete(callback);
};

let shutdownRefCount = 0;

/**
 * Sets up listeners for termination signals and stdin end event
 * This should be called once during application initialization
 */
export const setupGracefulShutdown = (): (() => void) => {
  shutdownRefCount++;

  // Listen for SIGTERM signal. Sent by container orchestrators like Docker/Kubernetes,
  // or manually via 'kill -15 <pid>' or 'kill -TERM <pid>' command.
  // Add 128 to signal number as per POSIX convention for signal-terminated processes.
  const onSigterm = () => {
    void handleTermination(constants.signals.SIGTERM + 128);
  };
  process.once('SIGTERM', onSigterm);

  // Listen for CTRL+D (stdin end) in non-CI environments
  const listenToStdin = !isCI();
  const onStdinEnd = () => {
    void handleTermination(0);
  };
  if (listenToStdin) {
    process.stdin.on('end', onStdinEnd);
  }

  // Return a cleanup function to remove the listeners
  return () => {
    shutdownRefCount--;
    if (shutdownRefCount > 0) {
      return;
    }

    process.removeListener('SIGTERM', onSigterm);
    if (listenToStdin) {
      process.stdin.removeListener('end', onStdinEnd);
    }
  };
};
