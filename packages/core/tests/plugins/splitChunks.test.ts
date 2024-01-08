import { createStubRsbuild } from '@rsbuild/test-helper';
import {
  pluginSplitChunks,
  MODULE_PATH_REGEX,
  getPackageNameFromModulePath,
} from '@src/plugins/splitChunks';
import type { RsbuildConfig } from '@rsbuild/shared';

describe('plugin-split-chunks', () => {
  const cases: Array<{ name: string; rsbuildConfig: RsbuildConfig }> = [
    {
      name: 'should set split-by-experience config',
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
    },
    {
      name: 'should set split-by-experience config correctly when polyfill is off',
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
    },
    {
      name: 'should set split-by-module config',
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
    },
    {
      name: 'should set single-vendor config',
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
    },
    {
      name: 'should set single-size config',
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
    },
    {
      name: 'should set all-in-one config',
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
    },
    {
      name: 'should set custom config',
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
    },
    {
      name: 'should allow forceSplitting to be an object',
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
    },
    {
      name: 'should not split chunks when target is not',
      rsbuildConfig: {
        output: {
          targets: ['node'],
        },
      },
    },
  ];

  it.each(cases)('$name', async (item) => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginSplitChunks()],
      rsbuildConfig: item.rsbuildConfig || {
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
});

describe('getPackageNameFromModulePath', () => {
  it('should parse correct path fragment in npm/yarn', async () => {
    let modulePath = '/path/to/node_modules/@scope/package-name/index.js';
    let [, , scope, name] = modulePath.match(MODULE_PATH_REGEX)!;
    expect(scope).toBe('@scope');
    expect(name).toBe('package-name');

    modulePath = '/path/to/node_modules/package-name/index.js';
    [, , scope, name] = modulePath.match(MODULE_PATH_REGEX)!;
    expect(scope).toBe(undefined);
    expect(name).toBe('package-name');
  });

  it('should parse correct path fragment in pnpm', async () => {
    let modulePath = '/path/to/node_modules/.pnpm/@scope/package-name/index.js';
    let [, , scope, name] = modulePath.match(MODULE_PATH_REGEX)!;
    expect(scope).toBe('@scope');
    expect(name).toBe('package-name');

    modulePath = '/path/to/node_modules/.pnpm/package-name/index.js';
    [, , scope, name] = modulePath.match(MODULE_PATH_REGEX)!;
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
    let modulePath = '/path/to/node_modules/.pnpm/@scope/package-name/index.js';
    expect(getPackageNameFromModulePath(modulePath)).toBe(
      'npm.scope.package-name',
    );

    modulePath = '/path/to/node_modules/.pnpm/package-name/index.js';
    expect(getPackageNameFromModulePath(modulePath)).toBe('npm.package-name');
  });
});
