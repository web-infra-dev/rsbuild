import { createStubRsbuild } from '../../compat/webpack/tests/helper';
import { pluginAssetsRetry } from '../src';

describe('plugin-assets-retry', () => {
  it('should add assets retry plugin', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginAssetsRetry()],
    });
    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });

  it("should't add assets retry plugin when target is set to 'node'", async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginAssetsRetry()],
      rsbuildConfig: {
        output: {
          targets: ['node'],
        },
      },
    });
    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });

  it('should accept user custom options', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [
        pluginAssetsRetry({
          max: 4,
          inlineScript: true,
          minify: true,
          crossOrigin: true,
          domain: [
            'http://localhost:3003',
            'http://localhost:3002',
            'http://localhost:3001',
            'http://localhost:3000',
          ],
          type: ['script', 'link'],
          test(url) {
            return url.includes('/static');
          },
          onRetry(context) {
            console.log('Retry', context);
          },
          onSuccess(context) {
            console.log('Successful retry', context);
          },
          onFail(context) {
            console.log('Failed retry', context);
          },
        }),
      ],
    });
    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });
});
