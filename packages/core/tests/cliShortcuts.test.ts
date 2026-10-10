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

test('should keep other shortcuts active when one interface closes', async () => {
  const input = new PassThrough();
  using _stdin = rstest.spyOn(process, 'stdin', 'get').mockReturnValue(input);
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
    input.write('u\n');
    await setImmediate();

    expect(printUrls).toHaveBeenCalledOnce();
  } finally {
    cleanupFirst();
    cleanupSecond();
    input.destroy();
  }
});
