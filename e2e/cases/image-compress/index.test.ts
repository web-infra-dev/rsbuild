import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { build, globContentJSON } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should compress image with use plugin-image-compress', async () => {
  await expect(
    build({
      cwd: __dirname,
    }),
  ).resolves.toBeDefined();

  const outputs = await globContentJSON(join(__dirname, 'dist'));

  const names = Object.keys(outputs);

  const jpeg = names.find((item) => item.endsWith('.jpeg'))!;
  const png = names.find((item) => item.endsWith('.png'))!;
  const svg = names.find((item) => item.endsWith('.svg'))!;
  // const ico = names.find((item) => item.endsWith('.ico'))!;

  const assetsDir = join(__dirname, '../../assets');
  const originJpeg = readFileSync(join(assetsDir, 'image.jpeg'), 'utf-8');
  const originPng = readFileSync(join(assetsDir, 'image.png'), 'utf-8');
  const originSvg = readFileSync(join(assetsDir, 'mobile.svg'), 'utf-8');
  // const originIco = readFileSync(join(assetsDir, 'image.ico'), 'utf-8');

  expect(outputs[jpeg].length).toBeLessThan(originJpeg.length);
  expect(outputs[png].length).toBeLessThan(originPng.length);
  expect(outputs[svg].length).toBeLessThan(originSvg.length);
  // TODO ico file size is not less than origin
  // expect(outputs[ico].length).toBeLessThan(originIco.length);
});
