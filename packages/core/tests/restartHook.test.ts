import { createRsbuild } from '../src';
import { callRestartHook, restartHook } from '../src/helpers/restartHook';

describe('restartHook', () => {
  test('should execute all callbacks and clear the registry when one throws', async () => {
    const calls: string[] = [];
    const context = { action: 'build' } as const;

    restartHook(() => {
      calls.push('first');
      throw null;
    });
    restartHook(() => {
      calls.push('second');
    });

    // A thrown value should not prevent subsequent callbacks from running.
    await expect(callRestartHook(context)).rejects.toBeNull();
    expect(calls).toEqual(['first', 'second']);

    // The callback registry should be cleared after the first invocation.
    await expect(callRestartHook(context)).resolves.toBeUndefined();
    expect(calls).toEqual(['first', 'second']);
  });

  test('should support onRestart on Rsbuild instance', async () => {
    const onRestart = rstest.fn();
    const rsbuild = await createRsbuild();
    const context = { action: 'dev' } as const;

    rsbuild.onRestart(onRestart);
    await callRestartHook(context);

    expect(onRestart).toHaveBeenCalledWith(context);
  });
});
