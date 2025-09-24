import { expect, rspackTest } from '@e2e/helper';

rspackTest('should preserve JSX after build', async ({ build }) => {
  const result = await build();
  const content = result.getIndexBundle();
  expect(
    (await content).includes('<div id="test">Hello Rsbuild!</div>'),
  ).toBeTruthy();
});
