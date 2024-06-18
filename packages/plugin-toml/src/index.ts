import type { RsbuildPlugin } from '@rsbuild/core';

export const PLUGIN_TOML_NAME = 'rsbuild:toml';

export const pluginToml = (): RsbuildPlugin => ({
  name: PLUGIN_TOML_NAME,

  async setup(api) {
    const { parse } = await import('toml');

    api.transform({ test: /\.toml$/ }, ({ code }) => {
      const parsed = parse(code);
      return `module.exports = ${JSON.stringify(parsed, undefined, '\t')};`;
    });
  },
});
