import { isPlainObject } from '@rsbuild/shared';
import { pluginMdx } from '../src';
import { createRsbuild } from '@rsbuild/core';

describe('plugin-mdx', () => {
  it('should register mdx loader correctly', async () => {
    const rsbuild = await createRsbuild({
      rsbuildConfig: {
        plugins: [pluginMdx()],
      },
    });

    const bundlerConfigs = await rsbuild.initConfigs();
    const mdxRule = bundlerConfigs[0].module?.rules?.find((item) => {
      return isPlainObject(item) && item.test?.toString().includes('mdx');
    });

    expect(mdxRule).toMatchSnapshot();
  });
});
