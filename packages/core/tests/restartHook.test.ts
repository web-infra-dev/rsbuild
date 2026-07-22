import { createRestartManager } from '../src/helpers/restartManager';

describe('restartManager', () => {
  test('should execute all callbacks and clear the registry when one throws', async () => {
    const calls: string[] = [];
    const context = { action: 'build', options: { watch: true } } as const;
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
    await manager.requestRestart({ action: 'dev', options: {} });

    expect(callback).not.toHaveBeenCalled();
  });
});
