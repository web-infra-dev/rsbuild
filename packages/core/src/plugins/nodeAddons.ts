import path from 'node:path';
import { color } from '../helpers';
import type { RsbuildPlugin } from '../types';

const getFilename = (resourcePath: string) => {
  const name = resourcePath && path.parse(resourcePath).name;
  return name ? `${name}.node` : null;
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
const path = require("node:path");
process.dlopen(module, path.join(__dirname, "${name}"));
} catch (error) {
throw new Error('Failed to load Node.js addon: "${name}"\\n' + error);
}
`;
      },
    );
  },
});
