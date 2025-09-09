const cacheStore: WeakMap<
  (...args: any[]) => void,
  Map<string, { data: unknown }>
> = new WeakMap();

export function memorize<T>(
  fn: (...args: any[]) => T,
  {
    cache = new Map<string, { data: T }>(),
  }: { cache?: Map<string, { data: T }> } = {},
  callback?: (value: T) => T,
): (...args: [string, ...any[]]) => T {
  const memoized = (...arguments_: [string, ...any[]]): T => {
    const [key] = arguments_;
    const cacheItem = cache.get(key);

    if (cacheItem) {
      return cacheItem.data;
    }

    // @ts-ignore preserve runtime behavior
    let result: T = fn.apply(undefined, arguments_);

    if (callback) {
      result = callback(result);
    }

    cache.set(key, {
      data: result,
    });

    return result;
  };

  cacheStore.set(memoized, cache as unknown as Map<string, { data: unknown }>);

  return memoized;
}
