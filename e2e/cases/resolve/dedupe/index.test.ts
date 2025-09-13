import { join } from 'node:path';

import { expect, test } from '@e2e/helper';
import { outputFileSync } from 'fs-extra';

function writeDuplicatedPackage(flag: string) {
  const fooPath = join(__dirname, 'node_modules', 'foo');
  outputFileSync(
    join(fooPath, 'package.json'),
    JSON.stringify({ name: 'foo', version: '1.0.0' }),
  );
  outputFileSync(
    join(fooPath, 'index.js'),
    'import React from "react";export default React;',
  );
  outputFileSync(
    join(fooPath, 'node_modules', 'react', 'package.json'),
    JSON.stringify({ name: 'react', version: '1.0.0' }),
  );
  outputFileSync(
    join(fooPath, 'node_modules', 'react', 'index.js'),
    `console.log("${flag}");`,
  );
}

test('should dedupe specified packages as expected', async ({ build }) => {
  const flag = 'This is fake React';
  writeDuplicatedPackage(flag);

  const rsbuild = await build();

  const content = await rsbuild.getIndexBundle();
  expect(content).not.toContain(flag);
});
