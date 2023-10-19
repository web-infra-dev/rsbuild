import { expect, describe, it } from 'vitest';
import { createStubBuilder } from '@rsbuild/vitest-helper';
import { pluginOutput } from '@/plugins/output';

describe('plugins/output', () => {
  it('should set output correctly', async () => {
    const builder = await createStubBuilder({
      plugins: [pluginOutput()],
    });

    const bundlerConfigs = await builder.initConfigs();
    expect(bundlerConfigs[0]).toMatchSnapshot();
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

    const bundlerConfigs = await builder.initConfigs();
    expect(bundlerConfigs[0]).toMatchSnapshot();
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

    const bundlerConfigs = await builder.initConfigs();
    expect(bundlerConfigs[0]).toMatchSnapshot();
  });

  it('should allow to use filename.js to modify filename', async () => {
    const builder = await createStubBuilder({
      plugins: [pluginOutput()],
      builderConfig: {
        output: {
          filename: {
            js: 'foo.js',
            css: '[name].css',
          },
        },
      },
    });

    const bundlerConfigs = await builder.initConfigs();
    expect(bundlerConfigs[0]).toMatchSnapshot();
  });

  it('should allow to use copy plugin', async () => {
    const builder = await createStubBuilder({
      plugins: [pluginOutput()],
      builderConfig: {
        output: {
          copy: {
            patterns: [
              {
                from: 'test',
              },
            ],
          },
        },
      },
    });

    const bundlerConfigs = await builder.initConfigs();
    expect(bundlerConfigs[0]).toMatchSnapshot();
  });

  it('should allow to use copy plugin with multiply config', async () => {
    const builder = await createStubBuilder({
      plugins: [pluginOutput()],
      builderConfig: {
        output: {
          copy: [
            {
              from: 'test',
            },
            'src/assets/',
          ],
        },
        tools: {
          bundlerChain: (chain, { CHAIN_ID }) => {
            chain.plugin(CHAIN_ID.PLUGIN.COPY).tap((args) => [
              {
                patterns: [...(args[0]?.patterns || []), 'tests/'],
              },
            ]);
          },
        },
      },
    });

    const bundlerConfigs = await builder.initConfigs();
    expect(bundlerConfigs[0]).toMatchSnapshot();
  });
});
