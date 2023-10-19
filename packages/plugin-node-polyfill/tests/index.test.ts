import { expect, describe, it } from 'vitest';
import { createStubBuilder } from '@rsbuild/vitest-helper';
import { webpackProvider } from '@rsbuild/webpack';
import { pluginNodePolyfill } from '../src';

describe('plugins/node-polyfill', () => {
  it('should add node-polyfill config', async () => {
    const builder = await createStubBuilder({
      plugins: [pluginNodePolyfill()],
    });
    const configs = await builder.initConfigs();

    expect(configs[0]).toMatchSnapshot();
  });

  it('should add node-polyfill config when use webpack', async () => {
    const builder = await createStubBuilder({
      plugins: [pluginNodePolyfill()],
      provider: webpackProvider,
      builderConfig: {},
    });
    const configs = await builder.initConfigs();

    expect(configs[0]).toMatchSnapshot();
  });
});
