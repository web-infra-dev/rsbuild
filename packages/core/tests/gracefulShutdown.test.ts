import { setupGracefulShutdown } from '../src/server/gracefulShutdown';

test('should share shutdown listeners until the last server closes', () => {
  const listeners = process.listeners('SIGTERM');
  const cleanupFirst = setupGracefulShutdown();
  const cleanupSecond = setupGracefulShutdown();

  try {
    expect(process.listenerCount('SIGTERM')).toBe(listeners.length + 1);

    cleanupFirst();
    cleanupFirst();

    expect(process.listenerCount('SIGTERM')).toBe(listeners.length + 1);
  } finally {
    cleanupFirst();
    cleanupSecond();
  }

  expect(process.listeners('SIGTERM')).toEqual(listeners);
});
