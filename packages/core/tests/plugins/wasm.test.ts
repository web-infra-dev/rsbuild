import { createStubRsbuild } from '@rsbuild/test-helper';
import { expect, describe, it } from 'vitest';
import { pluginWasm } from '@src/plugins/wasm';

describe('plugins/wasm', () => {
  it('should add wasm rule properly', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginWasm()],
      rsbuildConfig: {
        output: {
          distPath: {
            wasm: 'static/wasm',
          },
        },
      },
    });

    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });
});
