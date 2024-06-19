export type Falsy = false | null | undefined;

export type OneOrMany<T> = T | T[];

export type MaybePromise<T> = T | Promise<T>;

export type NodeEnv = 'development' | 'production' | 'test';

export type DeepReadonly<T> = keyof T extends never
  ? T
  : { readonly [k in keyof T]: DeepReadonly<T[k]> };

export type FileFilterUtil = (items: OneOrMany<string | RegExp>) => void;

export type CompilerTapFn<
  CallBack extends (...args: any[]) => void = () => void,
> = {
  tap: (name: string, cb: CallBack) => void;
};

export type ConfigChain<T> = OneOrMany<T | ((config: T) => T | void)>;

export type ConfigChainWithContext<T, Ctx> = OneOrMany<
  T | ((config: T, ctx: Ctx) => T | void)
>;

export type ConfigChainAsyncWithContext<T, Ctx> = OneOrMany<
  T | ((config: T, ctx: Ctx) => MaybePromise<T | void>)
>;

export type ConfigChainMergeContext<T, Ctx> = OneOrMany<
  T | ((merged: { value: T } & Ctx) => T | void)
>;
