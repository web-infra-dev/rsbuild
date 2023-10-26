import { isAbsolute, normalize, sep } from 'path';
import { mergeChainedOptions } from './mergeChainedOptions';
import { ensureArray } from './utils';
import upath from 'upath';
import type {
  TransformOptions as BabelTransformOptions,
  PluginItem as BabelPlugin,
  PluginOptions as BabelPluginOptions,
} from '@babel/core';

export { BabelTransformOptions };

export type PresetEnvTargets = string | string[] | Record<string, string>;
export type PresetEnvBuiltIns = 'usage' | 'entry' | false;
export type PresetEnvOptions = {
  targets?: PresetEnvTargets;
  bugfixes?: boolean;
  spec?: boolean;
  loose?: boolean;
  modules?: 'amd' | 'umd' | 'systemjs' | 'commonjs' | 'cjs' | 'auto' | false;
  debug?: boolean;
  include?: string[];
  exclude?: string[];
  useBuiltIns?: PresetEnvBuiltIns;
  corejs?: string | { version: string; proposals: boolean };
  forceAllTransforms?: boolean;
  configPath?: string;
  ignoreBrowserslistConfig?: boolean;
  browserslistEnv?: string;
  shippedProposals?: boolean;
};

export interface SharedBabelPresetReactOptions {
  development?: boolean;
  throwIfNamespace?: boolean;
}

export interface AutomaticRuntimePresetReactOptions
  extends SharedBabelPresetReactOptions {
  runtime?: 'automatic';
  importSource?: string;
}

export interface ClassicRuntimePresetReactOptions
  extends SharedBabelPresetReactOptions {
  runtime?: 'classic';
  pragma?: string;
  pragmaFrag?: string;
  useBuiltIns?: boolean;
  useSpread?: boolean;
}

export type PresetReactOptions =
  | AutomaticRuntimePresetReactOptions
  | ClassicRuntimePresetReactOptions;

export type BabelConfigUtils = {
  addPlugins: (plugins: BabelPlugin[]) => void;
  addPresets: (presets: BabelPlugin[]) => void;
  addIncludes: (includes: string | RegExp | (string | RegExp)[]) => void;
  addExcludes: (excludes: string | RegExp | (string | RegExp)[]) => void;
  removePlugins: (plugins: string | string[]) => void;
  removePresets: (presets: string | string[]) => void;
  modifyPresetEnvOptions: (options: PresetEnvOptions) => void;
  modifyPresetReactOptions: (options: PresetReactOptions) => void;
};

const normalizeToPosixPath = (p: string | undefined) =>
  upath
    .normalizeSafe(normalize(p || ''))
    .replace(/^([a-zA-Z]+):/, (_, m: string) => `/${m.toLowerCase()}`);

// compatible with windows path
const formatPath = (originPath: string) => {
  if (isAbsolute(originPath)) {
    return originPath.split(sep).join('/');
  }
  return originPath;
};

const getPluginItemName = (item: BabelPlugin) => {
  if (typeof item === 'string') {
    return formatPath(item);
  }
  if (Array.isArray(item) && typeof item[0] === 'string') {
    return formatPath(item[0]);
  }
  return null;
};

const addPlugins = (plugins: BabelPlugin[], config: BabelTransformOptions) => {
  if (config.plugins) {
    config.plugins.push(...plugins);
  } else {
    config.plugins = plugins;
  }
};

const addPresets = (presets: BabelPlugin[], config: BabelTransformOptions) => {
  if (config.presets) {
    config.presets.push(...presets);
  } else {
    config.presets = presets;
  }
};

const removePlugins = (
  plugins: string | string[],
  config: BabelTransformOptions,
) => {
  if (!config.plugins) {
    return;
  }

  const removeList = ensureArray(plugins);

  config.plugins = config.plugins.filter((item: BabelPlugin) => {
    const name = getPluginItemName(item);
    if (name) {
      return !removeList.find((removeItem) => name.includes(removeItem));
    }
    return true;
  });
};

const removePresets = (
  presets: string | string[],
  config: BabelTransformOptions,
) => {
  if (!config.presets) {
    return;
  }

  const removeList = ensureArray(presets);

  config.presets = config.presets.filter((item: BabelPlugin) => {
    const name = getPluginItemName(item);
    if (name) {
      return !removeList.find((removeItem) => name.includes(removeItem));
    }
    return true;
  });
};

const modifyPresetOptions = <T>(
  presetName: string,
  options: T,
  presets: BabelPlugin[] = [],
) => {
  presets.forEach((preset: BabelPlugin, index) => {
    // 1. ['@babel/preset-env', ...]
    if (Array.isArray(preset)) {
      if (
        typeof preset[0] === 'string' &&
        normalizeToPosixPath(preset[0]).includes(presetName)
      ) {
        preset[1] = {
          ...(preset[1] || {}),
          ...options,
          // `options` is specific to different presets
        } as unknown as BabelPluginOptions;
      }
    } else if (
      typeof preset === 'string' &&
      normalizeToPosixPath(preset).includes(presetName)
    ) {
      // 2. '@babel/preset-env'
      presets[index] = [preset, options];
    }
  });
};

export const getBabelUtils = (
  config: BabelTransformOptions,
): BabelConfigUtils => {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const noop = () => {};
  return {
    addPlugins: (plugins: BabelPlugin[]) => addPlugins(plugins, config),
    addPresets: (presets: BabelPlugin[]) => addPresets(presets, config),
    removePlugins: (plugins: string | string[]) =>
      removePlugins(plugins, config),
    removePresets: (presets: string | string[]) =>
      removePresets(presets, config),
    // `addIncludes` and `addExcludes` are noop functions by default,
    // It can be overridden by `extraBabelUtils`.
    addIncludes: noop,
    addExcludes: noop,
    // Compat `presetEnvOptions` and `presetReactOptions` in Eden.
    modifyPresetEnvOptions: (options: PresetEnvOptions) =>
      modifyPresetOptions('@babel/preset-env', options, config.presets || []),
    modifyPresetReactOptions: (options: PresetReactOptions) =>
      modifyPresetOptions('@babel/preset-react', options, config.presets || []),
  };
};

export type BabelConfig =
  | BabelTransformOptions
  | ((
      config: BabelTransformOptions,
      utils: BabelConfigUtils,
    ) => BabelTransformOptions | void);

export const applyUserBabelConfig = (
  defaultOptions: BabelTransformOptions,
  userBabelConfig?: BabelConfig | BabelConfig[],
  extraBabelUtils?: Partial<BabelConfigUtils>,
): BabelTransformOptions => {
  if (userBabelConfig) {
    const babelUtils = {
      ...getBabelUtils(defaultOptions),
      ...extraBabelUtils,
    } as BabelConfigUtils;

    return mergeChainedOptions(
      defaultOptions,
      userBabelConfig || {},
      babelUtils,
    );
  }

  return defaultOptions;
};
