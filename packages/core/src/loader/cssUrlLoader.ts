import path from 'node:path';
import type {
  AssetInfo,
  Compilation,
  LightningCssMinimizerRspackPluginOptions,
  LoaderContext,
  LoaderDefinitionFunction,
  PathData,
  PitchLoaderDefinitionFunction,
  RuleSetRule,
  RuleSetRules,
  RuleSetUse,
  RuleSetUseItem,
} from '@rspack/core';
import { isCSSModules } from '../helpers/css';
import { relativeWithin } from '../helpers/path';
import type { CSSLoaderOptions } from '../types';

type CSSUrlLoaderOptions = {
  builtinCss?: boolean;
  filename: string | ((pathData: PathData, assetInfo?: AssetInfo) => string);
  modules: CSSLoaderOptions['modules'];
  minimized?: boolean;
  minimizers?: LightningCssMinimizerRspackPluginOptions[];
};

const CSS_FILE_REGEX = /\.css(?:\?.*)?$/;
const HASH_PLACEHOLDER_REGEX =
  /\[(?:[^:\]]+:)?(?:chunkhash|contenthash|hash|fullhash)(?::[^\]]+)?]/i;

const BASE_URI = 'rsbuild-css-url://';
const ABSOLUTE_PUBLIC_PATH = `${BASE_URI}/public-path/`;
const AUTO_PUBLIC_PATH = '__rsbuild_css_url_auto_public_path__';
const SINGLE_DOT_PATH_SEGMENT = '__rsbuild_css_url_single_dot__';

// Follow CssExtractRspackPlugin: prefix relative paths so css-loader's new URL()
// can resolve them, and protect dots so it does not collapse ./ or ../ segments.
// Remove these markers from the resulting CSS after module execution.
const getPublicPathForExtract = (publicPath: string) =>
  /^[a-zA-Z][a-zA-Z\d+\-.]*?:/.test(publicPath)
    ? publicPath
    : `${ABSOLUTE_PUBLIC_PATH}${publicPath.replaceAll('.', SINGLE_DOT_PATH_SEGMENT)}`;

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

const deleteAsset = (compilation: Compilation, filename: string) => {
  if (compilation.getAsset(filename)) {
    compilation.deleteAsset(filename);
  }
};

const stripUrlQuery = (resourceQuery: string): string => {
  if (!resourceQuery.startsWith('?')) {
    return resourceQuery;
  }

  const remaining = resourceQuery
    .slice(1)
    .split('&')
    .filter(
      (param) => param !== '' && param !== 'url' && !param.startsWith('url='),
    );

  return remaining.length > 0 ? `?${remaining.join('&')}` : '';
};

const isSameLoader = (candidate: string, selfLoaderPath: string): boolean =>
  candidate === selfLoaderPath ||
  path.resolve(candidate) === path.resolve(selfLoaderPath);

const isSelfLoaderItem = (
  item: RuleSetUseItem,
  selfLoaderPath: string,
): boolean => {
  if (!item) {
    return false;
  }
  if (typeof item === 'string') {
    return isSameLoader(item, selfLoaderPath);
  }
  return (
    typeof item.loader === 'string' && isSameLoader(item.loader, selfLoaderPath)
  );
};

const usesSelfLoader = (rule: RuleSetRule, selfLoaderPath: string): boolean => {
  if (typeof rule.loader === 'string') {
    return isSameLoader(rule.loader, selfLoaderPath);
  }
  const { use } = rule;
  if (!use || typeof use === 'function') {
    return false;
  }
  if (Array.isArray(use)) {
    return use.some((item) => isSelfLoaderItem(item, selfLoaderPath));
  }
  return isSelfLoaderItem(use, selfLoaderPath);
};

const stripSelfFromUse = (
  use: RuleSetUse | undefined,
  selfLoaderPath: string,
): RuleSetUse | undefined => {
  if (!use || typeof use === 'function') {
    return use;
  }
  if (Array.isArray(use)) {
    return use.filter((item) => !isSelfLoaderItem(item, selfLoaderPath));
  }
  return isSelfLoaderItem(use, selfLoaderPath) ? [] : [use];
};

const toChildCssRule = (
  urlBranch: RuleSetRule,
  selfLoaderPath: string,
): RuleSetRule => {
  const {
    resourceQuery: _resourceQuery,
    loader,
    options,
    parser: _parser,
    generator: _generator,
    use,
    ...rest
  } = urlBranch;

  const baseRule = {
    ...rest,
    type: 'css',
    sideEffects: true,
    resolve: {
      ...urlBranch.resolve,
      preferRelative: true,
    },
  };

  if (typeof loader === 'string') {
    if (isSameLoader(loader, selfLoaderPath)) {
      return baseRule;
    }
    return {
      ...baseRule,
      loader,
      ...(options !== undefined ? { options } : {}),
    };
  }

  const strippedUse = stripSelfFromUse(use, selfLoaderPath);
  if (strippedUse !== undefined) {
    return {
      ...baseRule,
      use: strippedUse,
    };
  }

  return baseRule;
};

