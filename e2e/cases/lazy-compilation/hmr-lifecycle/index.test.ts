import { join } from 'node:path';
import { expect, expectPoll, gotoPage, test } from '@e2e/helper';

const BUILD_PAGE1 = 'building test-temp-src/page1/index.jsx';
const createLazyEntryConfig = (tempSrc: string) => ({
  dev: { lazyCompilation: true },
  source: {
    entry: {
      page1: join(tempSrc, 'page1/index.jsx'),
      page2: join(tempSrc, 'page2/index.js'),
    },
  },
});

test('preserves source and CSS HMR state after activating a lazy entry', async ({
  page,
  devOnly,
  editFile,
  copySrcDir,
}) => {
  const tempSrc = await copySrcDir();
  const rsbuild = await devOnly({ config: createLazyEntryConfig(tempSrc) });

  rsbuild.clearLogs();
  await gotoPage(page, rsbuild, 'page1');
  await rsbuild.expectLog(BUILD_PAGE1, { posix: true });
  await rsbuild.expectBuildEnd();
  await expect(page.locator('#test')).toHaveText('Lazy source');

  const documentId = await page.evaluate<string>('window.__lazyHmrDocumentId');
  await page.locator('#increment').click();
  await expect(page.locator('#count')).toHaveText('1');

  await editFile(join(tempSrc, 'page1/App.jsx'), (code) =>
    code.replace('Lazy source', 'Updated source'),
  );
  await expect(page.locator('#test')).toHaveText('Updated source');
  await expect(page.locator('#count')).toHaveText('1');
  expect(await page.evaluate<string>('window.__lazyHmrDocumentId')).toBe(documentId);

  await editFile(join(tempSrc, 'page1/App.css'), () => '#test { color: rgb(0, 0, 255); }');
  await expect(page.locator('#test')).toHaveCSS('color', 'rgb(0, 0, 255)');
  await expect(page.locator('#count')).toHaveText('1');
  expect(await page.evaluate<string>('window.__lazyHmrDocumentId')).toBe(documentId);
});

test('reconnects a loaded lazy entry without reloading when the hash matches', async ({
  page,
  devOnly,
  editFile,
  copySrcDir,
}) => {
  const tempSrc = await copySrcDir();
  let webSocketCount = 0;
  let resolveSocketClose: (() => void) | undefined;
  const socketClosed = new Promise<void>((resolve) => {
    resolveSocketClose = resolve;
  });
  page.on('websocket', (socket) => {
    webSocketCount += 1;
    socket.once('close', () => resolveSocketClose?.());
  });

  const rsbuild = await devOnly({ config: createLazyEntryConfig(tempSrc) });
  rsbuild.clearLogs();
  await gotoPage(page, rsbuild, 'page1');
  await rsbuild.expectLog(BUILD_PAGE1, { posix: true });
  await rsbuild.expectBuildEnd();
  await expect(page.locator('#test')).toHaveText('Lazy source');
  const documentId = await page.evaluate<string>('window.__lazyHmrDocumentId');
  const initialWebSocketCount = webSocketCount;

  await page.context().setOffline(true);
  await socketClosed;
  await page.context().setOffline(false);
  await expectPoll(() => webSocketCount).toBeGreaterThan(initialWebSocketCount);
  expect(await page.evaluate<string>('window.__lazyHmrDocumentId')).toBe(documentId);

  await editFile(join(tempSrc, 'page1/App.jsx'), (code) =>
    code.replace('Lazy source', 'Updated source'),
  );
  await expect(page.locator('#test')).toHaveText('Updated source');
  expect(await page.evaluate<string>('window.__lazyHmrDocumentId')).toBe(documentId);

  await rsbuild.close();
});

test('reloads after reconnect when the loaded lazy entry hash is stale', async ({
  page,
  devOnly,
  editFile,
  copySrcDir,
}) => {
  const tempSrc = await copySrcDir();
  const config = createLazyEntryConfig(tempSrc);

  const firstServer = await devOnly({ config });
  firstServer.clearLogs();
  await gotoPage(page, firstServer, 'page1');
  await firstServer.expectLog(BUILD_PAGE1, { posix: true });
  await firstServer.expectBuildEnd();
  await expect(page.locator('#test')).toHaveText('Lazy source');
  const documentId = await page.evaluate<string>('window.__lazyHmrDocumentId');

  await firstServer.close();
  await editFile(join(tempSrc, 'page1/App.jsx'), (code) =>
    code.replace('Lazy source', 'Updated while disconnected'),
  );
  const secondServer = await devOnly({
    config: {
      ...config,
      server: { port: firstServer.port },
    },
  });

  await secondServer.expectLog(BUILD_PAGE1, { posix: true });
  await expect(page.locator('#test')).toHaveText('Updated while disconnected');
  expect(await page.evaluate<string>('window.__lazyHmrDocumentId')).not.toBe(documentId);

  await secondServer.close();
});
