import { pluginOutput } from '@/plugins/output';
import { createStubRsbuild } from '../helper';

describe('plugin-output', () => {
  it('should set output correctly', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginOutput()],
    });

    const config = await rsbuild.unwrapWebpackConfig();
    expect(config).toMatchSnapshot();
  });

  it('should allow to custom server directory with distPath.server', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginOutput()],
      target: ['node'],
      rsbuildConfig: {
        output: {
          distPath: {
            server: 'server',
          },
        },
      },
    });

    const config = await rsbuild.unwrapWebpackConfig();
    expect(config).toMatchSnapshot();
  });

  it('should allow to set distPath.js and distPath.css to empty string', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginOutput()],
      rsbuildConfig: {
        output: {
          distPath: {
            js: '',
            css: '',
          },
        },
      },
    });

    const config = await rsbuild.unwrapWebpackConfig();
    expect(config).toMatchSnapshot();
  });

  it('should allow to use filename.js to modify filename', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginOutput()],
      rsbuildConfig: {
        output: {
          filename: {
            js: 'foo.js',
          },
        },
      },
    });

    const config = await rsbuild.unwrapWebpackConfig();
    expect(config).toMatchSnapshot();
  });
});
