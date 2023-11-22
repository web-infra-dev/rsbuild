import webpack from 'webpack';
import {
  setupServerHooks,
  isClientCompiler,
  mergeDevOptions,
  formatRoutes,
  printServerURLs,
} from '../src/devServer';

test('formatRoutes', () => {
  expect(
    formatRoutes({
      index: 'src/index.ts',
      foo: 'src/index.ts',
      bar: 'src/index.ts',
    }),
  ).toEqual([
    {
      name: 'index',
      route: '',
    },
    {
      name: 'foo',
      route: 'foo',
    },
    {
      name: 'bar',
      route: 'bar',
    },
  ]);

  expect(
    formatRoutes({
      foo: 'src/index.ts',
      bar: 'src/index.ts',
      index: 'src/index.ts',
    }),
  ).toEqual([
    {
      name: 'index',
      route: '',
    },
    {
      name: 'foo',
      route: 'foo',
    },
    {
      name: 'bar',
      route: 'bar',
    },
  ]);

  expect(
    formatRoutes({
      foo: 'src/index.ts',
    }),
  ).toEqual([
    {
      name: 'foo',
      route: 'foo',
    },
  ]);

  expect(
    formatRoutes(
      {
        index: 'src/index.ts',
        foo: 'src/index.ts',
        bar: 'src/index.ts',
      },
      'html',
    ),
  ).toEqual([
    {
      name: 'index',
      route: 'html/',
    },
    {
      name: 'foo',
      route: 'html/foo',
    },
    {
      name: 'bar',
      route: 'html/bar',
    },
  ]);
});

test('printServerURLs', () => {
  let message: string;
  const logger = {
    log: (msg: string) => {
      message = msg;
    },
  };

  printServerURLs(
    [
      {
        url: 'http://localhost:8080',
        label: 'local',
      },
      {
        url: 'http://10.94.62.193:8080/',
        label: 'network',
      },
    ],
    [
      {
        name: 'index',
        route: '',
      },
    ],
    // @ts-expect-error
    logger,
  );

  expect(message!).toMatchInlineSnapshot(`
    "  > local     http:/localhost:8080/
      > network   http:/10.94.62.193:8080/
    "
  `);

  printServerURLs(
    [
      {
        url: 'http://localhost:8080',
        label: 'local',
      },
      {
        url: 'http://10.94.62.193:8080/',
        label: 'network',
      },
    ],
    [
      {
        name: 'index',
        route: '',
      },
      {
        name: 'foo',
        route: 'html/foo',
      },
      {
        name: 'bar',
        route: 'bar',
      },
    ],
    // @ts-expect-error
    logger,
  );

  expect(message!).toMatchInlineSnapshot(`
    "  > local
        ○  index        http:/localhost:8080/
        ○  foo          http:/localhost:8080/html/foo
        ○  bar          http:/localhost:8080/bar
      > network
        ○  index        http:/10.94.62.193:8080/
        ○  foo          http:/10.94.62.193:8080/html/foo
        ○  bar          http:/10.94.62.193:8080/bar
    "
  `);
});

describe('test dev server', () => {
  test('should setupServerHooks correctly', () => {
    const compiler = webpack({});
    const onDoneFn = vi.fn();
    const onInvalidFn = vi.fn();

    setupServerHooks(compiler, {
      onDone: onDoneFn,
      onInvalid: onInvalidFn,
    });

    const isOnDoneRegistered = compiler.hooks.done.taps.some(
      (tap) => tap.fn === onDoneFn,
    );

    expect(isOnDoneRegistered).toBeTruthy();

    const isCompileHookRegistered = compiler.hooks.compile.taps.some(
      (tap) => tap.fn === onInvalidFn,
    );

    expect(isCompileHookRegistered).toBeTruthy();

    const isInvalidHookRegistered = compiler.hooks.invalid.taps.some(
      (tap) => tap.fn === onInvalidFn,
    );

    expect(isInvalidHookRegistered).toBeTruthy();
  });
  test('should not setupServerHooks when compiler is server', () => {
    const compiler = webpack({
      name: 'server',
    });
    const onDoneFn = vi.fn();
    const onInvalidFn = vi.fn();

    setupServerHooks(compiler, {
      onDone: onDoneFn,
      onInvalid: onInvalidFn,
    });

    const isOnDoneRegistered = compiler.hooks.done.taps.some(
      (tap) => tap.fn === onDoneFn,
    );

    expect(isOnDoneRegistered).toBeFalsy();
  });

  test('check isClientCompiler', () => {
    expect(isClientCompiler(webpack({}))).toBeTruthy();

    expect(
      isClientCompiler(
        webpack({
          target: ['web', 'es5'],
        }),
      ),
    ).toBeTruthy();

    expect(
      isClientCompiler(
        webpack({
          target: 'node',
        }),
      ),
    ).toBeFalsy();

    expect(
      isClientCompiler(
        webpack({
          target: ['node'],
        }),
      ),
    ).toBeFalsy();
  });

  test('getDevServerOptions', async () => {
    expect(
      mergeDevOptions({
        rsbuildConfig: {},
        port: 8080,
      }),
    ).toMatchInlineSnapshot(`
      {
        "client": {
          "host": "",
          "path": "/rsbuild-hmr",
          "port": "8080",
          "protocol": "",
        },
        "devMiddleware": {
          "writeToDisk": [Function],
        },
      }
    `);

    expect(
      mergeDevOptions({
        rsbuildConfig: {
          dev: {
            hmr: false,
            client: {
              host: '',
              path: '',
            },
          },
        },
        port: 8081,
      }),
    ).toMatchInlineSnapshot(`
      {
        "client": {
          "host": "",
          "path": "",
          "port": "8081",
          "protocol": "",
        },
        "devMiddleware": {
          "writeToDisk": [Function],
        },
        "hmr": false,
      }
    `);
  });
});
