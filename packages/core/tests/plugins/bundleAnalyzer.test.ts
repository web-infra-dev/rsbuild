import { expect, describe, it } from 'vitest';
import { createStubRsbuild } from '@rsbuild/test-helper';
import { pluginBundleAnalyzer } from '@src/plugins/bundleAnalyzer';

describe('plugins/bundleAnalyze', () => {
  it('should add bundle analyze plugin', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginBundleAnalyzer()],
      rsbuildConfig: {
        performance: {
          bundleAnalyze: {
            reportFilename: 'index$$.html',
          },
        },
      },
    });

    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });
});
