import path from 'node:path';
import type { Rspack } from '@rsbuild/shared';

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

export default function (this: Rspack.LoaderContext, source: string) {
  const name = getFilename(this.resourcePath);

  if (name === null) {
    throw new Error(`Failed to load Node.js addon: "${this.resourcePath}"`);
  }

  this.emitFile(name, source);

  return `
try {
  const path = require("path");
  process.dlopen(module, path.join(__dirname, "${name}"));
} catch (error) {
  throw new Error('Failed to load Node.js addon: "${name}"\\n' + error);
}
`;
}

// make the loader to receive the raw Buffer and avoid breaking node addons
export const raw = true;
