import { expect, describe, it } from 'vitest';
import { pluginOutput } from '@/plugins/output';
import { createStubBuilder } from '../helper';

describe('plugins/output', () => {
  it('should set output correctly', async () => {
    const builder = await createStubBuilder({
      plugins: [pluginOutput()],
    });

    const config = await builder.unwrapWebpackConfig();
    expect(config).toMatchSnapshot();
  });

  it('should allow to custom server directory with distPath.server', async () => {
    const builder = await createStubBuilder({
      plugins: [pluginOutput()],
      target: ['node'],
      builderConfig: {
        output: {
          distPath: {
            server: 'server',
          },
        },
      },
    });

    const config = await builder.unwrapWebpackConfig();
    expect(config).toMatchSnapshot();
  });

  it('should allow to set distPath.js and distPath.css to empty string', async () => {
    const builder = await createStubBuilder({
      plugins: [pluginOutput()],
      builderConfig: {
        output: {
          distPath: {
            js: '',
            css: '',
          },
        },
      },
    });

    const config = await builder.unwrapWebpackConfig();
    expect(config).toMatchSnapshot();
  });

  it('should allow to use filename.js to modify filename', async () => {
    const builder = await createStubBuilder({
      plugins: [pluginOutput()],
      builderConfig: {
        output: {
          filename: {
            js: 'foo.js',
          },
        },
      },
    });

    const config = await builder.unwrapWebpackConfig();
    expect(config).toMatchSnapshot();
  });
});
