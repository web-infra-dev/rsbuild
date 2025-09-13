import { expect, rspackTest } from '@e2e/helper';
import { pluginBabel } from '@rsbuild/plugin-babel';

rspackTest(
  'should support legacy decorators and source.decorators.version in TypeScript',
  async ({ page, buildPreview }) => {
    await buildPreview({
      plugins: [pluginBabel()],
    });

    expect(await page.evaluate('window.aaa')).toBe('hello');
    expect(await page.evaluate('window.bbb')).toBe('world');
    expect(await page.evaluate('window.FooService')).toBeTruthy();
  },
);

rspackTest(
  'should support legacy decorators and source.decorators.version in JavaScript',
  async ({ page, buildPreview }) => {
    await buildPreview({
      plugins: [pluginBabel()],
      rsbuildConfig: {
        source: {
          entry: {
            index: './src/jsIndex.js',
          },
        },
      },
    });

    expect(await page.evaluate('window.aaa')).toBe('hello');
    expect(await page.evaluate('window.bbb')).toBe('world');
    expect(await page.evaluate('window.FooService')).toBeTruthy();
  },
);
