import { createRsbuild } from '../src';
import { createRestartManager, getRestartManager } from '../src/helpers/restartManager';

describe('restartManager', () => {
  test('should execute all callbacks and clear the registry when one throws', async () => {
    const calls: string[] = [];
    const context = { action: 'build' } as const;
    const manager = createRestartManager();

    manager.register(() => {
      calls.push('first');
      throw null;
    });
    manager.register(() => {
      calls.push('second');
    });

    // A thrown value should not prevent subsequent callbacks from running.
    await expect(manager.call(context)).rejects.toBeNull();
    expect(calls).toEqual(['first', 'second']);

    // The callback registry should be cleared after the first invocation.
    await expect(manager.call(context)).resolves.toBeUndefined();
    expect(calls).toEqual(['first', 'second']);
  });

  test('should unregister callbacks', async () => {
    const callback = rstest.fn();
    const manager = createRestartManager();
    const unregister = manager.register(callback);

    unregister();
    await manager.call({ action: 'dev' });

    expect(callback).not.toHaveBeenCalled();
  });

  test('should isolate callbacks between Rsbuild instances', async () => {
    const firstCallback = rstest.fn();
    const secondCallback = rstest.fn();
    const first = await createRsbuild();
    const second = await createRsbuild();
    const context = { action: 'dev' } as const;

    first.onRestart(firstCallback);
    second.onRestart(secondCallback);
    await getRestartManager(first).call(context);

    expect(firstCallback).toHaveBeenCalledWith(context);
    expect(secondCallback).not.toHaveBeenCalled();

    await getRestartManager(second).call(context);

    expect(secondCallback).toHaveBeenCalledWith(context);
  });
});
