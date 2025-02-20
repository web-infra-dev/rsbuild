import fs from 'node:fs';
import path from 'node:path';
import { build, proxyConsole, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest('should compile nested npm import correctly', async () => {
  const { restore, logs } = proxyConsole();

  fs.cpSync(
    path.resolve(__dirname, '_node_modules'),
    path.resolve(__dirname, 'node_modules'),
    { recursive: true },
  );

  const rsbuild = await build({
    cwd: __dirname,
  });

  const files = await rsbuild.unwrapOutputJSON();
  const cssFiles = Object.keys(files).find((file) => file.endsWith('.css'))!;

  expect(files[cssFiles]).toEqual(
    '#b{color:#ff0}#c{color:green}#a{font-size:10px}html{font-size:18px}',
  );

  // there will be a deprecation log for `~`.
  expect(
    logs.some((log) => log.includes(`a request starts with '~' is deprecated`)),
  );

  restore();
});
