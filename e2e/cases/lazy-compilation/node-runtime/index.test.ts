import { createRequire } from 'node:module';
import { join } from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import { type Dev, expect, test } from '@e2e/helper';
import { type RsbuildPlugin, rspack } from '@rsbuild/core';
import { waitFor } from '@rstackjs/test-utils';

type RuntimeResult = {
  value: string;
  entryExecutions: number;
  firstExecutions: number;
  firstHandlers: number;
  firstUpdates: number;
  secondExecutions: number;
  secondHandlers: number;
};

type Runtime = {
  loadFirst: () => Promise<RuntimeResult>;
  loadSecond: () => Promise<RuntimeResult>;
  applyUpdate: () => Promise<string[] | null>;
  getHash: () => string;
};

const runRuntimeCase = async (
  {
    cwd,
    devOnly,
    sourceDir,
    editFile,
  }: {
    cwd: string;
    devOnly: Dev;
    sourceDir: string;
    editFile: (
      filename: string,
      editor: (code: string) => string,
    ) => Promise<void>;
  },
  { module, extension }: { module: boolean; extension: 'cjs' | 'mjs' },
) => {
  const outputPath = join(cwd, 'dist', extension, `index.${extension}`);
  const nativeRequire = createRequire(import.meta.url);
  const stateKey = `rsbuild-node-lazy:${cwd}:${extension}`;
  const evaluations: Omit<RuntimeResult, 'value'> = {
    entryExecutions: 0,
    firstExecutions: 0,
    firstHandlers: 0,
    firstUpdates: 0,
    secondExecutions: 0,
    secondHandlers: 0,
  };
  Reflect.set(process, stateKey, evaluations);
  const requestController = new AbortController();
  let runtime: Runtime | undefined;
  let runtimeLoads = 0;
  let firstRequests = 0;
  let secondRequests = 0;
  let hotChecks = 0;
  const moduleCensuses: Set<string>[] = [];

  const loadRuntime = async (): Promise<Runtime> => {
    if (runtime) {
      return runtime;
    }

    runtimeLoads++;
    runtime = module
      ? ((await import(pathToFileURL(outputPath).href)) as Runtime)
      : (nativeRequire(outputPath) as Runtime);
    return runtime;
  };

  const successfulCompileBridge: RsbuildPlugin = {
    name: `node-lazy-runtime-${extension}`,
    setup(api) {
      api.onAfterEnvironmentCompile(async ({ stats }) => {
        if (!stats || stats.hasErrors()) {
          return;
        }

        moduleCensuses.push(
          new Set(
            [...stats.compilation.modules]
              .filter(
                (compiledModule) =>
                  compiledModule instanceof rspack.NormalModule,
              )
              .map((compiledModule) => compiledModule.resource),
          ),
        );
        if (!runtime) {
          return;
        }

        const compilationHash = stats.hash;
        if (!compilationHash) {
          throw new Error('Successful compilation did not produce a hash');
        }
        while (runtime.getHash() !== compilationHash) {
          const previousHash = runtime.getHash();
          const updatedModules = await runtime.applyUpdate();
          if (!updatedModules) {
            throw new Error(
              `No hot update can advance ${runtime.getHash()} to ${compilationHash}`,
            );
          }
          if (runtime.getHash() === previousHash) {
            throw new Error(
              `Hot update did not advance runtime ${previousHash} toward ${compilationHash}`,
            );
          }
        }
        hotChecks++;
      });
    },
  };

  try {
    const rsbuild = await devOnly({
      config: {
        plugins: [successfulCompileBridge],
        server: {
          port: 0,
          setup: ({ action, server }) => {
            if (action !== 'dev') {
              return;
            }

            server.middlewares.use(async (req, res, next) => {
              const pathname = req.url
                ? new URL(req.url, 'http://localhost').pathname
                : '';
              if (
                req.method !== 'GET' ||
                !['/first', '/second'].includes(pathname)
              ) {
                next();
                return;
              }

              try {
                const retainedRuntime = await loadRuntime();
                const result =
                  pathname === '/first'
                    ? await retainedRuntime.loadFirst()
                    : await retainedRuntime.loadSecond();
                if (pathname === '/first') {
                  firstRequests++;
                } else {
                  secondRequests++;
                }
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(result));
              } catch (error) {
                res.statusCode = 500;
                res.end(String(error));
              }
            });
          },
        },
        source: {
          entry: {
            index: join(sourceDir, 'index.js'),
          },
          define: { __NODE_LAZY_STATE_KEY__: JSON.stringify(stateKey) },
        },
        output: {
          target: 'node',
          module,
          assetPrefix: module ? 'auto' : undefined,
          cleanDistPath: true,
          distPath: {
            root: `dist/${extension}`,
            js: '',
          },
          filename: {
            js: `[name].${extension}`,
          },
        },
        dev: {
          writeToDisk: true,
          client: { host: 'client.example', port: 1234, protocol: 'wss' },
          lazyCompilation: {
            node: true,
            imports: true,
            entries: false,
            serverUrl: module ? 'http://localhost:<port>' : undefined,
          },
        },
        tools: {
          rspack: {
            output: {
              publicPath: 'auto',
              ...(module
                ? {}
                : {
                    hotUpdateChunkFilename: '[id].[fullhash].hot-update.cjs',
                  }),
            },
          },
        },
      },
    });

    expect(moduleCensuses).toHaveLength(1);
    expect(moduleCensuses[0].has(join(sourceDir, 'index.js'))).toBe(true);
    expect(moduleCensuses[0].has(join(sourceDir, 'first.js'))).toBe(false);
    expect(moduleCensuses[0].has(join(sourceDir, 'second.js'))).toBe(false);

    const firstResponse = await fetch(
      `http://localhost:${rsbuild.port}/first`,
      {
        signal: AbortSignal.any([
          requestController.signal,
          AbortSignal.timeout(15_000),
        ]),
      },
    );
    expect(firstResponse.status).toBe(200);
    expect(await firstResponse.json()).toEqual({
      value: 'first lazy result',
      entryExecutions: 1,
      firstExecutions: 1,
      firstHandlers: 1,
      firstUpdates: 0,
      secondExecutions: 0,
      secondHandlers: 0,
    });
    expect(runtimeLoads).toBe(1);
    expect(firstRequests).toBe(1);
    expect(secondRequests).toBe(0);
    expect(hotChecks).toBe(1);
    expect(moduleCensuses[1].has(join(sourceDir, 'first.js'))).toBe(true);
    expect(moduleCensuses[1].has(join(sourceDir, 'second.js'))).toBe(false);
    expect(evaluations.entryExecutions).toBe(1);
    expect(evaluations.firstExecutions).toBe(1);
    expect(evaluations.secondExecutions).toBe(0);

    await editFile(join(sourceDir, 'value.js'), (code) =>
      code.replace('first lazy result', 'edited lazy result'),
    );
    await waitFor(() => hotChecks === 2 && evaluations.firstUpdates === 1);
    const editedResponse = await fetch(
      `http://localhost:${rsbuild.port}/first`,
      {
        signal: AbortSignal.any([
          requestController.signal,
          AbortSignal.timeout(15_000),
        ]),
      },
    );
    expect(editedResponse.status).toBe(200);
    expect(await editedResponse.json()).toEqual({
      value: 'edited lazy result',
      entryExecutions: 1,
      firstExecutions: 1,
      firstHandlers: 2,
      firstUpdates: 1,
      secondExecutions: 0,
      secondHandlers: 0,
    });
    expect(moduleCensuses[2].has(join(sourceDir, 'second.js'))).toBe(false);

    const secondResponse = await fetch(
      `http://localhost:${rsbuild.port}/second`,
      {
        signal: AbortSignal.any([
          requestController.signal,
          AbortSignal.timeout(15_000),
        ]),
      },
    );
    expect(secondResponse.status).toBe(200);
    expect(await secondResponse.json()).toEqual({
      value: 'second lazy result',
      entryExecutions: 1,
      firstExecutions: 1,
      firstHandlers: 2,
      firstUpdates: 1,
      secondExecutions: 1,
      secondHandlers: 1,
    });
    expect(runtimeLoads).toBe(1);
    expect(firstRequests).toBe(2);
    expect(secondRequests).toBe(1);
    expect(hotChecks).toBe(3);
    expect(moduleCensuses[3].has(join(sourceDir, 'first.js'))).toBe(true);
    expect(moduleCensuses[3].has(join(sourceDir, 'second.js'))).toBe(true);
    expect(evaluations.entryExecutions).toBe(1);
    expect(evaluations.firstExecutions).toBe(1);
    expect(evaluations.secondExecutions).toBe(1);
  } finally {
    requestController.abort();
    if (!module && runtimeLoads > 0) {
      delete nativeRequire.cache[nativeRequire.resolve(outputPath)];
    }
    runtime = undefined;
    Reflect.deleteProperty(process, stateKey);
  }
};

test('should resume Node lazy imports in one retained CommonJS runtime', async ({
  cwd,
  devOnly,
  copySrcDir,
  editFile,
}) => {
  const sourceDir = await copySrcDir();
  await runRuntimeCase(
    { cwd, devOnly, sourceDir, editFile },
    { module: false, extension: 'cjs' },
  );
});

test('should resume Node lazy imports in one retained ES module runtime', async ({
  cwd,
  devOnly,
  copySrcDir,
  editFile,
}) => {
  const sourceDir = await copySrcDir();
  await runRuntimeCase(
    { cwd, devOnly, sourceDir, editFile },
    { module: true, extension: 'mjs' },
  );
});

for (const mode of ['production', 'none'] as const) {
  test(`should reject Node lazy compilation in ${mode} mode before compiling`, async ({
    devOnly,
  }) => {
    await expect(
      devOnly({
        config: {
          mode,
          output: { target: 'node' },
          dev: { lazyCompilation: { node: true } },
        },
      }),
    ).rejects.toThrow('Node lazy compilation requires mode: "development"');
  });
}
