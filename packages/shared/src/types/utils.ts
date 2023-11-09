export type ArrayOrNot<T> = T | T[];

export type PromiseOrNot<T> = T | Promise<T>;

export type NodeEnv = 'development' | 'production' | 'test';

export type ChainedConfig<Config> = ArrayOrNot<
  Config | ((config: Config) => Config | void)
>;

export type ChainedConfigWithUtils<Config, Utils> = ArrayOrNot<
  Config | ((config: Config, utils: Utils) => Config | void)
>;

export type ChainedConfigCombineUtils<Config, Utils> = ArrayOrNot<
  Config | ((params: { value: Config } & Utils) => Config | void)
>;

export type DeepReadonly<T> = keyof T extends never
  ? T
  : { readonly [k in keyof T]: DeepReadonly<T[k]> };

export type FileFilterUtil = (items: ArrayOrNot<string | RegExp>) => void;

export type SharedCompiledPkgNames =
  | 'sass'
  | 'less'
  | 'css-loader'
  | 'postcss-loader'
  | 'postcss-pxtorem'
  | 'postcss-flexbugs-fixes'
  | 'autoprefixer'
  | 'sass-loader'
  | 'less-loader'
  | 'node-loader'
  | 'toml-loader'
  | 'yaml-loader'
  | 'resolve-url-loader';

export type CompilerTapFn<
  CallBack extends (...args: any[]) => void = () => void,
> = {
  tap: (name: string, cb: CallBack) => void;
};
