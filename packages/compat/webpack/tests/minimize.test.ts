import { pluginMinimize } from '../src/plugins/minimize';
import { createStubRsbuild } from './helper';

describe('plugin-minimize', () => {
  it('should not apply minimizer in development', async () => {
    process.env.NODE_ENV = 'development';

    const rsbuild = await createStubRsbuild({
      plugins: [pluginMinimize()],
    });

    const config = await rsbuild.unwrapConfig();
    expect(config.optimization?.minimize).toEqual(false);

    process.env.NODE_ENV = 'test';
  });

  it('should apply minimizer in production', async () => {
    process.env.NODE_ENV = 'production';

    const rsbuild = await createStubRsbuild({
      plugins: [pluginMinimize()],
    });

    const config = await rsbuild.unwrapConfig();
    expect(config.optimization).toMatchSnapshot();

    process.env.NODE_ENV = 'test';
  });

  it('should not apply minimizer when output.disableMinimize is true', async () => {
    process.env.NODE_ENV = 'production';

    const rsbuild = await createStubRsbuild({
      plugins: [pluginMinimize()],
      rsbuildConfig: {
        output: {
          disableMinimize: true,
        },
      },
    });

    const config = await rsbuild.unwrapConfig();
    expect(config.optimization?.minimize).toEqual(false);

    process.env.NODE_ENV = 'test';
  });

  it('should not extractComments when output.legalComments is inline', async () => {
    process.env.NODE_ENV = 'production';

    const rsbuild = await createStubRsbuild({
      plugins: [pluginMinimize()],
      rsbuildConfig: {
        output: {
          legalComments: 'inline',
        },
      },
    });

    const config = await rsbuild.unwrapConfig();
    expect(JSON.stringify(config.optimization)).toContain(
      '"extractComments":false',
    );
    expect(JSON.stringify(config.optimization)).not.toContain(
      '"comments":false',
    );

    process.env.NODE_ENV = 'test';
  });

  it('should remove all comments when output.legalComments is none', async () => {
    process.env.NODE_ENV = 'production';

    const rsbuild = await createStubRsbuild({
      plugins: [pluginMinimize()],
      rsbuildConfig: {
        output: {
          legalComments: 'none',
        },
      },
    });

    const config = await rsbuild.unwrapConfig();
    expect(JSON.stringify(config.optimization)).toContain(
      '"extractComments":false',
    );
    expect(JSON.stringify(config.optimization)).toContain('"comments":false');

    process.env.NODE_ENV = 'test';
  });

  it('should not enable ascii_only when output.charset is utf8', async () => {
    process.env.NODE_ENV = 'production';

    const rsbuild = await createStubRsbuild({
      plugins: [pluginMinimize()],
      rsbuildConfig: {
        output: {
          charset: 'utf8',
        },
      },
    });

    const config = await rsbuild.unwrapConfig();
    expect(JSON.stringify(config.optimization)).toContain('"ascii_only":false');

    process.env.NODE_ENV = 'test';
  });
});
