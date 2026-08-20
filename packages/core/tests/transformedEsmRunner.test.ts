import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { color } from '../src/helpers';
import { run } from '../src/server/runner';
import { TransformedEsmRunner } from '../src/server/runner/transformedEsm';
import type { RunnerFactoryOptions } from '../src/server/runner/type';

type ModuleFixture = readonly [moduleId: string, code: string];
type TestNamespace = Record<string, any>;

const DEFAULT_DIST = path.resolve('/virtual/module-runner-dist');

const createRunner = (
  entries: ReadonlyArray<ModuleFixture>,
  dist = DEFAULT_DIST,
) => {
  const files = new Map(
    entries.map(([moduleId, code]) => [path.resolve(dist, moduleId), code]),
  );
  return new TransformedEsmRunner({
    compilerOptions: {
      output: { module: true },
      target: 'node',
    } as RunnerFactoryOptions['compilerOptions'],
    dist,
    isBundleOutput: (fileName) => files.has(fileName),
    name: 'entry.mjs',
    readFileSync: (fileName) => {
      const content = files.get(fileName);
      if (content === undefined) {
        throw new Error(`Unknown output file: ${fileName}`);
      }
      return content;
    },
  });
};

let externalIndex = 0;
const externalModule = (source: string): string =>
  `data:text/javascript;charset=utf-8,${encodeURIComponent(source)}#module-runner-${externalIndex++}`;

test('runs ESM bundle output through the runner factory', async () => {
  const files = new Map([
    [path.join(DEFAULT_DIST, 'entry.mjs'), 'export const value = 42;'],
  ]);
  const options: RunnerFactoryOptions = {
    compilerOptions: {
      output: { module: true },
      target: 'node',
    } as RunnerFactoryOptions['compilerOptions'],
    dist: DEFAULT_DIST,
    isBundleOutput: (fileName) => files.has(fileName),
    readFileSync: (fileName) => files.get(fileName)!,
  };

  await expect(
    run({ bundlePath: 'entry.mjs', ...options }),
  ).resolves.toMatchObject({ value: 42 });
});

test('evaluates basic exports once and shares concurrent evaluation', async () => {
  const stateKey = '__rsbuildTransformedEsmEvaluationCount';
  const runner = createRunner([
    [
      'entry.mjs',
      `globalThis[${JSON.stringify(stateKey)}] = (globalThis[${JSON.stringify(stateKey)}] || 0) + 1;
export const value = 42;
export default 'default';`,
    ],
  ]);

  try {
    const [first, second] = (await Promise.all([
      runner.run('entry.mjs'),
      runner.run('entry.mjs'),
    ])) as TestNamespace[];
    expect(first).toBe(second);
    expect(first).toMatchObject({ default: 'default', value: 42 });
    expect((globalThis as TestNamespace)[stateKey]).toBe(1);
  } finally {
    delete (globalThis as TestNamespace)[stateKey];
  }
});

test('evaluates local dependencies in source order and supports late dynamic import', async () => {
  const stateKey = '__rsbuildTransformedEsmOrder';
  const runner = createRunner([
    [
      'entry.mjs',
      `import './first.mjs';
import './second.mjs';
export const order = globalThis[${JSON.stringify(stateKey)}];
export const load = () => import('./lazy.mjs');`,
    ],
    ['first.mjs', `globalThis[${JSON.stringify(stateKey)}] = 'first';`],
    [
      'second.mjs',
      `globalThis[${JSON.stringify(stateKey)}] += ':second';
await Promise.resolve();`,
    ],
    ['lazy.mjs', `export const value = 'lazy';`],
  ]);

  try {
    const result = (await runner.run('entry.mjs')) as TestNamespace;
    expect(result.order).toBe('first:second');
    await expect(result.load()).resolves.toMatchObject({ value: 'lazy' });
  } finally {
    delete (globalThis as TestNamespace)[stateKey];
  }
});

test('freezes late dynamic imports to the current compilation snapshot', async () => {
  const entryPath = path.join(DEFAULT_DIST, 'entry.mjs');
  const lazyPath = path.join(DEFAULT_DIST, 'lazy.mjs');
  const files = new Map([
    [entryPath, `export const load = () => import('./lazy.mjs');`],
    [lazyPath, `export const value = 'before-rebuild';`],
  ]);
  const createSnapshotRunner = () =>
    new TransformedEsmRunner({
      bundleFiles: files,
      compilerOptions: {
        output: { module: true },
        target: 'node',
      } as RunnerFactoryOptions['compilerOptions'],
      dist: DEFAULT_DIST,
      isBundleOutput: (fileName) => files.has(fileName),
      name: 'entry.mjs',
      readFileSync: (fileName) => files.get(fileName)!,
    });

  const oldNamespace = (await createSnapshotRunner().run(
    'entry.mjs',
  )) as TestNamespace;
  files.set(lazyPath, `export const value = 'after-rebuild';`);

  await expect(oldNamespace.load()).resolves.toMatchObject({
    value: 'before-rebuild',
  });
  const newNamespace = (await createSnapshotRunner().run(
    'entry.mjs',
  )) as TestNamespace;
  await expect(newNamespace.load()).resolves.toMatchObject({
    value: 'after-rebuild',
  });
});

