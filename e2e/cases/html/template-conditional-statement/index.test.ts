import { expect, test } from '@e2e/helper';
import { getFileContent, normalizeEol } from '@rstackjs/test-utils';

test('should render conditional statement correctly', async ({ build }) => {
  const rsbuild = await build();
  const files = rsbuild.getDistFiles();

  const indexHtml = getFileContent(files, 'index.html');
  const body = (normalizeEol(indexHtml).match(/<body>[\s\S]*<\/body>/)?.[0] ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n');

  expect(body).toMatchSnapshot();
});
