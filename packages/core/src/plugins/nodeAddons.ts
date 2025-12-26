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

        const config = api.getNormalizedConfig();

        const handleErrorSnippet = `throw new Error('Failed to load Node.js addon: "${name}"', {
    cause: error,
  });`;

        if (config.output.module) {
          // ESM output
          return `
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

let native;
try {
  native = require(path.join(__dirname, "${name}"));
} catch (error) {
  ${handleErrorSnippet}
}

export default native;
`;
        }

        // CJS output
        return `
try {
  const path = __non_webpack_require__("node:path");
  module.exports = __non_webpack_require__(path.join(__dirname, "${name}"));
} catch (error) {
  ${handleErrorSnippet}
}
`;
      },
    );
  },
});
