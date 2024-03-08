import path from 'node:path';
import type { Rspack } from '@rsbuild/shared';

const getFilename = (resourcePath: string) => {
  let basename = 'file';

  if (resourcePath) {
    const parsed = path.parse(resourcePath);
    if (parsed.dir) {
      basename = parsed.name;
    }
  }

  return `${basename}.node`;
};

export default function (this: Rspack.LoaderContext, source: string) {
  const name = getFilename(this.resourcePath);
  this.emitFile(name, source);

  return `
try {
  process.dlopen(module, __dirname + require("path").sep + __webpack_public_path__ + ${JSON.stringify(
    name,
  )});
} catch (error) {
  throw new Error('node-loader:\\n' + error);
}
`;
}
