import { expect, test } from '@playwright/test';
import { build } from '@e2e/helper';

const isHtmlMatch = (html: string, pattern: RegExp): boolean =>
  Boolean(html.match(pattern));

test('should inject tags', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    rsbuildConfig: {
      html: {
        tags: [
          { tag: 'script', attrs: { src: 'foo.js' } },
          { tag: 'script', attrs: { src: 'https://www.cdn.com/foo.js' } },
          { tag: 'script', attrs: { src: 'bar.js' }, append: false },
          { tag: 'script', attrs: { src: 'baz.js' }, append: false },
          { tag: 'meta', attrs: { name: 'referrer', content: 'origin' } },
        ],
      },
    },
  });

  const files = await rsbuild.unwrapOutputJSON();

  const indexHtml =
    files[Object.keys(files).find((file) => file.endsWith('index.html'))!];

  expect(isHtmlMatch(indexHtml, /foo\.js/)).toBeTruthy();
  expect(
    isHtmlMatch(indexHtml, /src="https:\/\/www\.cdn\.com\/foo\.js/),
  ).toBeTruthy();
  expect(isHtmlMatch(indexHtml, /content="origin"/)).toBeTruthy();
});
