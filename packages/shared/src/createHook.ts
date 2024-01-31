import { isFunction } from './utils';

type HookOrder = 'pre' | 'post' | 'default';

export type HookDescriptor<T extends (...args: any[]) => any> = {
  handler: T;
  order: HookOrder;
};

export type AsyncHook<Callback extends (...args: any[]) => any> = {
  tap: (cb: Callback | HookDescriptor<Callback>) => void;
  call: (...args: Parameters<Callback>) => Promise<Parameters<Callback>>;
};

const orderToValue = (order: HookOrder) => {
  if (order === 'pre') {
    return -1;
  }
  if (order === 'post') {
    return 1;
  }
  return 0;
};

export function createAsyncHook<
  Callback extends (...args: any[]) => any,
>(): AsyncHook<Callback> {
  const descriptors: HookDescriptor<Callback>[] = [];

  const tap = (cb: Callback | HookDescriptor<Callback>) => {
    if (isFunction(cb)) {
      descriptors.push({ handler: cb, order: 'default' });
    } else {
      descriptors.push(cb);
    }
  };

  const call = async (...args: Parameters<Callback>) => {
    const params = args.slice(0) as Parameters<Callback>;

    descriptors.sort((a, b) => orderToValue(a.order) - orderToValue(b.order));

    for (const descriptor of descriptors) {
      const result = await descriptor.handler(...params);

      if (result !== undefined) {
        params[0] = result;
      }
    }

    return params;
  };

  return {
    tap,
    call,
  };
}
