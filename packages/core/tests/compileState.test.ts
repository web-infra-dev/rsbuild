import { createCompileState } from '../src/server/compileState';
import type { Rspack } from '../src/types';

const createStats = (name: string) => ({ name }) as unknown as Rspack.Stats;

test('should resolve environment stats independently', async () => {
  const compileState = createCompileState(2);
  const webStats = createStats('web');
  const nodeStats = createStats('node');

  const webPromise = compileState.wait(0);
  let nodeResolved = false;
  const nodePromise = compileState.wait(1).then((stats) => {
    nodeResolved = true;
    return stats;
  });

  compileState.done(0, webStats);

  await expect(webPromise).resolves.toBe(webStats);
  await Promise.resolve();
  expect(nodeResolved).toBe(false);

  compileState.done(1, nodeStats);

  await expect(nodePromise).resolves.toBe(nodeStats);
});

test('should wait for the next stats after resetting an environment', async () => {
  const compileState = createCompileState(1);
  const previousStats = createStats('previous');
  const nextStats = createStats('next');

  compileState.done(0, previousStats);

  await expect(compileState.wait(0)).resolves.toBe(previousStats);

  compileState.reset(0);

  let resolved = false;
  const nextPromise = compileState.wait(0).then((stats) => {
    resolved = true;
    return stats;
  });

  await Promise.resolve();
  expect(resolved).toBe(false);

  compileState.done(0, nextStats);

  await expect(nextPromise).resolves.toBe(nextStats);
});

test('should not resolve pending waiters with stale stats during repeated resets', async () => {
  const compileState = createCompileState(1);
  const previousStats = createStats('previous');
  const nextStats = createStats('next');

  compileState.done(0, previousStats);
  compileState.reset(0);

  let resolvedStats: Rspack.Stats | undefined;
  const nextPromise = compileState.wait(0).then((stats) => {
    resolvedStats = stats;
    return stats;
  });

  compileState.reset(0);
  await Promise.resolve();
  expect(resolvedStats).toBeUndefined();

  compileState.done(0, nextStats);

  await expect(nextPromise).resolves.toBe(nextStats);
});
