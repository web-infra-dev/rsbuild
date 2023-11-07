import {
  DEFAULT_PORT,
  ROOT_DIST_DIR,
  HTML_DIST_DIR,
  JS_DIST_DIR,
  CSS_DIST_DIR,
  SVG_DIST_DIR,
  FONT_DIST_DIR,
  WASM_DIST_DIR,
  IMAGE_DIST_DIR,
  MEDIA_DIST_DIR,
  SERVER_DIST_DIR,
  SERVER_WORKER_DIST_DIR,
  DEFAULT_MOUNT_ID,
  DEFAULT_DATA_URL_SIZE,
  DEFAULT_ASSET_PREFIX,
} from './constants';
import type {
  RsbuildTarget,
  BundlerChainRule,
  HtmlConfig,
  RsbuildConfig,
  InspectConfigOptions,
  CreateRsbuildOptions,
  NormalizedDevConfig,
  NormalizedHtmlConfig,
  NormalizedOutputConfig,
  NormalizedSourceConfig,
  NormalizedSecurityConfig,
  NormalizedPerformanceConfig,
  NormalizedToolsConfig,
  NormalizedConfig,
} from './types';
import { pick } from './pick';
import { logger } from 'rslog';
import { join } from 'path';
import { color } from './color';
import type { minify } from 'terser';
import fs from 'fs-extra';

import _ from 'lodash';
import { DEFAULT_DEV_HOST } from './constants';
import { getJSMinifyOptions } from './minimize';

export const getDefaultDevConfig = (): NormalizedDevConfig => ({
  hmr: true,
  https: false,
  port: DEFAULT_PORT,
  assetPrefix: DEFAULT_ASSET_PREFIX,
  startUrl: false,
  progressBar: true,
  host: DEFAULT_DEV_HOST,
});

export const getDefaultSourceConfig = (): NormalizedSourceConfig => ({
  alias: {},
  define: {},
  aliasStrategy: 'prefer-tsconfig',
  preEntry: [],
  globalVars: {},
  compileJsDataURI: true,
});

export const getDefaultHtmlConfig = (): NormalizedHtmlConfig => ({
  meta: {
    charset: { charset: 'UTF-8' },
    viewport: 'width=device-width, initial-scale=1.0',
  },
  title: 'Rsbuild App',
  inject: 'head',
  mountId: DEFAULT_MOUNT_ID,
  crossorigin: false,
  outputStructure: 'flat',
  scriptLoading: 'defer',
});

export const getDefaultSecurityConfig = (): NormalizedSecurityConfig => ({
  nonce: '',
});

export const getDefaultToolsConfig = (): NormalizedToolsConfig => ({});

export const getDefaultPerformanceConfig = (): NormalizedPerformanceConfig => ({
  profile: false,
  buildCache: true,
  printFileSize: true,
  removeConsole: false,
  transformLodash: true,
  removeMomentLocale: false,
  chunkSplit: {
    strategy: 'split-by-experience',
  },
});

export const getDefaultOutputConfig = (): NormalizedOutputConfig => ({
  distPath: {
    root: ROOT_DIST_DIR,
    js: JS_DIST_DIR,
    css: CSS_DIST_DIR,
    svg: SVG_DIST_DIR,
    font: FONT_DIST_DIR,
    html: HTML_DIST_DIR,
    wasm: WASM_DIST_DIR,
    image: IMAGE_DIST_DIR,
    media: MEDIA_DIST_DIR,
    server: SERVER_DIST_DIR,
    worker: SERVER_WORKER_DIST_DIR,
  },
  assetPrefix: DEFAULT_ASSET_PREFIX,
  filename: {},
  charset: 'ascii',
  polyfill: 'usage',
  dataUriLimit: {
    svg: DEFAULT_DATA_URL_SIZE,
    font: DEFAULT_DATA_URL_SIZE,
    image: DEFAULT_DATA_URL_SIZE,
    media: DEFAULT_DATA_URL_SIZE,
  },
  legalComments: 'linked',
  cleanDistPath: true,
  disableCssExtract: false,
  disableMinimize: false,
  disableSourceMap: {
    js: false,
    css: undefined,
  },
  disableFilenameHash: false,
  disableCssModuleExtension: false,
  disableInlineRuntimeChunk: false,
  enableAssetFallback: false,
  enableLatestDecorators: false,
  enableCssModuleTSDeclaration: false,
  enableInlineScripts: false,
  enableInlineStyles: false,
  cssModules: {
    exportLocalsConvention: 'camelCase',
  },
});

export async function outputInspectConfigFiles({
  rsbuildConfig,
  bundlerConfigs,
  inspectOptions,
  rsbuildOptions,
  configType,
}: {
  configType: string;
  rsbuildConfig: string;
  bundlerConfigs: string[];
  inspectOptions: InspectConfigOptions & {
    outputPath: string;
  };
  rsbuildOptions: Required<CreateRsbuildOptions>;
}) {
  const { outputPath } = inspectOptions;

  const { target } = rsbuildOptions;
  const files = [
    {
      path: join(outputPath, 'rsbuild.config.js'),
      label: 'Rsbuild Config',
      content: rsbuildConfig,
    },
    ...bundlerConfigs.map((content, index) => {
      const suffix = Array.isArray(target) ? target[index] : target;
      const outputFile = `${configType}.config.${suffix}.js`;
      let outputFilePath = join(outputPath, outputFile);

      // if filename is conflict, add a random id to the filename.
      if (fs.existsSync(outputFilePath)) {
        outputFilePath = outputFilePath.replace(/\.js$/, `.${Date.now()}.js`);
      }

      return {
        path: outputFilePath,
        label: `${_.upperFirst(configType)} Config (${suffix})`,
        content,
      };
    }),
  ];

  await Promise.all(
    files.map((item) =>
      fs.outputFile(item.path, `module.exports = ${item.content}`),
    ),
  );

  const fileInfos = files
    .map(
      (item) =>
        `  - ${color.bold(color.yellow(item.label))}: ${color.underline(
          item.path,
        )}`,
    )
    .join('\n');

  logger.success(
    `Inspect config succeed, open following files to view the content: \n\n${fileInfos}\n`,
  );
}

