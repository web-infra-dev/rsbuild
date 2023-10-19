import { expect, describe, it, vi, SpyInstance } from 'vitest';
import { isFileExists } from '@rsbuild/shared';
import { pluginResolve } from '@/plugins/resolve';
import { createStubBuilder } from '@rsbuild/vitest-helper';
import { rspackProvider } from '@/index';

// vitest doesn't support mock require(), to avoid load @rsbuild/shared by require, we should pass rspackProvider as param
vi.mock('@rsbuild/shared', async (importOriginal) => {
  const mod = await importOriginal<any>();
  return {
    ...mod,
    isFileExists: vi.fn(),
  };
});

describe('plugins/resolve', () => {
  it('should apply default extensions correctly', async () => {
    (isFileExists as unknown as SpyInstance).mockImplementationOnce(() =>
      Promise.resolve(false),
    );
    const builder = await createStubBuilder({
      plugins: [pluginResolve()],
      provider: rspackProvider,
    });

    const bundlerConfigs = await builder.initConfigs();

    expect(bundlerConfigs[0].resolve?.extensions).toEqual([
      '.js',
      '.jsx',
      '.mjs',
      '.json',
    ]);
    expect(bundlerConfigs[0].resolve?.tsConfigPath).toBeUndefined();
  });

  it('should apply default extensions correctly and tsConfigPath with ts', async () => {
    (isFileExists as unknown as SpyInstance).mockImplementationOnce(() =>
      Promise.resolve(true),
    );

    const builder = await createStubBuilder({
      plugins: [pluginResolve()],
      provider: rspackProvider,
    });

    const bundlerConfigs = await builder.initConfigs();

    expect(bundlerConfigs[0].resolve?.extensions).toEqual([
      '.ts',
      '.tsx',
      '.js',
      '.jsx',
      '.mjs',
      '.json',
    ]);
    expect(bundlerConfigs[0].resolve?.tsConfigPath).toBeDefined();
  });

  it('should not apply tsConfigPath when aliasStrategy is "prefer-alias"', async () => {
    (isFileExists as unknown as SpyInstance).mockImplementationOnce(() =>
      Promise.resolve(true),
    );

    const builder = await createStubBuilder({
      plugins: [pluginResolve()],
      provider: rspackProvider,
      builderConfig: {
        source: {
          aliasStrategy: 'prefer-alias',
        },
      },
    });

    const bundlerConfigs = await builder.initConfigs();

    expect(bundlerConfigs[0].resolve?.tsConfigPath).toBeUndefined();
  });

  it('should allow to use source.alias to config alias', async () => {
    const builder = await createStubBuilder({
      plugins: [pluginResolve()],
      provider: rspackProvider,
      builderConfig: {
        source: {
          alias: {
            foo: 'bar',
          },
        },
      },
    });
    const bundlerConfigs = await builder.initConfigs();

    expect(bundlerConfigs[0].resolve?.alias).toEqual({
      foo: 'bar',
    });
  });

  it('should support source.alias to be a function', async () => {
    const builder = await createStubBuilder({
      plugins: [pluginResolve()],
      provider: rspackProvider,
      builderConfig: {
        source: {
          alias() {
            return {
              foo: 'bar',
            };
          },
        },
      },
    });
    const bundlerConfigs = await builder.initConfigs();

    expect(bundlerConfigs[0].resolve?.alias).toEqual({
      foo: 'bar',
    });
  });

  it('should support custom resolve.mainFields', async () => {
    const mainFieldsOption = ['main', 'test', 'browser', ['module', 'exports']];

    const builder = await createStubBuilder({
      plugins: [pluginResolve()],
      builderConfig: {
        source: {
          resolveMainFields: mainFieldsOption,
        },
      },
    });
    const bundlerConfigs = await builder.initConfigs();

    expect(bundlerConfigs[0].resolve?.mainFields).toEqual([
      'main',
      'test',
      'browser',
      'module',
      'exports',
    ]);
  });

  it('should support custom webpack resolve.mainFields by target', async () => {
    const mainFieldsOption = {
      web: ['main', 'browser'],
      node: ['main', 'node'],
    };

    const builder = await createStubBuilder({
      plugins: [pluginResolve()],
      builderConfig: {
        source: {
          resolveMainFields: mainFieldsOption,
        },
      },
    });
    const bundlerConfigs = await builder.initConfigs();

    expect(bundlerConfigs[0].resolve?.mainFields).toEqual(mainFieldsOption.web);
  });
});
