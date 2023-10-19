import { describe, expect, it } from 'vitest';
import { pluginSRI } from '@/plugins/sri';
import { createStubRsbuild } from '../helper';

describe('plugins/sri', () => {
  it('should apply default sri plugin', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginSRI()],
      builderConfig: {
        security: {
          sri: true,
        },
      },
    });

    const config = await rsbuild.unwrapWebpackConfig();
    expect(config.output?.crossOriginLoading).toBe('anonymous');
  });

  it('should apply sri plugin', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginSRI()],
      builderConfig: {
        security: {
          sri: {
            hashFuncNames: ['sha384'],
            enabled: true,
          },
        },
      },
    });

    const config = await rsbuild.unwrapWebpackConfig();
    expect(config.output?.crossOriginLoading).toBe('anonymous');
  });

  it("should't apply sri plugin", async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginSRI()],
      builderConfig: {},
    });

    const config = await rsbuild.unwrapWebpackConfig();
    expect(config.output?.crossOriginLoading).toBeUndefined();
  });
});
