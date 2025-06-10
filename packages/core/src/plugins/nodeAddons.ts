import path from 'node:path';
import { color } from '../helpers';
import type { RsbuildPlugin } from '../types';
const getFilename = (resourcePath: string) => {
  let basename = '';

  if (resourcePath) {
    const parsed = path.parse(resourcePath);
    if (parsed.dir) {
      basename = parsed.name;
    }
  }

  if (basename) {
    return `${basename}.node`;
  }

  return null;
};

export const pluginNodeAddons = (): RsbuildPlugin => ({
  name: 'rsbuild:node-addons',

  setup(api) {
    api.transform(
      { test: /\.node$/, targets: ['node'], raw: true },
      ({ code, emitFile, resourcePath }) => {
        const name = getFilename(resourcePath);

        if (name === null) {
          throw new Error(
            `${color.dim('[rsbuild:node-addons]')} Failed to load Node.js addon: ${color.yellow(resourcePath)}`,
          );
        }

        emitFile(name, code);

        return `
try {
const path = require("path");
process.dlopen(module, path.join(__dirname, "${name}"));
} catch (error) {
throw new Error('Failed to load Node.js addon: "${name}"\\n' + error);
}
`;
      },
    );
  },
});
