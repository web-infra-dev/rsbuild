import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { color } from '../src/helpers';
import { run } from '../src/server/runner';
import { SystemJsRunner } from '../src/server/runner/systemJs';
import type { RunnerFactoryOptions } from '../src/server/runner/type';

type ModuleFixture = readonly [moduleId: string, code: string];

const DEFAULT_DIST = path.resolve('/virtual/dist');

const createRunnerOptions = (
  entries: ReadonlyArray<ModuleFixture>,
  dist = DEFAULT_DIST,
): RunnerFactoryOptions => {
  const files = new Map(
    entries.map(([moduleId, code]) => [path.resolve(dist, moduleId), code]),
  );
  return {
    compilerOptions: {
      output: { module: true },
      target: 'node',
    } as RunnerFactoryOptions['compilerOptions'],
    dist,
    isBundleOutput: (fileName) => files.has(fileName),
    readFileSync: (fileName) => {
      const content = files.get(fileName);
      if (content === undefined) {
        throw new Error(`Unknown output file: ${fileName}`);
      }
      return content;
    },
  };
};

const createSystemJsRunner = (
  entries: ReadonlyArray<ModuleFixture>,
  dist?: string,
) =>
  new SystemJsRunner({
    name: 'entry.mjs',
    ...createRunnerOptions(entries, dist),
  });

test('runs ESM bundle output through the runner factory', async () => {
  const options = createRunnerOptions([
    ['entry.mjs', 'export const value = 42;'],
  ]);

  await expect(
    run({ bundlePath: 'entry.mjs', ...options }),
  ).resolves.toMatchObject({ value: 42 });
});

test('provides Node file metadata in import.meta', async () => {
  const moduleId = path.join(DEFAULT_DIST, 'nested', 'module.mjs');
  const runner = createSystemJsRunner([
    [
      'entry.mjs',
      `import { meta } from './nested/module.mjs';
export { meta };`,
    ],
    [
      'nested/module.mjs',
      `export const meta = {
  dirname: import.meta.dirname,
  filename: import.meta.filename,
  url: import.meta.url,
};`,
    ],
  ]);

  await expect(runner.run('entry.mjs')).resolves.toMatchObject({
    meta: {
      dirname: path.dirname(moduleId),
      filename: moduleId,
      url: pathToFileURL(moduleId).href,
    },
  });
});

test.each([
  ['glob', `import.meta.glob('./*.js')`],
  ['resolve', `import.meta.resolve('./dependency.mjs')`],
])('reports unsupported import.meta.%s()', async (method, expression) => {
  const runner = createSystemJsRunner([
    ['entry.mjs', `${expression};\nexport const value = 1;`],
  ]);

  await expect(runner.run('entry.mjs')).rejects.toMatchObject({
    message: `${color.dim('[rsbuild:runner]')} import.meta.${method}() is not supported by the SystemJS runner.`,
    name: 'Error',
  });
});

test('maps runtime errors to the original source location', async () => {
  const entryPath = path.join(DEFAULT_DIST, 'entry.mjs');
  const runner = createSystemJsRunner([
    [
      'entry.mjs',
      `export const before = 1;
export function fail() {
  throw new Error('source map failure');
}
fail();`,
    ],
  ]);
  let runtimeError: unknown;

  try {
    await runner.run('entry.mjs');
  } catch (error) {
    runtimeError = error;
  }

  expect(runtimeError).toBeInstanceOf(Error);
  expect((runtimeError as Error).message).toBe('source map failure');
  expect((runtimeError as Error).stack).toContain(`at fail (${entryPath}:3:9)`);
  expect((runtimeError as Error).stack).toContain(
    `at Object.execute (${entryPath}:5:1)`,
  );
});

test('reports a error for a missing static external export', async () => {
  const externalId = 'data:text/javascript,export const present=1';
  const runner = createSystemJsRunner([
    [
      'entry.mjs',
      `import { definitelyMissing } from '${externalId}';
       export const value = typeof definitelyMissing;`,
    ],
  ]);

  await expect(runner.run('entry.mjs')).rejects.toMatchObject({
    message: `${color.dim('[rsbuild:runner]')} The requested module '${externalId}' does not provide an export named 'definitelyMissing'`,
    name: 'SyntaxError',
  });
});
