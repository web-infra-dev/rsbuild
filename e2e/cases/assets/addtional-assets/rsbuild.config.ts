import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { defineConfig } from '@rsbuild/core';

writeFileSync(
  join(__dirname, 'src/test-temp-small.json5'),
  JSON.stringify({ a: 1 }),
);
writeFileSync(
  join(__dirname, 'src/test-temp-large.json5'),
  JSON.stringify({ a: '1'.repeat(10000) }),
);

export default defineConfig({
  source: {
    assetsInclude: /\.json5$/,
  },
  output: {
    filenameHash: false,
  },
});
