import { createStubRsbuild } from '@rsbuild/test-helper';
import { pluginPug } from '../src';

describe('plugin-pug', () => {
  it('should add pug loader config correctly', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginPug()],
    });
    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });

  it('should allow to custom pug options', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [
        pluginPug({
          pugOptions: {
            pretty: true,
          },
        }),
      ],
    });
    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });
});
