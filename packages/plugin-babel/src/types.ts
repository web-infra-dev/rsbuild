import type { ChainedConfigWithUtils } from '@rsbuild/shared';
import type {
  PluginItem as BabelPlugin,
  TransformOptions as BabelTransformOptions,
} from '@babel/core';

export type { BabelPlugin, BabelTransformOptions };

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

export type RuleCondition = string | RegExp | (string | RegExp);

export type BabelConfigUtils = {
  addPlugins: (plugins: BabelPlugin[]) => void;
  addPresets: (presets: BabelPlugin[]) => void;
  removePlugins: (plugins: string | string[]) => void;
  removePresets: (presets: string | string[]) => void;
  modifyPresetEnvOptions: (options: PresetEnvOptions) => void;
  modifyPresetReactOptions: (options: PresetReactOptions) => void;
  /**
   * use `source.include` instead
   * @deprecated
   */
  addIncludes: (includes: RuleCondition[]) => void;
  /**
   * use `source.exclude` instead
   * @deprecated
   */
  addExcludes: (excludes: RuleCondition[]) => void;
};

export type PluginBabelOptions = {
  include?: RuleCondition;
  exclude?: RuleCondition;
  babelLoaderOptions?: ChainedConfigWithUtils<
    BabelTransformOptions,
    BabelConfigUtils
  >;
};