test('propagates top-level await completion and rejection', async () => {
  const completed = createRunner([
    [
      'entry.mjs',
      `import { value } from './dependency.mjs'; export const result = value;`,
    ],
    [
      'dependency.mjs',
      `await Promise.resolve(); export const value = 'completed';`,
    ],
  ]);
  await expect(completed.run('entry.mjs')).resolves.toMatchObject({
    result: 'completed',
  });

  const rejected = createRunner([
    [
      'entry.mjs',
      `import './dependency.mjs'; export const unreachable = true;`,
    ],
    ['dependency.mjs', `await Promise.reject(new Error('TLA rejected'));`],
  ]);
  await expect(rejected.run('entry.mjs')).rejects.toThrow('TLA rejected');
});

test('shares dependency evaluation across concurrent importers', async () => {
  const stateKey = '__rsbuildTransformedEsmDependencyCount';
  const runner = createRunner([
    ['first.mjs', `import { value } from './shared.mjs'; export { value };`],
    ['second.mjs', `import { value } from './shared.mjs'; export { value };`],
    [
      'shared.mjs',
      `globalThis[${JSON.stringify(stateKey)}] = (globalThis[${JSON.stringify(stateKey)}] || 0) + 1;
await Promise.resolve();
export const value = globalThis[${JSON.stringify(stateKey)}];`,
    ],
  ]);

  try {
    const [first, second] = (await Promise.all([
      runner.run('first.mjs'),
      runner.run('second.mjs'),
    ])) as TestNamespace[];
    expect(first.value).toBe(1);
    expect(second.value).toBe(1);
    expect((globalThis as TestNamespace)[stateKey]).toBe(1);
  } finally {
    delete (globalThis as TestNamespace)[stateKey];
  }
});

test('supports mutually cyclic bundle modules', async () => {
  const runner = createRunner([
    [
      'entry.mjs',
      `import { readB } from './b.mjs';
export const valueA = 'A';
export const readA = () => valueA;
export const cycle = () => readB();`,
    ],
    [
      'b.mjs',
      `import { readA } from './entry.mjs';
export const readB = () => readA() + 'B';`,
    ],
  ]);

  const result = (await runner.run('entry.mjs')) as TestNamespace;
  expect(result.cycle()).toBe('AB');
});

test('reports a missing static export in a cycle before executing its body', async () => {
  const stateKey = '__rsbuildTransformedEsmMissingCycleExecuted';
  const runner = createRunner([
    [
      'entry.mjs',
      `import './dependency.mjs';
export const present = true;`,
    ],
    [
      'dependency.mjs',
      `import { missing } from './entry.mjs';
globalThis[${JSON.stringify(stateKey)}] = true;
export const value = missing;`,
    ],
  ]);

  try {
    await expect(runner.run('entry.mjs')).rejects.toThrow(
      "does not provide an export named 'missing'",
    );
    expect((globalThis as TestNamespace)[stateKey]).toBeUndefined();
  } finally {
    delete (globalThis as TestNamespace)[stateKey];
  }
});

test('keeps direct external imports live and calls imported functions unbound', async () => {
  const externalId = externalModule(`
export let ready = false;
export function mark() { ready = true; }
export function receiver() { return this; }
`);
  const runner = createRunner([
    [
      'entry.mjs',
      `import { ready, mark, receiver } from ${JSON.stringify(externalId)};
export const read = () => ready;
export const update = () => {
  const before = ready;
  mark();
  return [before, ready, receiver(), receiver?.()];
};`,
    ],
  ]);

  const result = (await runner.run('entry.mjs')) as TestNamespace;
  expect(result.read()).toBe(false);
  expect(result.update()).toEqual([false, true, undefined, undefined]);
  expect(result.read()).toBe(true);
});

