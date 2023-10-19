import { expect, describe, it } from 'vitest';
import { pluginEntry } from '@src/plugins/entry';
import { pluginHtml } from '@src/plugins/html';
import { createBuilder } from '../helper';
import { pluginPug } from '@/plugins/pug';

describe('plugins/pug', () => {
  it('should add pug correctly when tools.pug is used', async () => {
    const builder = await createBuilder({
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

    const {
      origin: { bundlerConfigs },
    } = await builder.inspectConfig();
    expect(bundlerConfigs[0]).toMatchSnapshot();
  });
});
