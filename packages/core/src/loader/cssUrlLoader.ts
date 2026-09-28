import path from 'node:path';
import type {
  AssetInfo,
  LoaderDefinitionFunction,
  PathData,
  PitchLoaderDefinitionFunction,
} from '@rspack/core';
import { getPublicPathFromCompiler } from '../helpers/compiler';
import { isCSSModules } from '../helpers/css';
import { relativeWithin } from '../helpers/path';
import type { CSSLoaderOptions } from '../types';

type CSSUrlLoaderOptions = {
  filename: string | ((pathData: PathData, assetInfo?: AssetInfo) => string);
  modules: CSSLoaderOptions['modules'];
};

const HASH_PLACEHOLDER_REGEX =
  /\[(?:[^:\]]+:)?(?:chunkhash|contenthash|hash|fullhash)(?::[^\]]+)?]/i;

const PUBLIC_PATH_PLACEHOLDER = 'rsbuild-css-url://public-path/';

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

    // css-loader resolves asset URLs with `new URL()`, which throws for
    // relative public paths, so execute with an absolute placeholder.
    const moduleExports = await this.importModule(`!!${remainingRequest}`, {
      publicPath: PUBLIC_PATH_PLACEHOLDER,
    });
    const content = getCSSContent(moduleExports);

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

    // Restore the public path, `auto` is relative to the emitted CSS file
    const publicPath =
      this._compilation.outputOptions.publicPath === 'auto'
        ? '../'.repeat(filename.split('/').length - 1)
        : getPublicPathFromCompiler(this._compilation);
    const css = content.replaceAll(PUBLIC_PATH_PLACEHOLDER, publicPath);

    this.emitFile(filename, css, undefined, {
      ...info,
      ...assetInfo,
      immutable:
        info.immutable || HASH_PLACEHOLDER_REGEX.test(filenameTemplate),
    });

    return `export default import.meta.rspackPublicPath + ${JSON.stringify(filename)};`;
  };

export default cssUrlLoader;
