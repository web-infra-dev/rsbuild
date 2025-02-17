import { join } from 'node:path';
import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';
import fse from 'fs-extra';

function writeDuplicatedPackage(flag: string) {
  const fooPath = join(import.meta.dirname, 'node_modules', 'foo');
  fse.outputFileSync(
    join(fooPath, 'package.json'),
    JSON.stringify({ name: 'foo', version: '1.0.0' }),
  );
  fse.outputFileSync(
    join(fooPath, 'index.js'),
    'import React from "react";export default React;',
  );
  fse.outputFileSync(
    join(fooPath, 'node_modules', 'react', 'package.json'),
    JSON.stringify({ name: 'react', version: '1.0.0' }),
  );
  fse.outputFileSync(
    join(fooPath, 'node_modules', 'react', 'index.js'),
    `console.log("${flag}");`,
  );
}

test('should dedupe specified packages as expected', async () => {
  const flag = 'This is fake React';
  writeDuplicatedPackage(flag);

  const rsbuild = await build({
    cwd: import.meta.dirname,
  });

  const { content } = await rsbuild.getIndexFile();
  expect(content).not.toContain(flag);
});
