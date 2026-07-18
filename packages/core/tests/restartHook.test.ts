import { createRsbuild } from '../src';
import { callRestartHook, restartHook } from '../src/helpers/restartHook';

describe('restartHook', () => {
  test('should execute all callbacks and clear the registry when one throws', async () => {
    const calls: string[] = [];

    restartHook(() => {
      calls.push('first');
      throw null;
    });
    restartHook(() => {
      calls.push('second');
    });

    // A thrown value should not prevent subsequent callbacks from running.
    await expect(callRestartHook()).rejects.toBeNull();
    expect(calls).toEqual(['first', 'second']);

    // The callback registry should be cleared after the first invocation.
    await expect(callRestartHook()).resolves.toBeUndefined();
    expect(calls).toEqual(['first', 'second']);
  });

  test('should support onRestart on Rsbuild instance', async () => {
    const onRestart = rstest.fn();
    const rsbuild = await createRsbuild();

    rsbuild.onRestart(onRestart);
    await callRestartHook();

    expect(onRestart).toHaveBeenCalledTimes(1);
  });
});
