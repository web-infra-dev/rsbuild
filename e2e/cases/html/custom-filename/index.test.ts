import { join } from 'node:path';
import { build, readDirContents } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should allow to custom HTML filename', async () => {
  await build({
    cwd: __dirname,
  });

  const outputs = await readDirContents(join(__dirname, 'dist'));
  const fooFile = Object.keys(outputs).find((item) =>
    item.includes('custom-foo.html'),
  );
  const barFile = Object.keys(outputs).find((item) =>
    item.includes('custom-bar.html'),
  );
  expect(fooFile).toBeTruthy();
  expect(barFile).toBeTruthy();
});
