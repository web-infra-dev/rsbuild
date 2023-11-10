import webpack from 'webpack';
import {
  setupServerHooks,
  isClientCompiler,
  mergeDevOptions,
} from '../src/devServer';

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
          "path": "/webpack-hmr",
          "port": "8080",
          "protocol": "",
        },
        "compress": true,
        "devMiddleware": {
          "writeToDisk": [Function],
        },
        "port": 8080,
      }
    `);

    expect(
      mergeDevOptions({
        rsbuildConfig: {
          dev: {
            hmr: false,
            https: true,
            port: 8080,
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
        "compress": true,
        "devMiddleware": {
          "writeToDisk": [Function],
        },
        "hmr": false,
        "https": true,
        "port": 8081,
      }
    `);
  });
});
