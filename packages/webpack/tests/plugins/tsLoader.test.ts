import { expect, describe, it } from 'vitest';
import { pluginTsLoader } from '@/plugins/tsLoader';
import { createStubBuilder } from '../helper';

describe('plugins/tsLoader', () => {
  it('should set ts-loader', async () => {
    const builder = await createStubBuilder({
      plugins: [pluginTsLoader()],
      builderConfig: {
        tools: {
          tsLoader: {},
        },
      },
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it('should set include/exclude', async () => {
    const builder = await createStubBuilder({
      plugins: [pluginTsLoader()],
      builderConfig: {
        tools: {
          tsLoader(options, { addIncludes, addExcludes }) {
            addIncludes(['src/**/*.ts']);
            addExcludes(['src/**/*.js']);
            return options;
          },
        },
      },
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });
});
