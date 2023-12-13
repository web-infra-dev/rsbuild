import { pluginMainFields } from '../src/shared/plugins/mainFields';
import { createStubRsbuild } from '../../webpack/tests/helper';

describe('plugin-main-fields', () => {
  it('should support custom webpack resolve.mainFields', async () => {
    const mainFieldsOption = ['main', 'test', 'browser', ['module', 'exports']];

    const rsbuild = await createStubRsbuild({
      plugins: [pluginMainFields(mainFieldsOption)],
    });
    const config = await rsbuild.unwrapWebpackConfig();

    const mainFieldsResult = ['main', 'test', 'browser', 'module', 'exports'];
    expect(config.resolve?.mainFields).toEqual(mainFieldsResult);
  });

  it('should support custom webpack resolve.mainFields by target', async () => {
    const mainFieldsOption = {
      web: ['main', 'browser'],
      node: ['main', 'node'],
    };

    const rsbuild = await createStubRsbuild({
      plugins: [pluginMainFields(mainFieldsOption)],
    });
    const config = await rsbuild.unwrapWebpackConfig();

    expect(config.resolve?.mainFields).toEqual(mainFieldsOption.web);
  });
});
