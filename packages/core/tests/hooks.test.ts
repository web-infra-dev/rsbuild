import { rspack } from '@rspack/core';
import { createRsbuild } from '../src';
import {
  createAsyncHook,
  createEnvironmentAsyncHook,
  initHooks,
  registerDevHook,
} from '../src/hooks';
import type { InternalContext, Rspack } from '../src/types';

describe.each(['callChain', 'callBatch'] as const)(
  'tapOnce with %s',
  (method) => {
    test('should preserve callback order and only run each registration once', async () => {
      const hook = createAsyncHook<(value: string) => string>();
      const calls: string[] = [];
      const handler = (label: string) => (value: string) => {
        calls.push(label);
        return `${value}:${label}`;
      };
      const shared = handler('shared');

      hook.tapOnce({ order: 'post', handler: handler('post') });
      hook.tapOnce(shared);
      hook.tap(shared);
      hook.tapOnce({ order: 'pre', handler: handler('pre') });

      const first = await hook[method]('start');
      expect(calls).toEqual(['pre', 'shared', 'shared', 'post']);
      expect(first).toEqual(
        method === 'callChain'
          ? ['start:pre:shared:shared:post']
          : ['start:pre', 'start:shared', 'start:shared', 'start:post'],
      );

      calls.length = 0;
      expect(await hook[method]('next')).toEqual(['next:shared']);
      expect(calls).toEqual(['shared']);
    });

    test('should not repeat a callback that throws', async () => {
      const hook = createAsyncHook();
      hook.tapOnce(() => {
        throw new Error('callback failed');
      });

      await expect(hook[method]()).rejects.toThrow('callback failed');
      await expect(hook[method]()).resolves.toEqual([]);
    });

    test('should only run once across overlapping calls', async () => {
      const hook = createAsyncHook<() => Promise<string>>();
      const callback = rstest.fn(async () => 'once');
      hook.tap(async () => 'regular');
      hook.tapOnce(callback);

      const results = await Promise.all([hook[method](), hook[method]()]);
      expect(callback).toHaveBeenCalledTimes(1);
      expect(results).toEqual(
        method === 'callChain'
          ? [['once'], ['regular']]
          : [['regular', 'once'], ['regular']],
      );
    });
  },
);

describe('initHooks', () => {
  test('should initialize hooks correctly', async () => {
    const hooks = initHooks();
    expect(Object.keys(hooks)).toMatchSnapshot();
  });

  test('should run createEnvironmentAsyncHook only in the specified environment', async () => {
    const logs: string[] = [];
    const hookA = createEnvironmentAsyncHook();
    hookA.tap((msg) => {
      logs.push(`[global] ${msg}`);
    });

    hookA.tapEnvironment({
      environment: 'a',
      handler: (msg) => {
        logs.push(msg);
      },
    });

    await hookA.callChain({
      environment: 'a',
      args: ['call in a'],
    });

    await hookA.callChain({
      environment: 'b',
      args: ['call in b'],
    });

    expect(logs).toEqual([
      '[global] call in a',
      'call in a',
      '[global] call in b',
    ]);
  });
});

describe('onExit hook', () => {
  test('should listen for process exit when calling api.onExit', async () => {
    const exitCbs: Array<(...args: any[]) => void> = [];
    const spy = rstest.spyOn(process, 'on');
    spy.mockImplementation((event, cb) => {
      if (event === 'exit') {
        exitCbs.push(cb);
      }
      return process;
    });

    const onExit = rstest.fn();
    const rsbuild = await createRsbuild();
    rsbuild.addPlugins([
      {
        name: 'foo',
        setup(api) {
          api.onExit(onExit);
        },
      },
    ]);
    await rsbuild.initConfigs();

    for (const cb of exitCbs) {
      cb();
    }

    // wait exit async callback end
    await new Promise((resolve) => setTimeout(resolve));

    expect(onExit).toHaveBeenCalledTimes(1);
  });
});

test('should wait for a restarted compiler before onAfterDevCompile', async () => {
  const compiler = rspack([{ name: 'a' }, { name: 'b' }]);
  const [a, b] = compiler.compilers;
  const hooks = initHooks();
  const onAfterDevCompile = rstest.fn();

  hooks.onAfterDevCompile.tap(onAfterDevCompile);

  registerDevHook({
    compiler,
    bundlerConfigs: [{}, {}],
    MultiStatsCtor: rspack.MultiStats,
    context: {
      hooks,
      environmentList: [{ name: 'a' }, { name: 'b' }],
      environments: {},
      buildState: { time: {} },
    } as unknown as InternalContext,
  });

  const stats = {} as Rspack.Stats;
  await a.hooks.done.promise(stats);

  // A restarts without invalid; B finishes while A's watchRun is pending.
  a.hooks.watchRun.tapPromise({ name: 'test', stage: -1 }, async () => {
    await b.hooks.done.promise(stats);
    expect(onAfterDevCompile).not.toHaveBeenCalled();
  });

  await a.hooks.watchRun.promise(a);
  await a.hooks.done.promise(stats);

  expect(onAfterDevCompile).toHaveBeenCalledTimes(1);
});
