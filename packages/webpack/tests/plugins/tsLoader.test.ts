import { pluginTsLoader } from '@/plugins/tsLoader';
import { createStubRsbuild } from '../helper';

describe('plugin-ts-loader', () => {
  it('should set ts-loader', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginTsLoader()],
      rsbuildConfig: {
        tools: {
          tsLoader: {},
        },
      },
    });
    const config = await rsbuild.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it('should set include/exclude', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginTsLoader()],
      rsbuildConfig: {
        tools: {
          tsLoader(options, { addIncludes, addExcludes }) {
            addIncludes(['src/**/*.ts']);
            addExcludes(['src/**/*.js']);
            return options;
          },
        },
      },
    });
    const config = await rsbuild.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });
});
