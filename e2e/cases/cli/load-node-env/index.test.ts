import fs from 'node:fs';
import path from 'node:path';
import { expect, rspackTest } from '@e2e/helper';

// see: https://github.com/web-infra-dev/rsbuild/issues/2904
rspackTest(
  'should load .env config and set NODE_ENV as expected',
  async ({ execCliSync }) => {
    execCliSync('build');
    expect(
      fs.existsSync(path.join(__dirname, 'dist/development')),
    ).toBeTruthy();
  },
);
