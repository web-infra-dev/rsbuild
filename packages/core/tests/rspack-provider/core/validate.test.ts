import { performance } from 'perf_hooks';
import { describe, expect, it } from 'vitest';
import { createDefaultConfig } from '@/config/defaults';
import { validateRsbuildConfig } from '@/config/validate';
import { RsbuildConfig } from '@/types';

describe('validateRsbuildConfig', () => {
  it('should accept empty object', async () => {
    await expect(validateRsbuildConfig({})).resolves.toEqual({});
  });
  it('should remove unknown properties', async () => {
    await expect(validateRsbuildConfig({ foo: 123 })).resolves.toEqual({});
  });

  it('should throw error when shape wrong', async () => {
    const config = {
      dev: { hmr: false },
      html: { faviconByEntries: [] },
    };
    await expect(
      validateRsbuildConfig({
        output: {
          polyfill: 'usage',
        },
      }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(`
      "Rsbuild config validation error:
      * Invalid enum value. Expected 'entry' | 'ua' | 'off', received 'usage' at "output.polyfill""
    `);

    await expect(validateRsbuildConfig(config)).rejects
      .toThrowErrorMatchingInlineSnapshot(`
      "Rsbuild config validation error:
      * Expected object, received array at "html.faviconByEntries""
    `);
  });
  it('should accept correct chained config', async () => {
    const config: RsbuildConfig = {
      tools: {
        htmlPlugin: false,
        rspack: (_: any) => ({}),
      },
    };
    await expect(validateRsbuildConfig(config)).resolves.toMatchInlineSnapshot(`
      {
        "tools": {
          "htmlPlugin": false,
          "rspack": [Function],
        },
      }
    `);
  });
  it('should validate config and cost less than 100ms', async () => {
    const config = createDefaultConfig();
    const startedAt = performance.now();
    await validateRsbuildConfig(config);
    const endedAt = performance.now();
    const cost = endedAt - startedAt;
    console.log(`config validator cost: ${cost.toFixed(2)}ms`);
    expect(cost).lessThan(100);
  });
});
