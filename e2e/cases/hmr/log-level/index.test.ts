import { join } from 'node:path';
import { expect, rspackTest } from '@e2e/helper';

rspackTest(
  'should respect dev.client.logLevel when set to warn',
  async ({ page, dev, logHelper, copySrcDir }) => {
    const tempSrc = await copySrcDir();
    const { addLog, expectNoLog } = logHelper;

    page.on('console', (consoleMessage) => {
      addLog(consoleMessage.text());
    });

    await dev({
      config: {
        dev: {
          client: {
            logLevel: 'warn',
          },
        },
        source: {
          entry: {
            index: join(tempSrc, 'index.tsx'),
          },
        },
      },
    });

    const locator = page.locator('#test');
    await expect(locator).toHaveText('Hello Rsbuild');

    expect(expectNoLog('[rsbuild] WebSocket connected.')).toBe(true);
  },
);

rspackTest(
  'should show info logs when dev.client.logLevel is info (default)',
  async ({ page, dev, logHelper, copySrcDir }) => {
    const tempSrc = await copySrcDir();
    const { expectLog, addLog } = logHelper;

    page.on('console', (consoleMessage) => {
      addLog(consoleMessage.text());
    });

    await dev({
      config: {
        source: {
          entry: {
            index: join(tempSrc, 'index.tsx'),
          },
        },
      },
    });

    await expectLog('[rsbuild] WebSocket connected.');
  },
);

rspackTest(
  'should inherit root logLevel when dev.client.logLevel is not set',
  async ({ page, dev, logHelper, copySrcDir }) => {
    const tempSrc = await copySrcDir();
    const { addLog, expectNoLog } = logHelper;

    page.on('console', (consoleMessage) => {
      addLog(consoleMessage.text());
    });

    await dev({
      config: {
        logLevel: 'error',
        source: {
          entry: {
            index: join(tempSrc, 'index.tsx'),
          },
        },
      },
    });

    const locator = page.locator('#test');
    await expect(locator).toHaveText('Hello Rsbuild');
    expect(expectNoLog('[rsbuild] WebSocket connected.')).toBe(true);
  },
);

rspackTest(
  'should suppress all logs when dev.client.logLevel is silent',
  async ({ page, dev, logHelper, copySrcDir }) => {
    const tempSrc = await copySrcDir();
    const { addLog, expectNoLog } = logHelper;

    page.on('console', (consoleMessage) => {
      addLog(consoleMessage.text());
    });

    await dev({
      config: {
        dev: {
          client: {
            logLevel: 'silent',
          },
        },
        source: {
          entry: {
            index: join(tempSrc, 'index.tsx'),
          },
        },
      },
    });

    const locator = page.locator('#test');
    await expect(locator).toHaveText('Hello Rsbuild');
    expect(expectNoLog('[rsbuild]')).toBe(true);
  },
);

rspackTest(
  'should inherit silent mode from root logLevel',
  async ({ page, dev, logHelper, copySrcDir }) => {
    const tempSrc = await copySrcDir();
    const { addLog, expectNoLog } = logHelper;

    page.on('console', (consoleMessage) => {
      addLog(consoleMessage.text());
    });

    await dev({
      config: {
        logLevel: 'silent',
        source: {
          entry: {
            index: join(tempSrc, 'index.tsx'),
          },
        },
      },
    });

    const locator = page.locator('#test');
    await expect(locator).toHaveText('Hello Rsbuild');
    expect(expectNoLog('[rsbuild]')).toBe(true);
  },
);
