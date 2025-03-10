import fs from 'node:fs';
import path from 'node:path';
import type {
  ModifyChainUtils,
  NormalizedEnvironmentConfig,
  NormalizedSourceConfig,
  Rspack,
  TransformImport,
} from '@rsbuild/core';
import _ from 'lodash';
import semver from 'semver';
import { CORE_JS_DIR, CORE_JS_PKG_PATH, SWC_HELPERS_DIR } from './constants.js';
import { getDefaultSwcConfig } from './plugin.js';
import type {
  ObjPluginSwcOptions,
  PluginSwcOptions,
  TransformConfig,
} from './types.js';

export function applySwcDecoratorConfig(
  swcConfig: Rspack.SwcLoaderOptions,
  config: NormalizedEnvironmentConfig,
): void {
  swcConfig.jsc ||= {};
  swcConfig.jsc.transform ||= {};

  const { version } = config.source.decorators;

  switch (version) {
    case 'legacy':
      swcConfig.jsc.transform.legacyDecorator = true;
      swcConfig.jsc.transform.decoratorMetadata = true;
      // see: https://github.com/swc-project/swc/issues/6571
      swcConfig.jsc.transform.useDefineForClassFields = false;
      break;
    case '2022-03':
      swcConfig.jsc.transform.legacyDecorator = false;
      swcConfig.jsc.transform.decoratorVersion = '2022-03';
      break;
    default:
      throw new Error(
        `[rsbuild:plugin-webpack-swc] Unknown decorators version: ${version}`,
      );
  }
}

const castArray = <T>(arr?: T | T[]): T[] => {
  if (arr === undefined) {
    return [];
  }
  return Array.isArray(arr) ? arr : [arr];
};

async function findUp({
  filename,
  cwd = process.cwd(),
}: {
  filename: string;
  cwd?: string;
}) {
  const { root } = path.parse(cwd);

  let dir = cwd;
  while (dir && dir !== root) {
    const filePath = path.join(dir, filename);

    try {
      const stats = await fs.promises.stat(filePath);
      if (stats?.isFile()) {
        return filePath;
      }
    } catch {}

    dir = path.dirname(dir);
  }
}

export const isVersionBeyond17 = (version: string): boolean => {
  return semver.gte(semver.minVersion(version)!, '17.0.0');
};

const isBeyondReact17 = async (cwd: string) => {
  const pkgPath = await findUp({ cwd, filename: 'package.json' });

  if (!pkgPath) {
    return false;
  }

  const pkgInfo = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const deps = {
    ...pkgInfo.devDependencies,
    ...pkgInfo.dependencies,
  };

  if (typeof deps.react !== 'string') {
    return false;
  }

  try {
    const reactPath = require.resolve('react/package.json', { paths: [cwd] });

    const reactVersion = JSON.parse(fs.readFileSync(reactPath, 'utf8')).version;
  
    return isVersionBeyond17(reactVersion);
  } catch(error) {
    console.error('Error resolving React version:', error);
    return false;
  }
};

/**
 * Determine react runtime mode based on react version
 */
export async function determinePresetReact(
  root: string,
  pluginConfig: ObjPluginSwcOptions,
): Promise<void> {
  pluginConfig.presetReact ??= {};
  pluginConfig.presetReact.runtime ??= (await isBeyondReact17(root))
    ? 'automatic'
    : 'classic';
}

export function checkUseMinify(
  options: ObjPluginSwcOptions,
  config: NormalizedEnvironmentConfig,
  isProd: boolean,
): boolean {
  return (
    isProd &&
    config.output.minify &&
    (options.jsMinify !== false || options.cssMinify !== false)
  );
}

const PLUGIN_ONLY_OPTIONS: (keyof ObjPluginSwcOptions)[] = [
  'presetReact',
  'presetEnv',
  'jsMinify',
  'cssMinify',
  'overrides',
  'transformLodash',
  'test',
  'exclude',
  'include' as unknown as keyof ObjPluginSwcOptions, // include is not in SWC config, but we need it as loader condition
];

export interface FinalizedConfig {
  test?: RegExp;
  include?: RegExp[];
  exclude?: RegExp[];
  swcConfig: ObjPluginSwcOptions;
}

export function removeUselessOptions(
  obj: ObjPluginSwcOptions,
): TransformConfig {
  const output = { ...obj };

  for (const key of PLUGIN_ONLY_OPTIONS) {
    delete output[key];
  }

  return output;
}

