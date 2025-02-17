import { dev, proxyConsole, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest('support SSR', async ({ page }) => {
  const { logs, restore } = proxyConsole('log');

  const rsbuild = await dev({
    cwd: import.meta.dirname,
    rsbuildConfig: {},
  });

  const url = new URL(`http://localhost:${rsbuild.port}`);

  const res = await page.goto(url.href);

  expect(await res?.text()).toMatch(/Rsbuild with React/);

  await page.goto(url.href);

  // bundle result should cacheable and only load once.
  expect(logs.filter((log) => log.includes('load SSR')).length).toBe(1);

  await rsbuild.close();

  restore();
});

rspackOnlyTest('support SSR with external', async ({ page }) => {
  const { logs, restore } = proxyConsole('log');

  const rsbuild = await dev({
    cwd: import.meta.dirname,
    rsbuildConfig: {
      output: {
        externals: {
          react: 'react',
          'react-dom': 'react-dom',
        },
      },
    },
  });

  const url = new URL(`http://localhost:${rsbuild.port}`);

  const res = await page.goto(url.href);

  expect(await res?.text()).toMatch(/Rsbuild with React/);

  await page.goto(url.href);

  // bundle result should cacheable and only load once.
  expect(logs.filter((log) => log.includes('load SSR')).length).toBe(1);

  await rsbuild.close();

  restore();
});

rspackOnlyTest('support SSR with esm target', async ({ page }) => {
  process.env.TEST_ESM_LIBRARY = '1';

  const rsbuild = await dev({
    cwd: import.meta.dirname,
    rsbuildConfig: {},
  });

  const url1 = new URL(`http://localhost:${rsbuild.port}`);

  const res = await page.goto(url1.href);

  expect(await res?.text()).toMatch(/Rsbuild with React/);

  await rsbuild.close();

  delete process.env.TEST_ESM_LIBRARY;
});

rspackOnlyTest('support SSR with esm target & external', async ({ page }) => {
  process.env.TEST_ESM_LIBRARY = '1';

  const rsbuild = await dev({
    cwd: import.meta.dirname,
    rsbuildConfig: {
      output: {
        externals: {
          react: 'react',
          'react-dom': 'react-dom',
        },
      },
    },
  });

  const url1 = new URL(`http://localhost:${rsbuild.port}`);

  const res = await page.goto(url1.href);

  expect(await res?.text()).toMatch(/Rsbuild with React/);

  await rsbuild.close();

  delete process.env.TEST_ESM_LIBRARY;
});

rspackOnlyTest('support SSR with split chunk', async ({ page }) => {
  process.env.TEST_SPLIT_CHUNK = '1';

  const rsbuild = await dev({
    cwd: import.meta.dirname,
    rsbuildConfig: {},
  });

  const url1 = new URL(`http://localhost:${rsbuild.port}`);

  const res = await page.goto(url1.href);

  expect(await res?.text()).toMatch(/Rsbuild with React/);

  await rsbuild.close();

  delete process.env.TEST_SPLIT_CHUNK;
});
