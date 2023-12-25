import { createStubRsbuild } from '@rsbuild/test-helper';
import { webpackProvider } from '@rsbuild/webpack';
import { pluginEsbuild } from '../src';

describe('plugin-esbuild', () => {
  it('should set esbuild-loader', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginEsbuild()],
      rsbuildConfig: {
        provider: webpackProvider,
      },
    });
    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });

  it('should set esbuild minimizer in production', async () => {
    process.env.NODE_ENV = 'production';
    const rsbuild = await createStubRsbuild({
      plugins: [pluginEsbuild()],
      rsbuildConfig: {
        provider: webpackProvider,
      },
    });
    const config = await rsbuild.unwrapConfig();
    expect(config).toMatchSnapshot();

    process.env.NODE_ENV = 'test';
  });

  it('should not set format iife when target is not web', async () => {
    process.env.NODE_ENV = 'production';
    const rsbuild = await createStubRsbuild({
      plugins: [pluginEsbuild()],
      rsbuildConfig: {
        provider: webpackProvider,
        output: {
          targets: ['node'],
        },
      },
    });
    const config = await rsbuild.unwrapConfig();
    expect(config).toMatchSnapshot();

    process.env.NODE_ENV = 'test';
  });
});