export async function finalizeConfig(
  userConfig: PluginSwcOptions,
  rsbuildSetConfig: TransformConfig,
): Promise<FinalizedConfig[]> {
  const isUsingFnOptions = typeof userConfig === 'function';

  const objConfig = isUsingFnOptions ? {} : userConfig;
  const defaultConfig = getDefaultSwcConfig();

  // apply SWC default config
  let swcConfig: ObjPluginSwcOptions = _.merge(
    {},
    defaultConfig,
    rsbuildSetConfig,
    objConfig,
  );

  if (isUsingFnOptions) {
    const ret = userConfig(swcConfig, {
      mergeConfig: _.merge,
      setConfig: _.set,
    });

    if (ret) {
      swcConfig = ret;
    }
  }

  // apply overrides
  const overrides = swcConfig.overrides || [];

  const finalized: FinalizedConfig[] = [{ swcConfig }];

  for (const override of overrides) {
    finalized.push({
      test: override.test,
      include: override.include,
      exclude: override.exclude,
      swcConfig: _.merge({}, swcConfig, override),
    });
  }

  return finalized;
}

const getDefaultStyledComponentsConfig = (isProd: boolean, ssr: boolean) => {
  return {
    ssr,
    // "pure" is used to improve dead code elimination in production.
    // we don't need to enable it in development because it will slow down the build process.
    pure: isProd,
    displayName: true,
    transpileTemplateLiterals: true,
  };
};

const getCoreJsVersion = (corejsPkgPath: string) => {
  try {
    const rawJson = fs.readFileSync(corejsPkgPath, 'utf-8');
    const { version } = JSON.parse(rawJson);
    const [major, minor] = version.split('.');
    return `${major}.${minor}`;
  } catch (err) {
    return '3';
  }
};

const reduceTransformImportConfig = (
  options: NormalizedSourceConfig['transformImport'],
): TransformImport[] => {
  if (!options) {
    return [];
  }

  let imports: TransformImport[] = [];
  for (const item of castArray(options)) {
    if (typeof item === 'function') {
      imports = item(imports) ?? imports;
    } else {
      imports.push(item);
    }
  }
  return imports;
};

export async function applyPluginConfig(
  rawOptions: PluginSwcOptions,
  utils: ModifyChainUtils,
  rsbuildConfig: NormalizedEnvironmentConfig,
  rootPath: string,
  browserslist: string[],
): Promise<FinalizedConfig[]> {
  const isUsingFnOptions = typeof rawOptions === 'function';
  const { target, isProd } = utils;

  // if using function type config, create an empty config
  // and then invoke function with this config
  const pluginOptions = isUsingFnOptions ? {} : rawOptions;

  await determinePresetReact(rootPath, pluginOptions);

  const swc = {
    jsc: {
      transform: {
        react: {
          refresh: !isProd && rsbuildConfig.dev.hmr && target === 'web',
        },
      },
    },
    env: pluginOptions.presetEnv || {},
    extensions: { ...pluginOptions.extensions },
    cwd: rootPath,
  } satisfies TransformConfig;

  if (pluginOptions.presetReact) {
    swc.jsc.transform.react = {
      ...swc.jsc.transform.react,
      ...pluginOptions.presetReact,
    };
  }

  const { polyfill } = rsbuildConfig.output;
  if (swc.env.mode === undefined && polyfill !== 'off') {
    swc.env.mode = polyfill;
  }

  if (!swc.env.coreJs) {
    swc.env.coreJs = getCoreJsVersion(CORE_JS_PKG_PATH);
  }

  // get `browserslist` from project.
  swc.env.targets = browserslist;

  const isSSR = target === 'node';

  // compat builder-plugin-swc extensions.styledComponents params
  if (swc.extensions?.styledComponents) {
    swc.extensions.styledComponents = {
      ...getDefaultStyledComponentsConfig(isProd, isSSR),
      ...(typeof swc.extensions.styledComponents === 'object'
        ? swc.extensions?.styledComponents
        : {}),
    };
  }

  swc.extensions ??= {};

  const extensions = swc.extensions;

  const finalPluginImport = reduceTransformImportConfig(
    rsbuildConfig.source?.transformImport,
  );

  if (finalPluginImport?.length) {
    extensions.pluginImport ??= [];
    extensions.pluginImport.push(...finalPluginImport);
  }

  if (pluginOptions?.transformLodash !== false) {
    extensions.lodash = {
      cwd: rootPath,
      ids: ['lodash', 'lodash-es'],
    };
  }

  extensions.lockCorejsVersion ??= {
    corejs: CORE_JS_DIR,
    swcHelpers: SWC_HELPERS_DIR,
  };

  applySwcDecoratorConfig(swc, rsbuildConfig);

  return await finalizeConfig(rawOptions, swc);
}
