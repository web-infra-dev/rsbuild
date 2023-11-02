import type {
  ChainedConfig,
  SourceConfig as BaseSourceConfig,
  NormalizedSourceConfig as BaseNormalizedSourceConfig,
} from '@rsbuild/shared';

export type ModuleScopes = Array<string | RegExp>;

export type TransformImport = {
  libraryName: string;
  libraryDirectory?: string;
  style?: string | boolean;
  styleLibraryDirectory?: string;
  camelToDashComponentName?: boolean;
  transformToDefaultImport?: boolean;
  customName?: ((member: string) => string | undefined) | string;
  customStyleName?: ((member: string) => string | undefined) | string;
};

export interface SourceConfig extends BaseSourceConfig {
  /**
   * Restrict importing paths. After configuring this option, all source files can only import code from
   * the specific paths, and import code from other paths is not allowed.
   */
  moduleScopes?: ChainedConfig<ModuleScopes>;
}

export interface NormalizedSourceConfig extends BaseNormalizedSourceConfig {
  /**
   * Restrict importing paths. After configuring this option, all source files can only import code from
   * the specific paths, and import code from other paths is not allowed.
   */
  moduleScopes?: ChainedConfig<ModuleScopes>;
}
