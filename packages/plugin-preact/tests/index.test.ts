import { expect, describe, it, vi } from 'vitest';
import { pluginPreact } from '../src';
import { createStubRsbuild } from '@scripts/test-helper';

describe('plugins/preact', () => {
  it('should apply react aliases by default', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginPreact()],
    });

    const config = await rsbuild.unwrapConfig();
    expect(config.resolve.alias).toMatchInlineSnapshot(`
      {
        "react": "preact/compat",
        "react-dom": "preact/compat",
        "react-dom/test-utils": "preact/test-utils",
        "react/jsx-runtime": "preact/jsx-runtime",
      }
    `);
  });

  it('should not apply react aliases if reactAliasesEnabled is false', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [
        pluginPreact({
          reactAliasesEnabled: false,
        }),
      ],
    });

    const config = await rsbuild.unwrapConfig();
    expect(config.resolve?.alias).toBeFalsy();
  });
});