test('propagates live bindings through named, default, star and multilevel reexports', async () => {
  const externalId = externalModule(`
export let value = 0;
export function increment() { value += 1; }
`);
  const runner = createRunner([
    [
      'entry.mjs',
      `import current, { value, increment } from './bridge.mjs';
import { value as starValue } from './star.mjs';
export const update = () => {
  const before = [value, current, starValue];
  increment();
  return [before, value, current, starValue];
};`,
    ],
    [
      'bridge.mjs',
      `export { value, value as default, increment } from ${JSON.stringify(externalId)};`,
    ],
    ['star.mjs', `export * from './bridge.mjs';`],
  ]);

  const result = (await runner.run('entry.mjs')) as TestNamespace;
  expect(result.update()).toEqual([[0, 0, 0], 1, 1, 1]);
  expect(result.update()).toEqual([[1, 1, 1], 2, 2, 2]);
});

test('omits ambiguous star exports while preserving explicit exports', async () => {
  const runner = createRunner([
    [
      'entry.mjs',
      `export * from './first.mjs';
export * from './first.mjs';
export * from './second.mjs';
export { overridden } from './first.mjs';`,
    ],
    [
      'first.mjs',
      `export const conflict = 'first';
export const firstOnly = 'first';
export const overridden = 'first';
export const repeated = 'first';`,
    ],
    [
      'second.mjs',
      `export const conflict = 'second';
export const overridden = 'second';
export const secondOnly = 'second';`,
    ],
    [
      'consumer.mjs',
      `import { conflict } from './entry.mjs';
export const value = conflict;`,
    ],
  ]);

  const namespace = (await runner.run('entry.mjs')) as TestNamespace;
  expect(namespace).toMatchObject({
    firstOnly: 'first',
    overridden: 'first',
    repeated: 'first',
    secondOnly: 'second',
  });
  expect(Object.hasOwn(namespace, 'conflict')).toBe(false);

  await expect(runner.run('consumer.mjs')).rejects.toMatchObject({
    message: `${color.dim('[rsbuild:runner]')} The requested module './entry.mjs' contains conflicting star exports for name 'conflict'`,
    name: 'SyntaxError',
  });
});

test('observes asynchronous external export updates', async () => {
  const externalId = externalModule(`
export let ready = false;
export async function markLater() {
  await Promise.resolve();
  ready = true;
}
`);
  const runner = createRunner([
    [
      'entry.mjs',
      `import { ready, markLater } from ${JSON.stringify(externalId)};
export const observe = async () => {
  const before = ready;
  await markLater();
  return [before, ready];
};`,
    ],
  ]);

  const result = (await runner.run('entry.mjs')) as TestNamespace;
  await expect(result.observe()).resolves.toEqual([false, true]);
});

test('shares live external bindings across importers and calls tags unbound', async () => {
  const externalId = externalModule(`
export let value = 0;
export function increment() { value += 1; }
export function tag() { return this; }
`);
  const runner = createRunner([
    [
      'entry.mjs',
      `import { read } from './reader.mjs';
import { update, readTagThis } from './writer.mjs';
export { read, update, readTagThis };`,
    ],
    [
      'reader.mjs',
      `import { value as current } from ${JSON.stringify(externalId)};
export const read = () => current;`,
    ],
    [
      'writer.mjs',
      `import { increment, tag } from ${JSON.stringify(externalId)};
export const update = () => increment();
export const readTagThis = () => tag\`value\`;`,
    ],
  ]);

  const result = (await runner.run('entry.mjs')) as TestNamespace;
  expect(result.read()).toBe(0);
  result.update();
  expect(result.read()).toBe(1);
  expect(result.readTagThis()).toBeUndefined();
});

test('preserves the native external namespace object', async () => {
  const externalId = externalModule(`export const value = 1;`);
  const runner = createRunner([
    [
      'entry.mjs',
      `import * as namespace from ${JSON.stringify(externalId)};
export { namespace };`,
    ],
  ]);
  const nativeNamespace = await import(externalId);

  const result = (await runner.run('entry.mjs')) as TestNamespace;
  expect(result.namespace).toBe(nativeNamespace);
});

