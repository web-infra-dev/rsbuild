import { expect, rspackTest } from '@e2e/helper';

rspackTest('support SSR', async ({ page, devOnly }) => {
  const rsbuild = await devOnly();

  const url = new URL(`http://localhost:${rsbuild.port}`);

  const res = await page.goto(url.href);

  expect(await res?.text()).toMatch(/Rsbuild with React/);

  await page.goto(url.href);

  // bundle result should cacheable and only load once.
  expect(rsbuild.logs.filter((log) => log.includes('load SSR')).length).toBe(1);
});

rspackTest('support SSR with external', async ({ page, devOnly }) => {
  const rsbuild = await devOnly({
    config: {
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
  expect(rsbuild.logs.filter((log) => log.includes('load SSR')).length).toBe(1);
});

rspackTest('support SSR with esm target', async ({ page, devOnly }) => {
  process.env.TEST_ESM_LIBRARY = '1';

  const rsbuild = await devOnly();

  const url1 = new URL(`http://localhost:${rsbuild.port}`);

  const res = await page.goto(url1.href);

  expect(await res?.text()).toMatch(/Rsbuild with React/);

  delete process.env.TEST_ESM_LIBRARY;
});

rspackTest(
  'support SSR with esm target & external',
  async ({ page, devOnly }) => {
    process.env.TEST_ESM_LIBRARY = '1';

    const rsbuild = await devOnly({
      config: {
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

    delete process.env.TEST_ESM_LIBRARY;
  },
);

rspackTest('support SSR with split chunk', async ({ page, devOnly }) => {
  process.env.TEST_SPLIT_CHUNK = '1';

  const rsbuild = await devOnly();

  const url1 = new URL(`http://localhost:${rsbuild.port}`);

  const res = await page.goto(url1.href);

  expect(await res?.text()).toMatch(/Rsbuild with React/);

  delete process.env.TEST_SPLIT_CHUNK;
});
