import { FONT_EXTENSIONS } from '@rsbuild/shared';
import { createStubRsbuild } from '@scripts/test-helper';
import { pluginAsset, getRegExpForExts } from '@src/plugins/asset';

describe('getRegExpForExts', () => {
  it('should get correct RegExp of exts', () => {
    expect(getRegExpForExts(['woff'])).toEqual(/\.woff$/i);

    expect(getRegExpForExts(FONT_EXTENSIONS)).toEqual(
      /\.(?:woff|woff2|eot|ttf|otf|ttc)$/i,
    );
  });
});

describe('plugin-asset(image)', () => {
  const cases = [
    {
      name: 'should add image rules correctly',
      rsbuildConfig: {},
    },
    {
      name: 'should allow to use distPath.image to modify dist path',
      rsbuildConfig: {
        output: {
          distPath: {
            image: 'foo',
          },
        },
      },
    },
    {
      name: 'should allow to use distPath.image to be empty string',
      rsbuildConfig: {
        output: {
          distPath: {
            image: '',
          },
        },
      },
    },
    {
      name: 'should allow to use filename.image to modify filename',
      rsbuildConfig: {
        output: {
          filename: {
            image: 'foo[ext]',
          },
        },
      },
    },
  ];

  it.each(cases)('$name', async (item) => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginAsset()],
      rsbuildConfig: item.rsbuildConfig,
    });

    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });
});
