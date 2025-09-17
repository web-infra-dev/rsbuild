import fs from 'node:fs';
import { join } from 'node:path';

import { expect, test } from '@e2e/helper';

test('should output nested HTML structure when html.outputStructure is `nested`', async ({
  build,
}) => {
  const rsbuild = await build();

  const pagePath = join(rsbuild.distPath, 'index/index.html');

  expect(fs.existsSync(pagePath)).toBeTruthy();
});
