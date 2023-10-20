import { expect, describe, it } from 'vitest';
import { createStubRsbuild } from '@rsbuild/vitest-helper';
import { webpackProvider } from '@rsbuild/webpack';
import { pluginEsbuild } from '../src';

describe('plugins/esbuild', () => {
  it('should set esbuild-loader', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginEsbuild()],
      rsbuildConfig: {},
      provider: webpackProvider,
    });
    const configs = await rsbuild.initConfigs();

    expect(configs[0]).toMatchSnapshot();
  });

  it('should set esbuild minimizer in production', async () => {
    process.env.NODE_ENV = 'production';
    const rsbuild = await createStubRsbuild({
      plugins: [pluginEsbuild()],
      rsbuildConfig: {},
      provider: webpackProvider,
    });
    const configs = await rsbuild.initConfigs();
    expect(configs[0]).toMatchSnapshot();

    process.env.NODE_ENV = 'test';
  });

  it('should not set format iife when target is not web', async () => {
    process.env.NODE_ENV = 'production';
    const rsbuild = await createStubRsbuild({
      plugins: [pluginEsbuild()],
      rsbuildConfig: {},
      target: 'node',
      provider: webpackProvider,
    });
    const configs = await rsbuild.initConfigs();
    expect(configs[0]).toMatchSnapshot();

    process.env.NODE_ENV = 'test';
  });
});
