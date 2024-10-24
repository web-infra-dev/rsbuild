import { join } from 'node:path';
import { defineConfig } from '@rsbuild/core';
import { outputFileSync } from 'fs-extra';

outputFileSync(
  join(__dirname, 'src/assets/test-temp-small.json5'),
  JSON.stringify({ a: 1 }),
);
outputFileSync(
  join(__dirname, 'src/assets/test-temp-large.json5'),
  JSON.stringify({ a: '1'.repeat(10000) }),
);

export default defineConfig({
  output: {
    filenameHash: false,
  },
});
