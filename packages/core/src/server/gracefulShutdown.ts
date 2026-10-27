import { constants } from 'node:os';
import { isCI } from '../helpers';

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

const onSigterm = () => {
  // Add 128 to signal number as per POSIX convention for signal-terminated processes.
  void handleTermination(constants.signals.SIGTERM + 128);
};

const onStdinEnd = () => {
  void handleTermination(0);
};

/**
 * Share termination listeners until the last active server is closed.
 */
export const setupGracefulShutdown = (): (() => void) => {
  shutdownRefCount++;

  if (shutdownRefCount === 1) {
    // Listen for SIGTERM signal. Sent by container orchestrators like Docker/Kubernetes,
    // or manually via 'kill -15 <pid>' or 'kill -TERM <pid>' command.
    process.once('SIGTERM', onSigterm);

    // Listen for CTRL+D (stdin end) in non-CI environments
    if (!isCI()) {
      process.stdin.on('end', onStdinEnd);
    }
  }

  let cleanedUp = false;

  // Return a cleanup function to remove the listeners
  return () => {
    if (cleanedUp) {
      return;
    }
    cleanedUp = true;

    shutdownRefCount--;
    if (shutdownRefCount > 0) {
      return;
    }

    process.removeListener('SIGTERM', onSigterm);
    process.stdin.removeListener('end', onStdinEnd);
  };
};
