import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { experiments } from '@rspack/core';
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

test('decodes an inline source map while transforming a bundle module', async () => {
  const originalPath = path.resolve('/virtual/src/utils/posts.tsx');
  const generatedSource = `export function fail() {
  throw new Error('late source map failure');
}`;
  const inputSourceMap = JSON.stringify({
    mappings: 'AAAA;AACA;AACA',
    names: [],
    sources: [originalPath],
    sourcesContent: [generatedSource],
    version: 3,
  });
  const encodedSourceMap = Buffer.from(inputSourceMap).toString('base64');
  const transform = rstest.spyOn(experiments.swc, 'transform');
  const runner = createSystemJsRunner(
    [
      [
        'entry.mjs',
        `${generatedSource}
//# sourceURL=${originalPath}?tss-serverfn-split
//# sourceMappingURL=data:application/json;base64,${encodedSourceMap}`,
      ],
    ],
    path.resolve('/virtual/inline-map-dist'),
  );

  const namespace = (await runner.run('entry.mjs')) as {
    fail: () => void;
  };
  const transformOptions = transform.mock.calls.map((call) => call[1]);
  transform.mockRestore();
  expect(transformOptions).toContainEqual(
    expect.objectContaining({ inputSourceMap }),
  );
  expect(namespace.fail).toBeTypeOf('function');
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
