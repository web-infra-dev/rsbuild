import { createStubRsbuild } from '@scripts/test-helper';
import { pluginCheckSyntax } from '../src/index';

beforeAll(() => {
  const { NODE_ENV } = process.env;
  process.env.NODE_ENV = 'production';

  return () => {
    process.env.NODE_ENV = NODE_ENV;
  };
});

describe('plugin-check-syntax', () => {
  it('should add check-syntax plugin properly', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginCheckSyntax()],
    });

    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });

  it('should not add check-syntax plugin when target node', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginCheckSyntax()],
      rsbuildConfig: {
        output: {
          target: 'node',
        },
      },
    });

    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });

  it('should use default browserslist as targets when only set checkSyntax.exclude', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [
        pluginCheckSyntax({
          exclude: [/$.html/],
        }),
      ],
      rsbuildConfig: {
        output: {
          overrideBrowserslist: [
            'iOS 9',
            'Android 4.4',
            'last 2 versions',
            '> 0.2%',
            'not dead',
          ],
        },
      },
    });

    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });
});
