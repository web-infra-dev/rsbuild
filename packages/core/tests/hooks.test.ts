import { createStubRsbuild } from '@scripts/test-helper';
import { createEnvironmentAsyncHook, initHooks } from '../src/initHooks';

describe('initHooks', () => {
  test('should init hooks correctly', async () => {
    const hooks = initHooks();
    expect(Object.keys(hooks)).toMatchSnapshot();
  });

  test('createEnvironmentAsyncHook should only works in specified environment', async () => {
    const logs: string[] = [];
    const hookA = createEnvironmentAsyncHook();
    hookA.tap()((msg) => {
      logs.push(`[global] ${msg}`);
    });

    hookA.tap({
      environment: 'a',
    })((msg) => {
      logs.push(msg);
    });

    await hookA.call('a')('call in a');

    await hookA.call('b')('call in b');

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
    const spy = vi.spyOn(process, 'on');
    spy.mockImplementation((event, cb) => {
      if (event === 'exit') {
        exitCbs.push(cb);
      }
      return process;
    });

    const onExit = vi.fn();
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
