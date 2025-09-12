import { expect, rspackOnlyTest } from '@e2e/helper';

rspackOnlyTest(
  'should allow to configure `cssLoader.exportType` as `string` in development',
  async ({ page, dev }) => {
    await dev();

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
  },
);

rspackOnlyTest(
  'should allow to configure `cssLoader.exportType` as `string` in production',
  async ({ page, build }) => {
    await build();

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
  },
);
