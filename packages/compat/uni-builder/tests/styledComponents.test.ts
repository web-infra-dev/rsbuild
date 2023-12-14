import { expect, describe, it } from 'vitest';
import { pluginBabel } from '../src/webpack/plugins/babel';
import { pluginReact } from '../src/webpack/plugins/react';
import { pluginStyledComponents } from '../src/webpack/plugins/styledComponents';
import { createStubRsbuild } from '../../webpack/tests/helper';
import { SCRIPT_REGEX } from '@rsbuild/shared';
import { pluginSwc } from '@rsbuild/plugin-swc';

describe('plugins/styled-components', () => {
  it('should enable ssr when target contain node', async () => {
    const rsbuild = await createStubRsbuild({
      rsbuildConfig: {
        output: {
          targets: ['node', 'web'],
        },
      },
    });

    rsbuild.addPlugins([
      pluginBabel(),
      pluginReact(),
      pluginStyledComponents(),
    ]);
    const configs = await rsbuild.initConfigs();

    for (const config of configs) {
      expect(
        config.module?.rules?.find(
          (r) => r.test?.toString() === SCRIPT_REGEX.toString(),
        ),
      ).toMatchSnapshot();
    }
  });

  it('should works in webpack babel mode', async () => {
    const rsbuild = await createStubRsbuild({
      rsbuildConfig: {},
    });

    rsbuild.addPlugins([
      pluginBabel(),
      pluginReact(),
      pluginStyledComponents(),
    ]);
    const config = await rsbuild.unwrapConfig();

    expect(
      config.module.rules.find(
        (r) => r.test && r.test.toString() === SCRIPT_REGEX.toString(),
      ),
    ).toMatchSnapshot();
  });

  it('should works in webpack swc mode', async () => {
    const rsbuild = await createStubRsbuild({
      rsbuildConfig: {},
    });

    rsbuild.addPlugins([
      pluginBabel(),
      pluginSwc(),
      pluginReact(),
      pluginStyledComponents(),
    ]);
    const config = await rsbuild.unwrapConfig();

    expect(
      config.module.rules.find(
        (r) => r.test && r.test.toString() === SCRIPT_REGEX.toString(),
      ),
    ).toMatchSnapshot();
  });
});
