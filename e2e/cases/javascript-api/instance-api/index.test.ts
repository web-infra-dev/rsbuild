import { expect, rspackTest } from '@e2e/helper';
import { createRsbuild, type RsbuildPlugin } from '@rsbuild/core';

rspackTest(
  'should allow to call `modifyRsbuildConfig` via Rsbuild instance',
  async () => {
    const rsbuild = await createRsbuild({
      cwd: __dirname,
    });
    rsbuild.modifyRsbuildConfig((config) => {
      config.mode = 'none';
    });

    const result = await rsbuild.inspectConfig();
    expect(result.origin.rsbuildConfig.mode).toBe('none');
  },
);

rspackTest(
  'should allow to call `modifyEnvironmentConfig` via Rsbuild instance',
  async () => {
    const rsbuild = await createRsbuild({
      cwd: __dirname,
    });
    rsbuild.modifyRsbuildConfig((config) => {
      config.mode = 'development';
    });
    rsbuild.modifyEnvironmentConfig((config) => {
      config.mode = 'none';
    });

    const result = await rsbuild.inspectConfig();
    expect(result.origin.rsbuildConfig.mode).toBe('development');
    expect(result.origin.environmentConfigs.web.mode).toBe('none');
  },
);

rspackTest('should allow to call `expose` via Rsbuild instance', async () => {
  const rsbuild = await createRsbuild({
    cwd: __dirname,
  });

  rsbuild.expose('test', {
    sayHello() {
      return 'hello';
    },
  });

  let result = '';

  const plugin: RsbuildPlugin = {
    name: 'test-plugin',
    setup(api) {
      const exposed = api.useExposed('test');
      result = exposed.sayHello();
    },
  };

  rsbuild.addPlugins([plugin]);
  await rsbuild.initConfigs();

  expect(result).toEqual('hello');
});
