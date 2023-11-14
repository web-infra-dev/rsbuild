import { expect, describe, it } from 'vitest';
import { pluginStyledComponents } from '../src';
import { createStubRsbuild } from '@rsbuild/test-helper';
import { SCRIPT_REGEX } from '@rsbuild/shared';
import { webpackProvider } from '@rsbuild/webpack';
import { pluginSwc } from '@rsbuild/plugin-swc';

describe('plugins/styled-components', () => {
  it('should enable ssr when target contain node', async () => {
    const rsbuild = await createStubRsbuild({
      rsbuildConfig: {},
      target: ['node', 'web'],
    });

    rsbuild.addPlugins([pluginStyledComponents()]);
    const configs = await rsbuild.initConfigs();

    for (const config of configs) {
      expect(
        config.module.rules.find(
          (r) => r.test.toString() === SCRIPT_REGEX.toString(),
        ),
      ).toMatchSnapshot();
    }
  });

  it('should works in rspack mode', async () => {
    const rsbuild = await createStubRsbuild({
      rsbuildConfig: {},
    });

    rsbuild.addPlugins([pluginStyledComponents()]);
    const config = await rsbuild.unwrapConfig();

    expect(
      config.module.rules.find(
        (r) => r.test.toString() === SCRIPT_REGEX.toString(),
      ),
    ).toMatchSnapshot();
  });

  it('should works in webpack babel mode', async () => {
    const rsbuild = await createStubRsbuild({
      rsbuildConfig: {},
      provider: webpackProvider,
    });

    rsbuild.addPlugins([pluginStyledComponents()]);
    const config = await rsbuild.unwrapConfig();

    expect(
      config.module.rules.find(
        (r) => r.test && r.test.toString() === SCRIPT_REGEX.toString(),
      ),
    ).toMatchSnapshot();
  });

  // TODO move to @rsbuild/webpack
  it.skip('should works in webpack swc mode', async () => {
    const rsbuild = await createStubRsbuild({
      rsbuildConfig: {},
      provider: webpackProvider,
    });

    rsbuild.addPlugins([pluginSwc(), pluginStyledComponents()]);
    const config = await rsbuild.unwrapConfig();

    expect(
      config.module.rules.find(
        (r) => r.test && r.test.toString() === SCRIPT_REGEX.toString(),
      ),
    ).toMatchSnapshot();
  });
});
