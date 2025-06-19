import { createStubRsbuild } from '@scripts/test-helper';
import {
  getPackageNameFromModulePath,
  MODULE_PATH_REGEX,
  pluginSplitChunks,
} from '../src/plugins/splitChunks';

describe('plugin-split-chunks', () => {
  it('should set split-by-experience config', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginSplitChunks()],
      rsbuildConfig: {
        performance: {
          chunkSplit: {
            strategy: 'split-by-experience',
          },
        },
        output: {
          polyfill: 'entry',
        },
      },
    });

    const config = await rsbuild.unwrapConfig();
    expect(config).toMatchSnapshot();
  });

  it('should set split-by-experience config correctly when polyfill is off', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginSplitChunks()],
      rsbuildConfig: {
        performance: {
          chunkSplit: {
            strategy: 'split-by-experience',
          },
        },
        output: {
          polyfill: 'off',
        },
      },
    });

    const config = await rsbuild.unwrapConfig();
    expect(config).toMatchSnapshot();
  });

  it('should set split-by-module config', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginSplitChunks()],
      rsbuildConfig: {
        performance: {
          chunkSplit: {
            strategy: 'split-by-module',
          },
        },
        output: {
          polyfill: 'entry',
        },
      },
    });

    const config = await rsbuild.unwrapConfig();
    expect(config).toMatchSnapshot();
  });

  it('should set single-vendor config', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginSplitChunks()],
      rsbuildConfig: {
        performance: {
          chunkSplit: {
            strategy: 'single-vendor',
          },
        },
        output: {
          polyfill: 'entry',
        },
      },
    });

    const config = await rsbuild.unwrapConfig();
    expect(config).toMatchSnapshot();
  });

  it('should set single-size config', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginSplitChunks()],
      rsbuildConfig: {
        performance: {
          chunkSplit: {
            strategy: 'split-by-size',
            minSize: 1000,
            maxSize: 5000,
          },
        },
        output: {
          polyfill: 'entry',
        },
      },
    });

    const config = await rsbuild.unwrapConfig();
    expect(config).toMatchSnapshot();
  });

  it('should set all-in-one config', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginSplitChunks()],
      rsbuildConfig: {
        performance: {
          chunkSplit: {
            strategy: 'all-in-one',
          },
        },
        output: {
          polyfill: 'entry',
        },
      },
    });

    const config = await rsbuild.unwrapConfig();
    expect(config).toMatchSnapshot();
  });

  it('should set custom config', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginSplitChunks()],
      rsbuildConfig: {
        performance: {
          chunkSplit: {
            strategy: 'custom',
            forceSplitting: [/react/],
            splitChunks: {
              cacheGroups: {},
            },
          },
        },
        output: {
          polyfill: 'entry',
        },
      },
    });

    const config = await rsbuild.unwrapConfig();
    expect(config).toMatchSnapshot();
  });

  it('should allow forceSplitting to be an object', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginSplitChunks()],
      rsbuildConfig: {
        performance: {
          chunkSplit: {
            strategy: 'custom',
            forceSplitting: {
              axios: /axios/,
            },
            splitChunks: {
              cacheGroups: {},
            },
          },
        },
        output: {
          polyfill: 'entry',
        },
      },
    });

    const config = await rsbuild.unwrapConfig();
    expect(config).toMatchSnapshot();
  });

  it('should not split chunks when target is node', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginSplitChunks()],
      rsbuildConfig: {
        output: {
          target: 'node',
        },
      },
    });

    const config = await rsbuild.unwrapConfig();
    expect(config).toMatchSnapshot();
  });
});

describe('getPackageNameFromModulePath', () => {
  it('should parse correct path fragment in npm/yarn', async () => {
    let modulePath = '/path/to/node_modules/@scope/package-name/index.js';
    let [, scope, name] = modulePath.match(MODULE_PATH_REGEX)!;
    expect(scope).toBe('@scope');
    expect(name).toBe('package-name');

    modulePath = '/path/to/node_modules/package-name/index.js';
    [, scope, name] = modulePath.match(MODULE_PATH_REGEX)!;
    expect(scope).toBe(undefined);
    expect(name).toBe('package-name');
  });

  it('should parse correct path fragment in pnpm', async () => {
    let modulePath =
      '/path/to/node_modules/.pnpm/@scope+package-name@1.0.0/node_modules/@scope/package-name/index.js';
    let [, scope, name] = modulePath.match(MODULE_PATH_REGEX)!;
    expect(scope).toBe('@scope');
    expect(name).toBe('package-name');

    modulePath =
      '/path/to/node_modules/.pnpm/package-name@1.0.0/node_modules/package-name/index.js';
    [, scope, name] = modulePath.match(MODULE_PATH_REGEX)!;
    expect(scope).toBe(undefined);
    expect(name).toBe('package-name');
  });

  it('should return correct package name in npm/yarn', () => {
    let modulePath = '/path/to/node_modules/@scope/package-name/index.js';
    expect(getPackageNameFromModulePath(modulePath)).toBe(
      'npm.scope.package-name',
    );

    modulePath = '/path/to/node_modules/package-name/index.js';
    expect(getPackageNameFromModulePath(modulePath)).toBe('npm.package-name');
  });

  it('should return correct package name in pnpm', () => {
    let modulePath =
      '/path/to/node_modules/.pnpm/@scope+package-name@1.0.0/node_modules/@scope/package-name/index.js';
    expect(getPackageNameFromModulePath(modulePath)).toBe(
      'npm.scope.package-name',
    );

    modulePath =
      '/path/to/node_modules/.pnpm/package-name@1.0.0/node_modules/package-name/index.js';
    expect(getPackageNameFromModulePath(modulePath)).toBe('npm.package-name');
  });
});
