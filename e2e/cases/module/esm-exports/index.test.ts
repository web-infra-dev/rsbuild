import { execSync } from 'node:child_process';
import path from 'node:path';
import { expect, test } from '@e2e/helper';

// check for https://github.com/web-infra-dev/rsbuild/pull/809
test('should import ESM bundles correctly', () => {
  const mjsFilePath = path.join(__dirname, 'test.mjs');
  expect(() => execSync(`node ${mjsFilePath}`)).not.toThrow();
});
