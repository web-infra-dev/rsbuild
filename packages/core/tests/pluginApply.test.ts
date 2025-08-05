import { createStubRsbuild } from '@scripts/test-helper';

describe('pluginApply', () => {
  it('should apply plugin correctly', async () => {
    const setup = rstest.fn();

    const rsbuild = await createStubRsbuild({
      plugins: [
        {
          name: 'plugin-test',
          apply: 'build',
          setup() {
            expect.fail('should not apply this plugin');
          },
        },
        {
          name: 'plugin-test2',
          apply: 'serve',
          setup,
        },
        {
          name: 'plugin-test3',
          apply(_, { action }) {
            return action === 'preview';
          },
          setup,
        },
      ],
    });

    await rsbuild.initConfigs({
      action: 'dev',
    });

    expect(setup).toHaveBeenCalledTimes(1);
  });

  it('should not return the same config when called multiple times', async () => {
    const setup = rstest.fn();
    const rsbuild = await createStubRsbuild({
      plugins: [
        {
          name: 'plugin-test',
          apply: 'build',
          setup,
        },
      ],
    });

    const [config1] = await rsbuild.initConfigs({
      action: 'dev',
    });

    expect(setup).not.toBeCalled();

    const [config2] = await rsbuild.initConfigs({
      action: 'build',
    });

    expect(setup).toHaveBeenCalledTimes(1);
    expect(config1).not.toBe(config2);
  });
});
