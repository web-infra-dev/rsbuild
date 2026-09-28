import { setupGracefulShutdown } from '../src/server/gracefulShutdown';

test.each([false, true])(
  'should share shutdown listeners until the last server closes (CI=%s)',
  (isCI) => {
    rstest.stubEnv('CI', String(isCI));
    const sigtermListeners = process.listeners('SIGTERM');
    const stdinListeners = process.stdin.listeners('end');

    // A new group of servers should register listeners again after cleanup.
    for (let cycle = 0; cycle < 2; cycle++) {
      const cleanupFirst = setupGracefulShutdown();
      const cleanupSecond = setupGracefulShutdown();

      try {
        expect(process.listenerCount('SIGTERM')).toBe(
          sigtermListeners.length + 1,
        );
        expect(process.stdin.listenerCount('end')).toBe(
          stdinListeners.length + (isCI ? 0 : 1),
        );

        cleanupFirst();
        cleanupFirst();

        expect(process.listenerCount('SIGTERM')).toBe(
          sigtermListeners.length + 1,
        );
        expect(process.stdin.listenerCount('end')).toBe(
          stdinListeners.length + (isCI ? 0 : 1),
        );
      } finally {
        cleanupFirst();
        cleanupSecond();
      }

      expect(process.listeners('SIGTERM')).toEqual(sigtermListeners);
      expect(process.stdin.listeners('end')).toEqual(stdinListeners);
    }
  },
);
