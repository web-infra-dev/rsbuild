import { createRsbuild } from '../src';

describe('inspectConfig', () => {
  it('should print plugin names when inspect config', async () => {
    process.env.NODE_ENV = 'development';
    const rsbuild = await createRsbuild({
      rsbuildConfig: {
        source: {
          entry: {
            index: './src/index.js',
          },
        },
      },
    });

    const {
      origin: { rsbuildConfig },
    } = await rsbuild.inspectConfig();

    expect(rsbuildConfig.pluginNames).toMatchSnapshot();
  });
});
