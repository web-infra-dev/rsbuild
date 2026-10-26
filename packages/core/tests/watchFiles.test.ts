import { createLogger } from '../src/logger';
import { createChokidar } from '../src/server/watchFiles';

test('should log file watcher errors without throwing', async () => {
  const logger = createLogger();
  const logError = rstest.spyOn(logger, 'error').mockImplementation(() => {});
  const watcher = await createChokidar([], import.meta.dirname, {}, logger);
  const error = new Error(
    'ENOSPC: System limit for number of file watchers reached',
  );

  try {
    expect(() => watcher.emit('error', error)).not.toThrow();
    expect(logError).toHaveBeenCalledWith('File watcher error:', error);
  } finally {
    await watcher.close();
  }
});
