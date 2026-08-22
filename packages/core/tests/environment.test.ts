import { join } from 'node:path';
import {
  createCacheableFunction,
  loadBundle,
  type ServerUtils,
} from '../src/server/environment';
import type { Rspack } from '../src/types';

const stats = {} as Rspack.Stats;
const utils = {} as ServerUtils;

test('should cache pending calls for the same compilation and entry', async () => {
  let resolveGetter: ((value: string) => void) | undefined;
  const getter = rstest.fn(
    () =>
      new Promise<string>((resolve) => {
        resolveGetter = resolve;
      }),
  );
  const cacheableGetter = createCacheableFunction(getter);

  const first = cacheableGetter(stats, 'index', utils);
  const second = cacheableGetter(stats, 'index', utils);

  expect(first).toBe(second);
  await Promise.resolve();
  expect(getter).toHaveBeenCalledTimes(1);

  resolveGetter?.('result');
  await expect(first).resolves.toBe('result');
  await expect(second).resolves.toBe('result');
  await expect(cacheableGetter(stats, 'index', utils)).resolves.toBe('result');
  expect(getter).toHaveBeenCalledTimes(1);
});

test('should retry after a pending call rejects', async () => {
  const error = new Error('failed');
  const getter = rstest
    .fn()
    .mockRejectedValueOnce(error)
    .mockResolvedValueOnce('result');
  const cacheableGetter = createCacheableFunction<string>(getter);

  const first = cacheableGetter(stats, 'index', utils);
  const second = cacheableGetter(stats, 'index', utils);

  expect(first).toBe(second);
  await expect(first).rejects.toBe(error);
  await expect(cacheableGetter(stats, 'index', utils)).resolves.toBe('result');
  expect(getter).toHaveBeenCalledTimes(2);
});

test('should cache bundle outputs and handle output hits and misses', async () => {
  const outputPath = join(process.cwd(), 'dist');
  const getSharedFiles = rstest.fn(() => ['shared.js']);
  const toJson = rstest.fn(() => ({
    chunks: [
      { entry: true, id: 'first', files: ['first.js'] },
      { entry: true, id: 'second', files: ['second.js'] },
      {
        entry: false,
        id: 'shared',
        get files() {
          return getSharedFiles();
        },
      },
    ],
    entrypoints: {
      first: { chunks: ['first'] },
      second: { chunks: ['second'] },
    },
    outputPath,
  }));
  const bundleStats = {
    compilation: {
      options: {
        target: 'node',
        output: { module: false },
      },
    },
    toJson,
  } as unknown as Rspack.Stats;
  const sources = new Map([
    [
      join(outputPath, 'first.js'),
      `module.exports = {
        bundled: require('./shared.js'),
        external: require('node:path').basename('/external/file.js'),
      };`,
    ],
    [join(outputPath, 'second.js'), `module.exports = require('./shared.js');`],
    [join(outputPath, 'shared.js'), `module.exports = 'shared';`],
  ]);
  const bundleUtils = {
    environment: {},
    readFileSync: (fileName: string) => {
      const source = sources.get(fileName);
      if (source === undefined) {
        throw new Error(`Unexpected read: ${fileName}`);
      }
      return source;
    },
  } as ServerUtils;

  await expect(
    loadBundle<{ bundled: string; external: string }>(
      bundleStats,
      'first',
      bundleUtils,
    ),
  ).resolves.toEqual({ bundled: 'shared', external: 'file.js' });
  await expect(
    loadBundle<string>(bundleStats, 'second', bundleUtils),
  ).resolves.toBe('shared');

  expect(toJson).toHaveBeenCalledTimes(1);
  expect(getSharedFiles).toHaveBeenCalledTimes(1);
});
