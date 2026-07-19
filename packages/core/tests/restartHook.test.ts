import { createRsbuild } from '../src';
import { createRestartManager, getRestartManager } from '../src/helpers/restartManager';

describe('restartManager', () => {
  test('should execute all callbacks and clear the registry when one throws', async () => {
    const calls: string[] = [];
    const context = { action: 'build' } as const;
    const restart = rstest.fn(() => true);
    const manager = createRestartManager({ onRestart: () => {}, restart });

    manager.registerCleanup(() => {
      calls.push('first');
      throw null;
    });
    manager.registerCleanup(() => {
      calls.push('second');
    });

    // A thrown value should not prevent subsequent callbacks from running.
    await expect(manager.requestRestart(context)).rejects.toBeNull();
    expect(calls).toEqual(['first', 'second']);
    expect(restart).not.toHaveBeenCalled();

    // The callback registry should be cleared after the first invocation.
    await expect(manager.requestRestart(context)).resolves.toBe(true);
    expect(calls).toEqual(['first', 'second']);
    expect(restart).toHaveBeenCalledWith(context);
  });

  test('should unregister callbacks', async () => {
    const callback = rstest.fn();
    const manager = createRestartManager({ onRestart: () => {}, restart: () => true });
    const unregister = manager.registerCleanup(callback);

    unregister();
    await manager.requestRestart({ action: 'dev' });

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
    await getRestartManager(first).requestRestart(context);

    expect(firstCallback).toHaveBeenCalledWith(context);
    expect(secondCallback).not.toHaveBeenCalled();

    await getRestartManager(second).requestRestart(context);

    expect(secondCallback).toHaveBeenCalledWith(context);
  });
});
