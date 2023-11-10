import type {
  Linter as LinterType,
  Common,
  Plugin,
  SDK,
} from '@rsbuild/doctor-types';
import type { DoctorSlaveSDK, DoctorWebpackSDK } from '@rsbuild/doctor-sdk/sdk';
import { ModuleGraph } from '@rsbuild/doctor-sdk/graph';
// import { rules } from '@web-doctor/webpack-rules';

// type InternalRules = Common.UnionToTuple<typeof rules[number]>;
type InternalRules = any; // TODO: add webpack-rules later;

export interface DoctorWebpackPluginOptions<
  Rules extends LinterType.ExtendRuleData[],
> {
  /** Checker configuration */
  linter?: LinterType.Options<Rules, InternalRules>;
  /**
   * the switch for the Web Doctor features.
   */
  features?:
    | Plugin.DoctorWebpackPluginFeatures
    | Array<keyof Plugin.DoctorWebpackPluginFeatures>;
  /**
   * configuration of the interceptor for webpack loaders.
   * @description worked when the `features.loader === true`.
   */
  loaderInterceptorOptions?: {
    /**
     * loaders which you want to skip it (will not report the target loader data when webpack compile).
     */
    skipLoaders?: string[];
  };
  /**
   * turn on it if you don't need to see profile in browser.
   * @default false
   */
  disableClientServer?: boolean;
  /**
   * sdk instance of outside
   */
  sdkInstance?: DoctorWebpackSDK;
  /**
   * control the web doctor reporter codes records.
   */
  reportCodeType?:
    | { noModuleSource?: boolean; noAssetsAndModuleSource?: boolean }
    | undefined;
  /**
   * control the web doctor upload data to TOS.
   * @default false
   */
  disableTOSUpload?: boolean;
}

export interface DoctorWebpackMultiplePluginOptions<
  Rules extends LinterType.ExtendRuleData[] = LinterType.ExtendRuleData[],
> extends Omit<DoctorWebpackPluginOptions<Rules>, 'sdkInstance'>,
    Pick<ConstructorParameters<typeof DoctorSlaveSDK>[0], 'stage'> {
  /**
   * name of builder
   */
  name?: string;
}

export interface DoctorPluginOptionsNormalized<
  Rules extends LinterType.ExtendRuleData[] = [],
> extends Common.DeepRequired<
    Omit<
      DoctorWebpackPluginOptions<Rules>,
      'sdkInstance' | 'linter' | 'reportCodeType'
    >
  > {
  features: Common.DeepRequired<Plugin.DoctorWebpackPluginFeatures>;
  linter: Required<LinterType.Options<Rules, InternalRules>>;
  sdkInstance?: DoctorWebpackSDK;
  reportCodeType?: SDK.ToDataType;
}

export interface BasePluginInstance<T extends Plugin.BaseCompiler> {
  apply: (compiler: T) => void;
  [k: string]: any;
}

export interface InternalPlugin<
  T extends Plugin.BaseCompiler,
  Rules extends LinterType.ExtendRuleData[] = [],
> extends BasePluginInstance<T> {
  readonly name: string;
  readonly scheduler: DoctorPluginInstance<T, Rules>;
}

export interface DoctorPluginInstance<
  T extends Plugin.BaseCompiler,
  Rules extends LinterType.ExtendRuleData[] = [],
> extends BasePluginInstance<T> {
  readonly name: string;
  readonly options: DoctorPluginOptionsNormalized<Rules>;
  readonly sdk: DoctorWebpackSDK;
  modulesGraph: ModuleGraph;
  ensureModulesChunksGraphApplied(compiler: T): void;
}

export interface DoctorRspackPluginOptions<
  Rules extends LinterType.ExtendRuleData[],
> extends DoctorWebpackPluginOptions<Rules> {}
