import path from 'node:path';
import type {
  AssetInfo,
  LoaderDefinitionFunction,
  PathData,
  PitchLoaderDefinitionFunction,
} from '@rspack/core';
import { isCSSModules } from '../helpers/css';
import type { CSSLoaderOptions } from '../types';

type CSSUrlLoaderOptions = {
  filename: string | ((pathData: PathData, assetInfo?: AssetInfo) => string);
  modules: CSSLoaderOptions['modules'];
  builtinCss?: boolean;
};

const HASH_PLACEHOLDER_REGEX =
  /\[(?:[^:\]]+:)?(?:chunkhash|contenthash|hash|fullhash)(?::[^\]]+)?]/i;

const normalizePath = (value: string) => value.replace(/\\/g, '/');

const isParentDirRelativePath = (value: string) =>
  value === '..' || value.startsWith(`..${path.sep}`);

const getRelativePath = (root: string, resourcePath: string) => {
  const relativePath = path.relative(root, resourcePath);
  if (relativePath && !isParentDirRelativePath(relativePath) && !path.isAbsolute(relativePath)) {
    return normalizePath(relativePath);
  }
};

const getCSSUrlNameSource = (root: string, resourcePath: string) =>
  getRelativePath(path.join(root, 'src'), resourcePath) ??
  getRelativePath(root, resourcePath) ??
  path.basename(resourcePath);

const getCSSUrlAssetName = (nameSource: string, ext: string) =>
  ext ? nameSource.slice(0, -ext.length) : nameSource;

const getCSSContent = (moduleExports: unknown): string => {
  const content =
    moduleExports && typeof moduleExports === 'object' && 'default' in moduleExports
      ? moduleExports.default
      : moduleExports;

  if (typeof content !== 'string') {
    throw new Error('[rsbuild:css] Expected CSS ?url imports to export a string.');
  }

  return content;
};

const getContentHash = (
  loaderContext: ThisParameterType<LoaderDefinitionFunction<CSSUrlLoaderOptions>>,
  content: string,
) => {
  const hash = loaderContext.utils.createHash(
    loaderContext._compilation.outputOptions.hashFunction,
  );
  hash.update(Buffer.from(content));

  return hash.digest(loaderContext._compilation.outputOptions.hashDigest || 'hex');
};

const assertNoCssModules = (
  loaderContext: ThisParameterType<LoaderDefinitionFunction<CSSUrlLoaderOptions>>,
  modules: CSSLoaderOptions['modules'],
) => {
  if (isCSSModules(modules, loaderContext)) {
    throw new Error(
      '[rsbuild:css] CSS Modules do not support the ?url query. Use ?inline to import the compiled CSS content as a string.',
    );
  }
};

const emitCssUrl = (
  loaderContext: ThisParameterType<LoaderDefinitionFunction<CSSUrlLoaderOptions>>,
  options: CSSUrlLoaderOptions,
  content: string,
) => {
  const ext = path.extname(loaderContext.resourcePath);
  const sourceFilename = normalizePath(
    path.relative(loaderContext.rootContext, loaderContext.resourcePath),
  );
  const nameSource = getCSSUrlNameSource(loaderContext.rootContext, loaderContext.resourcePath);
  const name = getCSSUrlAssetName(nameSource, ext);
  const contentHash = getContentHash(loaderContext, content);
  const pathData: PathData = {
    contentHash,
    chunk: {
      name,
      hash: contentHash,
      contentHash: {
        css: contentHash,
      },
    },
  };
  const assetInfo: AssetInfo = {
    sourceFilename,
  };
  const filenameTemplate =
    typeof options.filename === 'function'
      ? options.filename(pathData, assetInfo)
      : options.filename;
  const { path: filename, info } = loaderContext._compilation.getAssetPathWithInfo(
    filenameTemplate,
    pathData,
  );

  loaderContext.emitFile(filename, content, undefined, {
    ...info,
    ...assetInfo,
    immutable: info.immutable || HASH_PLACEHOLDER_REGEX.test(filenameTemplate),
  });

  return `export default __webpack_public_path__ + ${JSON.stringify(filename)};`;
};

const cssUrlLoader: LoaderDefinitionFunction<CSSUrlLoaderOptions> = function (source) {
  const options = this.getOptions();

  if (!options.builtinCss) {
    return source;
  }

  assertNoCssModules(this, options.modules);

  const content = Buffer.isBuffer(source) ? source.toString() : source;

  return emitCssUrl(this, options, content);
};

export const pitch: PitchLoaderDefinitionFunction<CSSUrlLoaderOptions> = async function (
  remainingRequest,
) {
  const options = this.getOptions();

  if (options.builtinCss) {
    return;
  }

  assertNoCssModules(this, options.modules);

  const moduleExports = await this.importModule(`!!${remainingRequest}`);
  const content = getCSSContent(moduleExports);

  return emitCssUrl(this, options, content);
};

export default cssUrlLoader;
