import { createStubRsbuild } from '@scripts/test-helper';
import { createEnvironmentAsyncHook, initHooks } from '../src/hooks';

describe('initHooks', () => {
  test('should init hooks correctly', async () => {
    const hooks = initHooks();
    expect(Object.keys(hooks)).toMatchSnapshot();
  });

  test('createEnvironmentAsyncHook should only works in specified environment', async () => {
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
  test('should listen to process exit when calling api.onExit', async () => {
    const exitCbs: Array<(...args: any[]) => void> = [];
    const spy = rstest.spyOn(process, 'on');
    spy.mockImplementation((event, cb) => {
      if (event === 'exit') {
        exitCbs.push(cb);
      }
      return process;
    });

    const onExit = rstest.fn();
    const rsbuild = await createStubRsbuild({
      plugins: [
        {
          name: 'foo',
          setup(api) {
            api.onExit(onExit);
          },
        },
      ],
    });
    await rsbuild.unwrapConfig();

    for (const cb of exitCbs) {
      cb();
    }

    // wait exit async callback end
    await new Promise((resolve) => setTimeout(resolve));

    expect(onExit).toHaveBeenCalledTimes(1);
  });
});
