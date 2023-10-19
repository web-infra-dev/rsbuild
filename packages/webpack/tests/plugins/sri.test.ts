import { describe, expect, it } from 'vitest';
import { pluginSRI } from '@/plugins/sri';
import { createStubBuilder } from '../helper';

describe('plugins/sri', () => {
  it('should apply default sri plugin', async () => {
    const builder = await createStubBuilder({
      plugins: [pluginSRI()],
      builderConfig: {
        security: {
          sri: true,
        },
      },
    });

    const config = await builder.unwrapWebpackConfig();
    expect(config.output?.crossOriginLoading).toBe('anonymous');
  });

  it('should apply sri plugin', async () => {
    const builder = await createStubBuilder({
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

    const config = await builder.unwrapWebpackConfig();
    expect(config.output?.crossOriginLoading).toBe('anonymous');
  });

  it("should't apply sri plugin", async () => {
    const builder = await createStubBuilder({
      plugins: [pluginSRI()],
      builderConfig: {},
    });

    const config = await builder.unwrapWebpackConfig();
    expect(config.output?.crossOriginLoading).toBeUndefined();
  });
});
