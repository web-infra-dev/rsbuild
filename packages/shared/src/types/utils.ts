import type WebpackChain from '../../compiled/webpack-chain/index.js';

export type { WebpackChain };

export type Falsy = false | null | undefined;

export type OneOrMany<T> = T | T[];

export type MaybePromise<T> = T | Promise<T>;

export type NodeEnv = 'development' | 'production' | 'test';

export type ChainedConfig<Config> = OneOrMany<
  Config | ((config: Config) => Config | void)
>;

export type ChainedConfigWithUtils<Config, Utils> = OneOrMany<
  Config | ((config: Config, utils: Utils) => Config | void)
>;

export type ChainedConfigCombineUtils<Config, Utils> = OneOrMany<
  Config | ((params: { value: Config } & Utils) => Config | void)
>;

export type DeepReadonly<T> = keyof T extends never
  ? T
  : { readonly [k in keyof T]: DeepReadonly<T[k]> };

export type FileFilterUtil = (items: OneOrMany<string | RegExp>) => void;

export type CompilerTapFn<
  CallBack extends (...args: any[]) => void = () => void,
> = {
  tap: (name: string, cb: CallBack) => void;
};
