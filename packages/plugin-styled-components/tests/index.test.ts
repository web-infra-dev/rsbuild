import { expect, describe, it } from 'vitest';
import { pluginStyledComponents } from '../src';
import { createStubRsbuild } from '@rsbuild/test-helper';
import { mergeRegex, JS_REGEX, TS_REGEX } from '@rsbuild/shared';
import { webpackProvider } from '@rsbuild/webpack';

describe('plugins/styled-components', () => {
  it('should works in rspack mode', async () => {
    const rsbuild = await createStubRsbuild({
      rsbuildConfig: {},
    });

    rsbuild.addPlugins([pluginStyledComponents()]);
    const config = await rsbuild.unwrapConfig();

    expect(
      config.module.rules.find(
        (r) => r.test.toString() === mergeRegex(JS_REGEX, TS_REGEX).toString(),
      ),
    ).toMatchSnapshot();
  });

  it('should works in webpack mode', async () => {
    const rsbuild = await createStubRsbuild({
      rsbuildConfig: {},
      provider: webpackProvider,
    });

    rsbuild.addPlugins([pluginStyledComponents()]);
    const config = await rsbuild.unwrapConfig();

    expect(
      config.module.rules.find(
        (r) =>
          r.test &&
          r.test.toString() === mergeRegex(JS_REGEX, TS_REGEX).toString(),
      ),
    ).toMatchSnapshot();
  });
});
