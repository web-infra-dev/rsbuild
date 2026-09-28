import { PassThrough } from 'node:stream';
import { setImmediate } from 'node:timers/promises';
import { createLogger } from '../src/logger';
import {
  normalizeShortcutInput,
  setupCliShortcuts,
} from '../src/server/cliShortcuts';

test('should normalize shortcut input', () => {
  expect(normalizeShortcutInput('h')).toBe('h');
  expect(normalizeShortcutInput(' H ')).toBe('h');
  expect(normalizeShortcutInput('\to\t')).toBe('o');
  expect(normalizeShortcutInput('  Q')).toBe('q');
});

test('should keep shortcuts active until the last interface closes', async () => {
  const input = new PassThrough();
  using stdin = rstest
    .spyOn(process, 'stdin', 'get')
    .mockReturnValue(input as typeof process.stdin);
  const printUrls = rstest.fn();
  const options = {
    help: false,
    openPage: async () => {},
    closeServer: async () => {},
    printUrls,
    logger: createLogger({ level: 'silent' }),
  };
  const cleanupFirst = await setupCliShortcuts(options);
  const cleanupSecond = await setupCliShortcuts(options);

  try {
    cleanupFirst();
    cleanupFirst();
    input.write('u\n');
    await setImmediate();

    expect(printUrls).toHaveBeenCalledExactlyOnceWith({ showAllRoutes: true });

    cleanupSecond();
    expect(input.isPaused()).toBe(true);
    expect(input.listenerCount('data')).toBe(0);
  } finally {
    cleanupFirst();
    cleanupSecond();
    input.destroy();
  }
});
