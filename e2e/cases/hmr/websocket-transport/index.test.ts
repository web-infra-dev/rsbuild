import { join } from 'node:path';
import { expect, test } from '@e2e/helper';

test('HMR should work with custom webSocketTransport', async ({
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
          index: join(tempSrc, 'index.ts'),
        },
      },
    },
  });

  // Verify custom transport was used
  const transportUsed = await page.evaluate(
    () => (window as any).__CUSTOM_TRANSPORT_USED__,
  );
  expect(transportUsed).toBe(true);

  // Verify HMR works
  const locator = page.locator('#test');
  await expect(locator).toHaveText('Hello Rsbuild!');

  await editFile(join(tempSrc, 'App.tsx'), (code) =>
    code.replace('Hello Rsbuild', 'Hello Test'),
  );

  await expect(locator).toHaveText('Hello Test!');
});
