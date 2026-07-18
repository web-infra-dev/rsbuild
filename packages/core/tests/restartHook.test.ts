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

    await expect(callRestartHook()).rejects.toBeNull();
    expect(calls).toEqual(['first', 'second']);

    await expect(callRestartHook()).resolves.toBeUndefined();
    expect(calls).toEqual(['first', 'second']);
  });
});
