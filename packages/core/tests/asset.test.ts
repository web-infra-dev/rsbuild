import { createStubRsbuild } from '@scripts/test-helper';
import { FONT_EXTENSIONS } from '../src/constants';
import { getRegExpForExts, pluginAsset } from '../src/plugins/asset';

describe('getRegExpForExts', () => {
  it('should get correct RegExp of exts', () => {
    expect(getRegExpForExts(['woff'])).toEqual(/\.woff$/i);

    expect(getRegExpForExts(FONT_EXTENSIONS)).toEqual(
      /\.(?:woff|woff2|eot|ttf|otf|ttc)$/i,
    );
  });
});

describe('plugin-asset', () => {
  test('should add image rules correctly', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginAsset()],
    });

    const config = await rsbuild.unwrapConfig();
    expect(config).toMatchSnapshot();
  });

  test('should allow to use distPath.image to modify dist path', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginAsset()],
      config: {
        output: {
          distPath: {
            image: 'foo',
          },
        },
      },
    });

    const config = await rsbuild.unwrapConfig();
    expect(config).toMatchSnapshot();
  });

  test('should add image rules correctly', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginAsset()],
      config: {
        output: {
          distPath: {
            image: '',
          },
        },
      },
    });

    const config = await rsbuild.unwrapConfig();
    expect(config).toMatchSnapshot();
  });

  test('should allow to use filename.image to modify filename', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginAsset()],
      config: {
        output: {
          filename: {
            image: 'foo[ext]',
          },
        },
      },
    });

    const config = await rsbuild.unwrapConfig();
    expect(config).toMatchSnapshot();
  });
});
