export type NonFunctionPropertyNames<T> = {
  [K in keyof T]: T[K] extends Function ? never : K;
}[keyof T];
export type NonFunctionProperties<T> = Pick<T, NonFunctionPropertyNames<T>>;
export type PlainObject<T = any> = {
  [key: string]: T;
};

export type PromiseReturnType<T> = T extends (
  ...args: any[]
) => Promise<infer P>
  ? P
  : T;

export type DeepRequired<T> = T extends PlainObject
  ? {
      [K in keyof T]-?: DeepRequired<T[K]>;
    }
  : T;

export type OrPromise<T> = T | Promise<T>;

export type Constructor<T> = T extends abstract new (
  ...args: infer P1
) => infer R1
  ? new (...args: P1) => R1
  : T extends new (...args: infer P2) => infer R2
  ? new (...args: P2) => R2
  : never;

export type Function<P extends any[] = any[], R = any> = (...args: P) => R;

export type FunctionPropertyNames<T> = {
  [K in keyof T]: T[K] extends Function ? K : never;
}[keyof T];

export type Get<T, K, F = never> = K extends keyof T ? T[K] : F;

export type ObjectPropertyNames<T> = {
  [K in keyof T]: T[K] extends PlainObject ? K : never;
}[keyof T];

export type ArrayToUnion<T extends any[]> = T[number];

export type UnionToIntersection<U> = (
  U extends any ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never;

export type LastOf<T> = UnionToIntersection<
  T extends any ? () => T : never
> extends () => infer R
  ? R
  : never;

export type Push<T extends any[], V> = [...T, V];

export type UnionToTuple<
  T,
  L = LastOf<T>,
  N = [T] extends [never] ? true : false,
> = true extends N ? [] : Push<UnionToTuple<Exclude<T, L>>, L>;
