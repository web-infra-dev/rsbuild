import { expect, describe, it } from 'vitest';
import { createStubBuilder } from '@rsbuild/webpack/stub';
import { pluginEsbuild } from '../src';

describe('plugins/esbuild', () => {
  it('should set esbuild-loader', async () => {
    const builder = await createStubBuilder({
      plugins: [pluginEsbuild()],
      builderConfig: {},
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it('should set esbuild minimizer in production', async () => {
    process.env.NODE_ENV = 'production';
    const builder = await createStubBuilder({
      plugins: [pluginEsbuild()],
      builderConfig: {},
    });
    const config = await builder.unwrapWebpackConfig();
    expect(config).toMatchSnapshot();

    process.env.NODE_ENV = 'test';
  });

  it('should not set format iife when target is not web', async () => {
    process.env.NODE_ENV = 'production';
    const builder = await createStubBuilder({
      plugins: [pluginEsbuild()],
      builderConfig: {},
      target: 'node',
    });
    const config = await builder.unwrapWebpackConfig();
    expect(config).toMatchSnapshot();

    process.env.NODE_ENV = 'test';
  });
});
