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
  BundlerChainRule,
  RsbuildConfig,
  InspectConfigOptions,
  NormalizedServerConfig,
  NormalizedDevConfig,
  NormalizedHtmlConfig,
  NormalizedOutputConfig,
  NormalizedSourceConfig,
  NormalizedSecurityConfig,
  NormalizedPerformanceConfig,
  NormalizedToolsConfig,
  NormalizedConfig,
} from './types';
import { logger } from './logger';
import { join } from 'path';
import type { minify } from 'terser';
import fse from '../compiled/fs-extra';
import { pick, color, upperFirst } from './utils';

import _ from 'lodash';
import { DEFAULT_DEV_HOST } from './constants';
import { getTerserMinifyOptions } from './minimize';

export const getDefaultDevConfig = (): NormalizedDevConfig => ({
  hmr: true,
  assetPrefix: DEFAULT_ASSET_PREFIX,
  startUrl: false,
});

export const getDefaultServerConfig = (): NormalizedServerConfig => ({
  port: DEFAULT_PORT,
  host: DEFAULT_DEV_HOST,
  htmlFallback: 'index',
  compress: true,
  publicDir: {
    name: 'public',
    copyOnBuild: true,
  },
});

export const getDefaultSourceConfig = (): NormalizedSourceConfig => ({
  alias: {},
  define: {},
  aliasStrategy: 'prefer-tsconfig',
  preEntry: [],
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

export const getDefaultToolsConfig = (): NormalizedToolsConfig => ({
  cssExtract: {
    loaderOptions: {},
    pluginOptions: {},
  },
});

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
  targets: ['web'],
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
  injectStyles: false,
  disableMinimize: false,
  sourceMap: {
    js: undefined,
    css: false,
  },
  disableFilenameHash: false,
  enableLatestDecorators: false,
  enableCssModuleTSDeclaration: false,
  inlineScripts: false,
  inlineStyles: false,
  cssModules: {
    auto: true,
    exportLocalsConvention: 'camelCase',
  },
});

export async function outputInspectConfigFiles({
  rsbuildConfig,
  rawRsbuildConfig,
  bundlerConfigs,
  inspectOptions,
  configType,
}: {
  configType: string;
  rsbuildConfig: NormalizedConfig;
  rawRsbuildConfig: string;
  bundlerConfigs: string[];
  inspectOptions: InspectConfigOptions & {
    outputPath: string;
  };
}) {
  const { outputPath } = inspectOptions;

  const files = [
    {
      path: join(outputPath, 'rsbuild.config.js'),
      label: 'Rsbuild Config',
      content: rawRsbuildConfig,
    },
    ...bundlerConfigs.map((content, index) => {
      const suffix = rsbuildConfig.output.targets[index];
      const outputFile = `${configType}.config.${suffix}.js`;
      let outputFilePath = join(outputPath, outputFile);

      // if filename is conflict, add a random id to the filename.
      if (fse.existsSync(outputFilePath)) {
        outputFilePath = outputFilePath.replace(/\.js$/, `.${Date.now()}.js`);
      }

      return {
        path: outputFilePath,
        label: `${upperFirst(configType)} Config (${suffix})`,
        content,
      };
    }),
  ];

  await Promise.all(
    files.map((item) =>
      fse.outputFile(item.path, `module.exports = ${item.content}`),
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

type MinifyOptions = NonNullable<Parameters<typeof minify>[1]>;

export async function getMinify(isProd: boolean, config: NormalizedConfig) {
  if (config.output.disableMinimize || !isProd) {
    return false;
  }
  const minifyJS: MinifyOptions = (await getTerserMinifyOptions(config))
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
  const { default: WebpackChain } = await import('../compiled/webpack-chain');

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
    'server',
    'html',
    'tools',
    'source',
    'output',
    'security',
    'performance',
  ];
  return pick(rsbuildConfig, keys);
};
