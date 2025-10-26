import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, rspackTest } from '@e2e/helper';

rspackTest(
  'should import raw JSON with raw query',
  async ({ page, buildPreview }) => {
    await buildPreview();

    expect(await page.evaluate('window.a')).toBe(
      readFileSync(join(__dirname, './src/a.json'), 'utf-8'),
    );
    expect(await page.evaluate('window.b')).toBe(
      readFileSync(join(__dirname, './src/b.json'), 'utf-8'),
    );
  },
);
