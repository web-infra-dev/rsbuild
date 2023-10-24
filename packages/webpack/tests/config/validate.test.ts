import { performance } from 'perf_hooks';
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
      validateRsbuildConfig(config),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `
      "Rsbuild config validation error:
      * Expected object, received array at "html.faviconByEntries""
    `,
    );
  });
  it('should accept correct chained config', async () => {
    const config: RsbuildConfig = {
      tools: {
        htmlPlugin: false,
        babel: () => undefined,
        terser: [],
      },
    };
    await expect(validateRsbuildConfig(config)).resolves.toMatchInlineSnapshot(`
      {
        "tools": {
          "babel": [Function],
          "htmlPlugin": false,
          "terser": [],
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
