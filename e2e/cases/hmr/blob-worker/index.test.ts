import { join } from 'node:path';
import { expect, test } from '@e2e/helper';

test('should perform HMR in a blob worker and preserve its state', async ({
  page,
  dev,
  editFile,
  copySrcDir,
}) => {
  const tempSrc = await copySrcDir();

  await dev({
    config: {
      source: {
        entry: {
          index: join(tempSrc, 'index.js'),
        },
      },
    },
  });

  const root = page.locator('#root');
  await expect(root).toHaveText('Hello Rsbuild!');
  await expect(root).toHaveAttribute('data-worker-protocol', 'blob:');
  const workerId = await root.getAttribute('data-worker-id');
  expect(workerId).toBeTruthy();

  await editFile(join(tempSrc, 'message.js'), (code) =>
    code.replace('Hello Rsbuild!', 'Hello HMR!'),
  );

  await expect(root).toHaveText('Hello HMR!');
  expect(await root.getAttribute('data-worker-id')).toBe(workerId);
});
