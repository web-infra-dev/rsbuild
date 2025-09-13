import { expect, rspackTest } from '@e2e/helper';

rspackTest(
  'support SSR load esm with type module',
  async ({ page, devOnly }) => {
    const rsbuild = await devOnly();

    const url1 = new URL(`http://localhost:${rsbuild.port}`);

    const res = await page.goto(url1.href);

    expect(await res?.text()).toMatch(/Rsbuild with React/);
  },
);
