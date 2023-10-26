import type {
  PresetEnvOptions,
  PresetEnvTargets,
  PresetEnvBuiltIns,
} from '@rsbuild/shared';

export type { TransformOptions as BabelConfig } from '@babel/core';

type DecoratorsVersion =
  | '2023-05'
  | '2023-01'
  | '2022-03'
  | '2021-12'
  | '2018-09'
  | 'legacy';

export type PluginDecoratorsOptions = {
  version: DecoratorsVersion;
  decoratorsBeforeExport?: boolean;
};

export type BasePresetOptions = {
  presetEnv?: PresetEnvOptions | false;
  presetTypeScript?: Record<string, unknown> | false;
  pluginDecorators?: PluginDecoratorsOptions | false;
};

export type WebPresetOptions = BasePresetOptions & {
  presetEnv: PresetEnvOptions & {
    targets: PresetEnvTargets;
    useBuiltIns: PresetEnvBuiltIns;
  };
  pluginTransformRuntime?: Record<string, unknown> | false;
};

export type NodePresetOptions = BasePresetOptions & {
  // empty
};
