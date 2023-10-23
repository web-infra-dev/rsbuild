import { expect, describe, it } from 'vitest';
import { createStubRsbuild } from '@rsbuild/test-helper';
import { pluginCheckSyntax } from '@src/plugins/checkSyntax';

beforeAll(() => {
  const { NODE_ENV } = process.env;
  process.env.NODE_ENV = 'production';

  return () => {
    process.env.NODE_ENV = NODE_ENV;
  };
});

describe('plugins/check-syntax', () => {
  it('should add check-syntax plugin properly', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginCheckSyntax()],
      rsbuildConfig: {
        security: {
          checkSyntax: true,
        },
      },
    });

    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });

  it('should not add check-syntax plugin when target node', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginCheckSyntax()],
      rsbuildConfig: {
        security: {
          checkSyntax: true,
        },
      },
      target: 'node',
    });

    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });

  it('should use default browserlist as targets when only set checksyntax.exclude', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginCheckSyntax()],
      rsbuildConfig: {
        security: {
          checkSyntax: {
            exclude: [/$.html/],
          },
        },
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
