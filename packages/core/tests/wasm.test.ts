import { createStubRsbuild } from '@scripts/test-helper';
import { pluginWasm } from '../src/plugins/wasm';

describe('plugin-wasm', () => {
  it('should add wasm rule properly', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginWasm()],
      config: {
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