/**
 * lodash set type declare.
 * eg. a.b.c; a[0].b[1]
 */
export type GetTypeByPath<
  T extends string,
  C extends Record<string, any>,
> = T extends `${infer K}[${infer P}]${infer S}`
  ? GetTypeByPath<`${K}.${P}${S}`, C>
  : T extends `${infer K}.${infer P}`
  ? GetTypeByPath<P, K extends '' ? C : NonNullable<C[K]>>
  : C[T];

export const setConfig = <T extends Record<string, any>, P extends string>(
  config: T,
  path: P,
  value: GetTypeByPath<P, T>,
) => {
  _.set(config, path, value);
};

export function getExtensions({
  target = 'web',
  resolveExtensionPrefix,
  isTsProject,
}: {
  target?: RsbuildTarget;
  resolveExtensionPrefix?: NormalizedSourceConfig['resolveExtensionPrefix'];
  isTsProject?: boolean;
} = {}) {
  let extensions = [
    // only resolve .ts(x) files if it's a ts project
    // most projects are using TypeScript, resolve .ts(x) files first to reduce resolve time.
    ...(isTsProject ? ['.ts', '.tsx'] : []),
    '.js',
    '.jsx',
    '.mjs',
    '.json',
  ];

  // add an extra prefix to all extensions
  if (resolveExtensionPrefix) {
    const extensionPrefix =
      typeof resolveExtensionPrefix === 'string'
        ? resolveExtensionPrefix
        : resolveExtensionPrefix[target];

    if (extensionPrefix) {
      extensions = extensions.reduce<string[]>(
        (ret, ext) => [...ret, extensionPrefix + ext, ext],
        [],
      );
    }
  }

  return extensions;
}

type MinifyOptions = NonNullable<Parameters<typeof minify>[1]>;

export async function getMinify(isProd: boolean, config: NormalizedConfig) {
  if (config.output.disableMinimize || !isProd) {
    return false;
  }
  const minifyJS: MinifyOptions = (await getJSMinifyOptions(config))
    .terserOptions!;

  return {
    removeComments: false,
    useShortDoctype: true,
    keepClosingSlash: true,
    collapseWhitespace: true,
    removeRedundantAttributes: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true,
    removeEmptyAttributes: true,
    minifyJS,
    minifyCSS: true,
    minifyURLs: true,
  };
}

export async function stringifyConfig(config: unknown, verbose?: boolean) {
  const { default: WebpackChain } = await import('webpack-chain');

  // webpackChain.toString can be used as a common stringify method
  const stringify = WebpackChain.toString as (
    config: unknown,
    options: { verbose?: boolean },
  ) => string;

  return stringify(config as any, { verbose });
}

export const chainStaticAssetRule = ({
  rule,
  maxSize,
  filename,
  assetType,
  issuer,
}: {
  rule: BundlerChainRule;
  maxSize: number;
  filename: string;
  assetType: string;
  issuer?: any;
}) => {
  // Rspack not support dataUrlCondition function
  // forceNoInline: "foo.png?__inline=false" or "foo.png?url",
  rule
    .oneOf(`${assetType}-asset-url`)
    .type('asset/resource')
    .resourceQuery(/(__inline=false|url)/)
    .set('generator', {
      filename,
    })
    .set('issuer', issuer);

  // forceInline: "foo.png?inline" or "foo.png?__inline",
  rule
    .oneOf(`${assetType}-asset-inline`)
    .type('asset/inline')
    .resourceQuery(/inline/)
    .set('issuer', issuer);

  // default: when size < dataUrlCondition.maxSize will inline
  rule
    .oneOf(`${assetType}-asset`)
    .type('asset')
    .parser({
      dataUrlCondition: {
        maxSize,
      },
    })
    .set('generator', {
      filename,
    })
    .set('issuer', issuer);
};

export const getDefaultStyledComponentsConfig = (
  isProd: boolean,
  ssr: boolean,
) => {
  return {
    ssr,
    // "pure" is used to improve dead code elimination in production.
    // we don't need to enable it in development because it will slow down the build process.
    pure: isProd,
    displayName: true,
    transpileTemplateLiterals: true,
  };
};

/**
 * Omit unused keys from Rsbuild config passed by user
 */
export const pickRsbuildConfig = (
  rsbuildConfig: RsbuildConfig,
): RsbuildConfig => {
  const keys: Array<keyof RsbuildConfig> = [
    'dev',
    'html',
    'tools',
    'source',
    'output',
    'security',
    'performance',
    'experiments',
  ];
  return pick(rsbuildConfig, keys);
};
