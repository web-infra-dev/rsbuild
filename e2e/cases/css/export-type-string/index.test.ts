import { build, dev, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest(
  'should allow to configure `cssLoader.exportType` as `string` in development',
  async ({ page }) => {
    const rsbuild = await dev({
      cwd: __dirname,
      page,
    });

    expect(await page.evaluate('window.a')).toBe(`.the-a-class {
  color: red;
}

.the-a-class .child-class {
  color: #00f;
}
`);

    expect(
      (await page.evaluate<string>('window.b')).includes(
        '.src-b-module__the-b-class',
      ),
    ).toBeTruthy();

    await rsbuild.close();
  },
);

rspackOnlyTest(
  'should allow to configure `cssLoader.exportType` as `string` in production',
  async ({ page }) => {
    const rsbuild = await build({
      cwd: __dirname,
      page,
    });

    expect(await page.evaluate('window.a')).toBe(`.the-a-class {
  color: red;
}

.the-a-class .child-class {
  color: #00f;
}
`);

    expect(
      (await page.evaluate<string>('window.b')).includes('.the-b-class-'),
    ).toBeTruthy();

    await rsbuild.close();
  },
);
