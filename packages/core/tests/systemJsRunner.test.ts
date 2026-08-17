import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { color } from '../src/helpers';
import { run } from '../src/server/runner';
import { SystemJsRunner } from '../src/server/runner/systemJs';
import type { RunnerFactoryOptions } from '../src/server/runner/type';

type ModuleFixture = readonly [moduleId: string, code: string];

const createRunnerOptions = (
  entries: ReadonlyArray<ModuleFixture>,
  dist = '/virtual/dist',
): RunnerFactoryOptions => {
  const files = new Map(entries.map(([moduleId, code]) => [path.resolve(dist, moduleId), code]));
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

const createSystemJsRunner = (entries: ReadonlyArray<ModuleFixture>, dist?: string) =>
  new SystemJsRunner({ name: 'entry.mjs', ...createRunnerOptions(entries, dist) });

test('runs ESM bundle output through the runner factory', async () => {
  const options = createRunnerOptions([['entry.mjs', 'export const value = 42;']]);

  await expect(run({ bundlePath: 'entry.mjs', ...options })).resolves.toMatchObject({ value: 42 });
});

test('maps runtime errors to the original source location', async () => {
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
  const cause = (runtimeError as Error & { cause?: Error }).cause;
  expect(cause?.message).toBe('source map failure');
  expect(cause?.stack).toContain('at fail (/virtual/dist/entry.mjs:3:9)');
  expect(cause?.stack).toContain('at Object.execute (/virtual/dist/entry.mjs:5:1)');
});

test('resolves import-only external packages from the bundle importer', async () => {
  const root = mkdtempSync(path.join(tmpdir(), 'rsbuild-systemjs-'));
  const dist = path.join(root, 'dist');
  const packageDir = path.join(root, 'node_modules', 'systemjs-import-only');

  mkdirSync(packageDir, { recursive: true });
  writeFileSync(
    path.join(packageDir, 'package.json'),
    JSON.stringify({
      exports: { '.': { import: './index.js' } },
      name: 'systemjs-import-only',
      type: 'module',
    }),
  );
  writeFileSync(path.join(packageDir, 'index.js'), 'export const value = 42;');

  try {
    const runner = createSystemJsRunner(
      [
        [
          'entry.mjs',
          `import { value } from 'systemjs-import-only';
           export { value };`,
        ],
      ],
      dist,
    );

    await expect(runner.run('entry.mjs')).resolves.toMatchObject({ value: 42 });
  } finally {
    rmSync(root, { force: true, recursive: true });
  }
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