const isFallbackCssMainRule = (rule: RuleSetRule): boolean =>
  !rule.resourceQuery &&
  !rule.with &&
  typeof rule.type === 'string' &&
  rule.type.startsWith('css');

const mapNestedRules = (
  rules: NonNullable<RuleSetRule['rules']>,
  selfLoaderPath: string,
): NonNullable<RuleSetRule['rules']> =>
  rules.map((sub) =>
    sub !== null && typeof sub === 'object'
      ? rewriteRuleForChild(sub, selfLoaderPath)
      : sub,
  );

const rewriteRuleForChild = (
  rule: RuleSetRule,
  selfLoaderPath: string,
): RuleSetRule => {
  let nextRule = rule;

  if (Array.isArray(nextRule.oneOf)) {
    const urlBranch = nextRule.oneOf.find(
      (sub): sub is RuleSetRule =>
        sub !== null &&
        typeof sub === 'object' &&
        usesSelfLoader(sub, selfLoaderPath),
    );

    if (urlBranch) {
      const childCssBranch = toChildCssRule(urlBranch, selfLoaderPath);
      const newOneOf: NonNullable<RuleSetRule['oneOf']> = [];
      let replacedMain = false;

      for (const sub of nextRule.oneOf) {
        if (!sub || typeof sub !== 'object') {
          newOneOf.push(sub);
          continue;
        }
        if (sub === urlBranch) {
          continue;
        }
        if (!replacedMain && isFallbackCssMainRule(sub)) {
          newOneOf.push(childCssBranch);
          replacedMain = true;
        } else {
          newOneOf.push(rewriteRuleForChild(sub, selfLoaderPath));
        }
      }

      if (!replacedMain) {
        newOneOf.push(childCssBranch);
      }

      nextRule = {
        ...nextRule,
        oneOf: newOneOf,
      };
    } else {
      nextRule = {
        ...nextRule,
        oneOf: mapNestedRules(nextRule.oneOf, selfLoaderPath),
      };
    }
  } else if (usesSelfLoader(nextRule, selfLoaderPath)) {
    nextRule = toChildCssRule(nextRule, selfLoaderPath);
  }

  if (Array.isArray(nextRule.rules)) {
    nextRule = {
      ...nextRule,
      rules: mapNestedRules(nextRule.rules, selfLoaderPath),
    };
  }

  return nextRule;
};

const rewriteRulesForChild = (
  rules: RuleSetRules,
  selfLoaderPath: string,
): RuleSetRules =>
  rules.map((rule) =>
    rule && typeof rule === 'object'
      ? rewriteRuleForChild(rule, selfLoaderPath)
      : rule,
  );

const cloneParserWithoutExportType = <
  T extends { exportType?: unknown } | undefined,
>(
  parser: T,
): T => {
  if (!parser) {
    return parser;
  }
  const { exportType: _exportType, ...rest } = parser;
  return rest as T;
};

