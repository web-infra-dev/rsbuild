import { expect, describe, it } from 'vitest';
import { pluginEntry } from '@src/plugins/entry';
import { pluginHtml } from '@src/plugins/html';
import { createStubRsbuild } from '@rsbuild/test-helper';
import { pluginPug } from '@/plugins/pug';

describe('plugins/pug', () => {
  it('should add pug correctly when tools.pug is used', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginEntry(), pluginHtml(), pluginPug()],
      entry: {
        main: './src/main.ts',
        foo: './src/foo.ts',
      },
      rsbuildConfig: {
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

    const bundlerConfigs = await rsbuild.initConfigs();
    expect(bundlerConfigs[0]).toMatchSnapshot();
  });
});
