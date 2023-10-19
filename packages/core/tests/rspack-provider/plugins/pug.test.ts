import { expect, describe, it } from 'vitest';
import { pluginEntry } from '@src/plugins/entry';
import { pluginHtml } from '@src/plugins/html';
import { createStubBuilder } from '@rsbuild/vitest-helper';
import { pluginPug } from '@/plugins/pug';

describe('plugins/pug', () => {
  it('should add pug correctly when tools.pug is used', async () => {
    const builder = await createStubBuilder({
      plugins: [pluginEntry(), pluginHtml(), pluginPug()],
      entry: {
        main: './src/main.ts',
        foo: './src/foo.ts',
      },
      builderConfig: {
        html: {
          template: 'bar.html',
          templateByEntries: { main: 'foo.pug' },
        },
        tools: {
          pug: {
            pretty: true,
          },
        },
      },
    });

    const bundlerConfigs = await builder.initConfigs();
    expect(bundlerConfigs[0]).toMatchSnapshot();
  });
});
