import { expect, rspackTest } from '@e2e/helper';

rspackTest(
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

rspackTest(
  'should allow to configure `cssLoader.exportType` as `string` in production',
  async ({ page, buildPreview }) => {
    await buildPreview();

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
