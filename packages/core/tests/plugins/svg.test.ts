import { createStubRsbuild } from '@rsbuild/test-helper';
import { pluginSvg } from '@src/plugins/svg';

describe('plugin-svg', () => {
  const cases = [
    {
      name: 'should allow using output.dataUriLimit.svg to custom data uri limit',
      rsbuildConfig: {
        output: {
          dataUriLimit: {
            svg: 666,
          },
        },
      },
    },
    {
      name: 'should allow to use distPath.svg to modify dist path',
      rsbuildConfig: {
        output: {
          distPath: {
            svg: 'foo',
          },
        },
      },
    },
    {
      name: 'should allow to use filename.svg to modify filename',
      rsbuildConfig: {
        output: {
          filename: {
            svg: 'foo.svg',
          },
        },
      },
    },
  ];

  it.each(cases)('$name', async (item) => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginSvg()],
      rsbuildConfig: item.rsbuildConfig,
    });

    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });
});
