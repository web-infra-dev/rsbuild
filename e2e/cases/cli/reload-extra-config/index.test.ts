import { exec } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { awaitFileExists } from '@e2e/helper';
import { expect, test } from '@playwright/test';

const extraConfigPath = './test-temp-config.ts';

test('should restart dev server and reload config when extra config file changed', async () => {
  const dist = path.join(__dirname, 'dist');
  const extraConfigFile = path.join(__dirname, extraConfigPath);

  fs.rmSync(extraConfigFile, { force: true });
  fs.rmSync(dist, { recursive: true, force: true });

  // configs/server.ts
  fs.writeFileSync(extraConfigFile, 'export default {};');

  const process = exec('npx rsbuild dev', {
    cwd: __dirname,
    env: {
      WATCH_FILES_TYPE: 'reload-server',
    },
  });

  await awaitFileExists(dist);

  fs.rmSync(dist, { recursive: true });
  // configs/server.ts changed
  fs.writeFileSync(extraConfigFile, 'export default {};');

  // rebuild and generate dist files
  await awaitFileExists(dist);
  expect(fs.existsSync(path.join(dist, 'temp.txt')));

  process.kill();
});

test('should not restart dev server when extra config file changed but `dev.watchFiles.type` is not set to `reload-server`', async () => {
  const dist = path.join(__dirname, 'dist');
  const extraConfigFile = path.join(__dirname, extraConfigPath);

  fs.rmSync(extraConfigFile, { force: true });
  fs.rmSync(dist, { recursive: true, force: true });

  // configs/server.ts
  fs.writeFileSync(extraConfigFile, 'export default {};');

  const process = exec('npx rsbuild dev', {
    cwd: __dirname,
    env: {
      WATCH_FILES_TYPE: 'reload-page',
    },
  });

  await awaitFileExists(dist);

  fs.rmSync(dist, { recursive: true });
  // configs/server.ts changed
  fs.writeFileSync(extraConfigFile, 'export default {};');

  await expect(awaitFileExists(dist)).rejects.toThrow(
    `awaitFileExists failed: ${dist}`,
  );

  process.kill();
});
