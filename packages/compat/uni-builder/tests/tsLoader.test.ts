import { pluginTsLoader } from '../src/webpack/plugins/tsLoader';
import { createStubRsbuild } from '../../webpack/tests/helper';

describe('plugin-ts-loader', () => {
  it('should set ts-loader', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginTsLoader()],
    });
    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });

  it('should set include/exclude', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [
        pluginTsLoader((options, { addIncludes, addExcludes }) => {
          addIncludes(['src/**/*.ts']);
          addExcludes(['src/**/*.js']);
          return options;
        }),
      ],
    });
    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });
});
