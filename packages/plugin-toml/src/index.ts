import type { RsbuildPlugin } from '@rsbuild/core';

export const pluginToml = (): RsbuildPlugin => ({
  name: 'rsbuild:toml',

  async setup(api) {
    const { parse } = await import('toml');

    api.transform({ test: /\.toml$/ }, ({ code }) => {
      const parsed = parse(code);
      return `module.exports = ${JSON.stringify(parsed, undefined, '\t')};`;
    });
  },
});
