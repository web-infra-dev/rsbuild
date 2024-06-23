import { createRsbuild } from '@rsbuild/core';
import { pluginMdx } from '../src';

describe('plugin-mdx', () => {
  it('should register mdx loader correctly', async () => {
    const rsbuild = await createRsbuild({
      rsbuildConfig: {
        plugins: [pluginMdx()],
      },
    });

    const bundlerConfigs = await rsbuild.initConfigs();
    const mdxRule = bundlerConfigs[0].module?.rules?.find((item) => {
      return typeof item === 'object' && item?.test?.toString().includes('mdx');
    });

    expect(mdxRule).toMatchSnapshot();
  });

  it('should allow to configure mdx loader', async () => {
    const rsbuild = await createRsbuild({
      rsbuildConfig: {
        plugins: [
          pluginMdx({
            mdxLoaderOptions: {
              format: 'detect',
            },
          }),
        ],
      },
    });

    const bundlerConfigs = await rsbuild.initConfigs();
    const mdxRule = bundlerConfigs[0].module?.rules?.find((item) => {
      return typeof item === 'object' && item?.test?.toString().includes('mdx');
    });

    expect(mdxRule).toMatchSnapshot();
  });
});
