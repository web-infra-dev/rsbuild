import { expect, describe, it } from 'vitest';
import { createStubRsbuild } from '@rsbuild/webpack/stub';
import { pluginEsbuild } from '../src';

describe('plugins/esbuild', () => {
  it('should set esbuild-loader', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginEsbuild()],
      rsbuildConfig: {},
    });
    const config = await rsbuild.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it('should set esbuild minimizer in production', async () => {
    process.env.NODE_ENV = 'production';
    const rsbuild = await createStubRsbuild({
      plugins: [pluginEsbuild()],
      rsbuildConfig: {},
    });
    const config = await rsbuild.unwrapWebpackConfig();
    expect(config).toMatchSnapshot();

    process.env.NODE_ENV = 'test';
  });

  it('should not set format iife when target is not web', async () => {
    process.env.NODE_ENV = 'production';
    const rsbuild = await createStubRsbuild({
      plugins: [pluginEsbuild()],
      rsbuildConfig: {},
      target: 'node',
    });
    const config = await rsbuild.unwrapWebpackConfig();
    expect(config).toMatchSnapshot();

    process.env.NODE_ENV = 'test';
  });
});
