import fs from 'node:fs/promises';
import path from 'node:path';
import { expectPoll, gotoPage, test } from '@e2e/helper';
import { createRsbuild } from '@rsbuild/core';

test('should trigger the client HMR handler when dev server sends a custom message via `sockWrite`', async ({
  page,
}) => {
  const rsbuild = await createRsbuild({
    cwd: import.meta.dirname,
  });

  const server = await rsbuild.createDevServer();

  await server.listen();

  try {
    await gotoPage(page, server);

    const before = await page.evaluate('window.__count');

    server.sockWrite('custom', { event: 'count' });

    await expectPoll(() => page.evaluate('window.__count')).toBe(before + 1);
  } finally {
    await server.close();
  }
});

test('should dispose old HMR event callbacks after page reload', async ({
  page,
}) => {
  const rsbuild = await createRsbuild({
    cwd: import.meta.dirname,
  });

  const server = await rsbuild.createDevServer();
  await server.listen();

  const indexPath = path.join(import.meta.dirname, 'src/index.js');
  const originalSource = await fs.readFile(indexPath, 'utf-8');

  try {
    await gotoPage(page, server);

    // 1) Trigger once and assert callback executed.
    const afterFirst = await page.evaluate('window.__count');
    server.sockWrite('custom', { event: 'count' });
    await expectPoll(() => page.evaluate('window.__count')).toBe(
      afterFirst + 1,
    );

    // 2) Modify the source file to trigger an HMR update.
    await fs.writeFile(
      indexPath,
      originalSource.replace("console.log('hello')", "console.log('hi')"),
    );

    // 3) Trigger again. If old callback leaked, we'd observe multiple runs.
    await expectPoll(() => page.evaluate('window.__count')).toBe(
      afterFirst + 1,
    );
    server.sockWrite('custom', { event: 'count' });
    await expectPoll(() => page.evaluate('window.__count')).toBe(
      afterFirst + 2,
    );
  } finally {
    await fs.writeFile(indexPath, originalSource);
    await server.close();
  }
});
