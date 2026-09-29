import path from 'node:path';
import type {
  AssetInfo,
  LoaderDefinitionFunction,
  PathData,
  PitchLoaderDefinitionFunction,
} from '@rspack/core';
import { isCSSModules } from '../helpers/css';
import { relativeWithin } from '../helpers/path';
import type { CSSLoaderOptions } from '../types';

type CSSUrlLoaderOptions = {
  filename: string | ((pathData: PathData, assetInfo?: AssetInfo) => string);
  modules: CSSLoaderOptions['modules'];
};

const HASH_PLACEHOLDER_REGEX =
  /\[(?:[^:\]]+:)?(?:chunkhash|contenthash|hash|fullhash)(?::[^\]]+)?]/i;

const BASE_URI = 'rsbuild-css-url://';
const ABSOLUTE_PUBLIC_PATH = `${BASE_URI}/public-path/`;
const AUTO_PUBLIC_PATH = '__rsbuild_css_url_auto_public_path__';
const SINGLE_DOT_PATH_SEGMENT = '__rsbuild_css_url_single_dot__';

const normalizePath = (value: string) => value.replace(/\\/g, '/');

const getRelativePath = (root: string, resourcePath: string) => {
  const relativePath = relativeWithin(root, resourcePath);
  if (relativePath) {
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
    moduleExports &&
    typeof moduleExports === 'object' &&
    'default' in moduleExports
      ? moduleExports.default
      : moduleExports;

  if (typeof content !== 'string') {
    throw new Error(
      '[rsbuild:css] Expected CSS ?url imports to export a string.',
    );
  }

  return content;
};

const getContentHash = (
  loaderContext: ThisParameterType<
    LoaderDefinitionFunction<CSSUrlLoaderOptions>
  >,
  content: string,
) => {
  const hash = loaderContext.utils.createHash(
    loaderContext._compilation.outputOptions.hashFunction,
  );
  hash.update(Buffer.from(content));

  return hash.digest(
    loaderContext._compilation.outputOptions.hashDigest || 'hex',
  );
};

const cssUrlLoader: LoaderDefinitionFunction<CSSUrlLoaderOptions> = function (
  source,
) {
  return source;
};

export const pitch: PitchLoaderDefinitionFunction<CSSUrlLoaderOptions> =
  async function (remainingRequest) {
    const options = this.getOptions();

    if (isCSSModules(options.modules, this)) {
      throw new Error(
        '[rsbuild:css] CSS Modules do not support the ?url query. Use ?inline to import the compiled CSS content as a string.',
      );
    }

    let { publicPath } = this._compilation.outputOptions;
    if (publicPath === 'auto') {
      publicPath = AUTO_PUBLIC_PATH;
    }

    // Follow CssExtractRspackPlugin: give css-loader's new URL() an absolute
    // public path, preserving relative dot segments until after execution.
    const publicPathForExtract =
      typeof publicPath === 'string' &&
      !/^[a-zA-Z][a-zA-Z\d+\-.]*?:/.test(publicPath)
        ? `${ABSOLUTE_PUBLIC_PATH}${publicPath.replaceAll('.', SINGLE_DOT_PATH_SEGMENT)}`
        : publicPath;
    const moduleExports = await this.importModule(`!!${remainingRequest}`, {
      publicPath: publicPathForExtract,
      baseUri: `${BASE_URI}/`,
    });
    const content = getCSSContent(moduleExports)
      .replaceAll(ABSOLUTE_PUBLIC_PATH, '')
      .replaceAll(SINGLE_DOT_PATH_SEGMENT, '.');

    const ext = path.extname(this.resourcePath);
    const sourceFilename = normalizePath(
      path.relative(this.rootContext, this.resourcePath),
    );
    const nameSource = getCSSUrlNameSource(this.rootContext, this.resourcePath);
    const name = getCSSUrlAssetName(nameSource, ext);
    const contentHash = getContentHash(this, content);
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
    const { path: filename, info } = this._compilation.getAssetPathWithInfo(
      filenameTemplate,
      pathData,
    );

    let css = content;
    if (publicPath === AUTO_PUBLIC_PATH) {
      // Auto public paths are relative to the emitted CSS file, not the JS entry.
      const undoPath = path.posix.relative(path.posix.dirname(filename), '.');
      css = content.replaceAll(
        AUTO_PUBLIC_PATH,
        undoPath ? `${undoPath}/` : '',
      );
    }

    this.emitFile(filename, css, undefined, {
      ...info,
      ...assetInfo,
      immutable:
        info.immutable || HASH_PLACEHOLDER_REGEX.test(filenameTemplate),
    });

    return `export default import.meta.rspackPublicPath + ${JSON.stringify(filename)};`;
  };

export default cssUrlLoader;
