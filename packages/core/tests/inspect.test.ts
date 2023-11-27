import { createRsbuild } from '../src';

describe('should print plugin names when inspect config', () => {
  it('apply rspack correctly', async () => {
    process.env.NODE_ENV = 'development';
    const rsbuild = await createRsbuild({
      rsbuildConfig: {
        source: {
          entry: {
            index: './src/index.js',
          },
        },
      },
    });

    const {
      origin: { rsbuildConfig },
    } = await rsbuild.inspectConfig();

    expect(rsbuildConfig.plugins).toMatchSnapshot();
  });
});