test('reports missing static exports without rejecting namespace or dynamic imports', async () => {
  const externalId = externalModule(`export const present = 1;`);
  const missingRunner = createRunner([
    [
      'entry.mjs',
      `import { missing } from ${JSON.stringify(externalId)};
export const value = typeof missing;`,
    ],
  ]);

  await expect(missingRunner.run('entry.mjs')).rejects.toMatchObject({
    message: `${color.dim('[rsbuild:runner]')} The requested module '${externalId}' does not provide an export named 'missing'`,
    name: 'SyntaxError',
  });

  const namespaceRunner = createRunner([
    [
      'entry.mjs',
      `import * as namespace from ${JSON.stringify(externalId)};
export const staticMissing = namespace.missing;
export const dynamicMissing = () => import(${JSON.stringify(externalId)}).then((mod) => mod.missing);`,
    ],
  ]);
  const result = (await namespaceRunner.run('entry.mjs')) as TestNamespace;
  expect(result.staticMissing).toBeUndefined();
  await expect(result.dynamicMissing()).resolves.toBeUndefined();

  const missingDefaultRunner = createRunner([
    [
      'entry.mjs',
      `import missingDefault from ${JSON.stringify(externalId)};
export const value = missingDefault;`,
    ],
  ]);
  await expect(missingDefaultRunner.run('entry.mjs')).rejects.toThrow(
    "does not provide an export named 'default'",
  );

  const nonBindingImports = createRunner([
    [
      'entry.mjs',
      `import ${JSON.stringify(externalId)};
export * from ${JSON.stringify(externalId)};
export const loaded = true;`,
    ],
  ]);
  await expect(nonBindingImports.run('entry.mjs')).resolves.toMatchObject({
    loaded: true,
    present: 1,
  });
});

test('provides Node import.meta metadata and Rsbuild unsupported-method errors', async () => {
  const moduleId = path.join(DEFAULT_DIST, 'nested', 'module.mjs');
  const runner = createRunner([
    ['entry.mjs', `export { meta, unsupported } from './nested/module.mjs';`],
    [
      'nested/module.mjs',
      `export const meta = {
  dirname: import.meta.dirname,
  filename: import.meta.filename,
  url: import.meta.url,
};
export const unsupported = () => import.meta.resolve('./dependency.mjs');`,
    ],
  ]);

  const result = (await runner.run('entry.mjs')) as TestNamespace;
  expect(result.meta).toEqual({
    dirname: path.dirname(moduleId),
    filename: moduleId,
    url: pathToFileURL(moduleId).href,
  });
  expect(() => result.unsupported()).toThrow(
    `${color.dim('[rsbuild:runner]')} import.meta.resolve() is not supported.`,
  );
});

test.each([
  ['glob', `import.meta.glob('./*.js')`],
  ['resolve', `import.meta.resolve('./dependency.mjs')`],
])('reports unsupported import.meta.%s()', async (method, expression) => {
  const runner = createRunner([
    ['entry.mjs', `${expression};\nexport const value = 1;`],
  ]);

  await expect(runner.run('entry.mjs')).rejects.toMatchObject({
    message: `${color.dim('[rsbuild:runner]')} import.meta.${method}() is not supported.`,
    name: 'Error',
  });
});

test('maps runtime errors to the original source location', async () => {
  const entryPath = path.join(DEFAULT_DIST, 'entry.mjs');
  const runner = createRunner([
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
});

test('evaluates bundle dependencies before later external dependencies', async () => {
  const stateKey = '__rsbuildTransformedEsmExternalOrder';
  const externalId = externalModule(`
const key = ${JSON.stringify(stateKey)};
if (globalThis[key] !== 'bundle') {
  throw new Error('bundle dependency was not evaluated first');
}
globalThis[key] += ':external';
`);
  const runner = createRunner([
    [
      'entry.mjs',
      `import './polyfill.mjs';
import ${JSON.stringify(externalId)};
export const order = globalThis[${JSON.stringify(stateKey)}];`,
    ],
    ['polyfill.mjs', `globalThis[${JSON.stringify(stateKey)}] = 'bundle';`],
  ]);

  try {
    await expect(runner.run('entry.mjs')).resolves.toMatchObject({
      order: 'bundle:external',
    });
  } finally {
    delete (globalThis as TestNamespace)[stateKey];
  }
});

test('retries a failed module and isolates separate runner graphs', async () => {
  const entryPath = path.join(DEFAULT_DIST, 'entry.mjs');
  let attempt = 0;
  const options = {
    compilerOptions: {
      output: { module: true },
      target: 'node',
    } as RunnerFactoryOptions['compilerOptions'],
    dist: DEFAULT_DIST,
    isBundleOutput: (fileName: string) => fileName === entryPath,
    name: 'entry.mjs',
    readFileSync: () =>
      attempt++ === 0 ? 'export const = invalid;' : 'export const value = 1;',
  };
  const runner = new TransformedEsmRunner(options);

  await expect(runner.run('entry.mjs')).rejects.toBeInstanceOf(Error);
  await expect(runner.run('entry.mjs')).resolves.toMatchObject({ value: 1 });

  const other = createRunner([['entry.mjs', 'export const value = 2;']]);
  await expect(other.run('entry.mjs')).resolves.toMatchObject({ value: 2 });
  await expect(runner.run('../outside.mjs')).rejects.toThrow(
    'Bundle module is outside the output root',
  );
});