const compileBuiltinCssUrl = (
  loaderContext: LoaderContext<CSSUrlLoaderOptions>,
  options: CSSUrlLoaderOptions,
): Promise<string> => {
  const compilation = loaderContext._compilation;
  const { rspack } = loaderContext._compiler;
  const ext = path.extname(loaderContext.resourcePath);
  const sourceFilename = normalizePath(
    path.relative(loaderContext.rootContext, loaderContext.resourcePath),
  );
  const nameSource = getCSSUrlNameSource(
    loaderContext.rootContext,
    loaderContext.resourcePath,
  );
  const name = getCSSUrlAssetName(nameSource, ext);
  const cssFilename =
    typeof options.filename === 'function'
      ? (pathData: PathData, assetInfo?: AssetInfo) =>
          (
            options.filename as (
              pathData: PathData,
              assetInfo?: AssetInfo,
            ) => string
          )(pathData, {
            ...assetInfo,
            sourceFilename,
          })
      : options.filename;

  const childCompiler = compilation.createChildCompiler(
    `rsbuild-css-url ${loaderContext.resourcePath}`,
    {
      cssFilename,
      filename: '__rsbuild_css_url__/[name].js',
    },
    [],
  );

  const moduleOptions = childCompiler.options.module;
  const selfLoaderPath = loaderContext.loaders[loaderContext.loaderIndex]?.path;
  const parserOptions = moduleOptions.parser ?? {};
  const generatorOptions = moduleOptions.generator ?? {};

  // Rspack panics on CSS entries when `exportType: 'link'` is explicitly set,
  // whereas deleting `exportType` restores the default link output even when the
  // parent uses `'style'` / `'text'` / `'css-style-sheet'`.
  childCompiler.options.module = {
    ...moduleOptions,
    rules: selfLoaderPath
      ? rewriteRulesForChild(moduleOptions.rules, selfLoaderPath)
      : moduleOptions.rules,
    parser: {
      ...parserOptions,
      css: cloneParserWithoutExportType(parserOptions.css),
      'css/auto': cloneParserWithoutExportType(parserOptions['css/auto']),
      'css/global': cloneParserWithoutExportType(parserOptions['css/global']),
      'css/module': cloneParserWithoutExportType(parserOptions['css/module']),
    },
    generator: {
      ...generatorOptions,
      css: { ...generatorOptions.css, exportsOnly: false },
      'css/auto': { ...generatorOptions['css/auto'], exportsOnly: false },
      'css/global': { ...generatorOptions['css/global'], exportsOnly: false },
      'css/module': { ...generatorOptions['css/module'], exportsOnly: false },
    },
  };

  childCompiler.options.optimization = {
    ...childCompiler.options.optimization,
    splitChunks: false,
    runtimeChunk: false,
  };

  if (options.minimizers?.length) {
    for (const minimizerOptions of options.minimizers) {
      new rspack.LightningCssMinimizerRspackPlugin(minimizerOptions).apply(
        childCompiler,
      );
    }
  }

  const entryRequest = `${loaderContext.resourcePath}${stripUrlQuery(
    loaderContext.resourceQuery,
  )}${loaderContext.resourceFragment ?? ''}`;

  new rspack.EntryPlugin(
    loaderContext.context ?? path.dirname(loaderContext.resourcePath),
    entryRequest,
    name,
  ).apply(childCompiler);

  return new Promise((resolve, reject) => {
    childCompiler.runAsChild((error, entries, childCompilation) => {
      if (error) {
        reject(error);
        return;
      }

      if (childCompilation?.errors.length) {
        reject(childCompilation.errors[0]);
        return;
      }

      const entry = entries?.[0];
      const emittedFilename = entry
        ? [...entry.files].find((file) => CSS_FILE_REGEX.test(file))
        : undefined;

      if (!entry || !childCompilation || !emittedFilename) {
        reject(
          new Error(
            `[rsbuild:css] Failed to compile CSS URL asset for "${loaderContext.resourcePath}".`,
          ),
        );
        return;
      }

      for (const file of entry.files) {
        if (file !== emittedFilename) {
          deleteAsset(compilation, file);
          deleteAsset(compilation, `${file}.map`);
        }
      }

      compilation.updateAsset(
        emittedFilename,
        (source) => source,
        (info) => ({
          ...info,
          sourceFilename,
        }),
      );

      for (const file of childCompilation.fileDependencies) {
        loaderContext.addDependency(file);
      }
      for (const dir of childCompilation.contextDependencies) {
        loaderContext.addContextDependency(dir);
      }
      for (const missing of childCompilation.missingDependencies) {
        loaderContext.addMissingDependency(missing);
      }

      resolve(emittedFilename);
    });
  });
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

    if (options.builtinCss) {
      const filename = await compileBuiltinCssUrl(this, options);
      return `export default import.meta.rspackPublicPath + ${JSON.stringify(filename)};`;
    }

    let { publicPath } = this._compilation.outputOptions;
    if (publicPath === 'auto') {
      publicPath = AUTO_PUBLIC_PATH;
    }

    // Wrap callbacks so their returned paths get the same protection, without
    // evaluating them before Rspack provides the path data.
    const publicPathForExtract =
      typeof publicPath === 'function'
        ? (pathData: PathData, assetInfo?: AssetInfo) =>
            getPublicPathForExtract(publicPath(pathData, assetInfo))
        : typeof publicPath === 'string'
          ? getPublicPathForExtract(publicPath)
          : publicPath;
    const moduleExports: unknown = await this.importModule(
      `!!${remainingRequest}`,
      {
        publicPath: publicPathForExtract,
        baseUri: `${BASE_URI}/`,
      },
    );
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
      // Avoid minifying CSS twice, which can change its content hash and cause
      // the emitted URL to differ between web and node builds.
      minimized: options.minimized,
      immutable:
        info.immutable || HASH_PLACEHOLDER_REGEX.test(filenameTemplate),
    });

    return `export default import.meta.rspackPublicPath + ${JSON.stringify(filename)};`;
  };

export default cssUrlLoader;
