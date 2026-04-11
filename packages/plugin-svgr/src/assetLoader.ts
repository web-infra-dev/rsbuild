import path from 'node:path';
import type { Rspack } from '@rsbuild/core';
import { interpolateName } from 'loader-utils';

type FilenameTemplate =
  | string
  | ((resourcePath: string, resourceQuery?: string) => string);

export type SvgAssetLoaderOptions = {
  limit: number;
  name: FilenameTemplate;
};

type RawLoaderDefinition<OptionsType = {}> = ((
  this: Rspack.LoaderContext<OptionsType>,
  content: Buffer,
) => string | Buffer | void | Promise<string | Buffer | void>) & {
  raw: true;
};

const SVG_MIME_TYPE = 'image/svg+xml';
const HASH_TEMPLATE_REGEX = /\[(?:[^:\]]+:)?(?:hash|contenthash)(?::[^\]]+)?]/i;

const normalizePath = (value: string) => value.replace(/\\/g, '/');

const assetLoader: RawLoaderDefinition<SvgAssetLoaderOptions> = function (
  content,
) {
  const { limit, name } = this.getOptions();

  if (content.length <= limit) {
    const dataUrl = `data:${SVG_MIME_TYPE};base64,${content.toString('base64')}`;
    return `export default ${JSON.stringify(dataUrl)}`;
  }

  const filename = interpolateName(this, name, {
    context: this.rootContext,
    content,
  });

  const assetInfo: {
    immutable?: true;
    sourceFilename: string;
  } = {
    sourceFilename: normalizePath(
      path.relative(this.rootContext, this.resourcePath),
    ),
  };

  if (typeof name === 'string' && HASH_TEMPLATE_REGEX.test(name)) {
    assetInfo.immutable = true;
  }

  this.emitFile(filename, content, undefined, assetInfo);

  return `export default __webpack_public_path__ + ${JSON.stringify(filename)};`;
};

assetLoader.raw = true;

export default assetLoader;
