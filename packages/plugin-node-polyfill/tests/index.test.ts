import { expect, describe, it } from 'vitest';
import { createStubBuilder } from '@rsbuild/webpack/stub';
import { builderPluginNodePolyfill } from '../src';

describe('plugins/node-polyfill', () => {
  it('should add node-polyfill config', async () => {
    const builder = await createStubBuilder({
      plugins: [builderPluginNodePolyfill()],
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });
});
