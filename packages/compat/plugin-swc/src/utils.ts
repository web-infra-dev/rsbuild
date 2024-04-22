import fs from 'node:fs';
import { applySwcDecoratorConfig } from '@rsbuild/core/internal';
import {
  type ModifyChainUtils,
  type NormalizedConfig,
  findUp,
  getBrowserslistWithDefault,
  getCoreJsVersion,
  getDefaultStyledComponentsConfig,
  isUsingHMR,
} from '@rsbuild/shared';
import semver from '@rsbuild/shared/semver';
import _ from 'lodash';
import { CORE_JS_DIR, CORE_JS_PKG_PATH, SWC_HELPERS_DIR } from './constants';
import { getDefaultSwcConfig } from './plugin';
import type {
  ObjPluginSwcOptions,
  PluginSwcOptions,
  TransformConfig,
} from './types';

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

  return semver.satisfies(semver.minVersion(deps.react)!, '>=17.0.0');
};

/**
 * Determine react runtime mode based on react version
 */
export async function determinePresetReact(
  root: string,
  pluginConfig: ObjPluginSwcOptions,
) {
  pluginConfig.presetReact ??= {};
  pluginConfig.presetReact.runtime ??= (await isBeyondReact17(root))
    ? 'automatic'
    : 'classic';
}

export function checkUseMinify(
  options: ObjPluginSwcOptions,
  config: NormalizedConfig,
  isProd: boolean,
) {
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

  // apply swc default config
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

export async function applyPluginConfig(
  rawOptions: PluginSwcOptions,
  utils: ModifyChainUtils,
  rsbuildConfig: NormalizedConfig,
  rootPath: string,
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
          refresh: isUsingHMR(rsbuildConfig, utils),
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

  // If `targets` is not specified manually, we get `browserslist` from project.
  if (!swc.env.targets) {
    swc.env.targets = await getBrowserslistWithDefault(
      rootPath,
      rsbuildConfig,
      target,
    );
  }

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

  if (rsbuildConfig.source?.transformImport) {
    extensions.pluginImport ??= [];
    extensions.pluginImport.push(...rsbuildConfig.source.transformImport);
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
