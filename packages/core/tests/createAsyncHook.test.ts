import { createAsyncHook } from '../src/hooks';

describe('createAsyncHook', () => {
  test('should execute callback functions in order', async () => {
    const myHook = createAsyncHook();
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    myHook.tap(callback1);
    myHook.tap(callback2);
    await myHook.call();
    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback2).toHaveBeenCalledTimes(1);
  });

  test('should keep params if callback function return void', async () => {
    const myHook = createAsyncHook();
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    myHook.tap(callback1);
    myHook.tap(callback2);

    const result = await myHook.call(1);
    expect(result).toEqual([1]);
  });

  test('should allow to modify params in callback function', async () => {
    const myHook = createAsyncHook();
    const callback1 = async () => 2;
    const callback2 = async () => 3;

    myHook.tap(callback1);
    myHook.tap(callback2);

    const result = await myHook.call(1);
    expect(result).toEqual([3]);
  });

  test('should allow to specify hook order', async () => {
    const myHook = createAsyncHook();
    const result: number[] = [];

    myHook.tap(() => {
      result.push(1);
    });
    myHook.tap({
      handler: () => {
        result.push(2);
      },
      order: 'post',
    });
    myHook.tap({
      handler: () => {
        result.push(3);
      },
      order: 'post',
    });
    myHook.tap({
      handler: () => {
        result.push(4);
      },
      order: 'default',
    });
    myHook.tap({
      handler: () => {
        result.push(5);
      },
      order: 'pre',
    });
    myHook.tap({
      handler: () => {
        result.push(6);
      },
      order: 'pre',
    });
    myHook.tap({
      handler: () => {
        result.push(7);
      },
      order: 'default',
    });

    await myHook.call();

    expect(result).toEqual([5, 6, 1, 4, 7, 2, 3]);
  });
});
