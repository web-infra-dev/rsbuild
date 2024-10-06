import { exec } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { awaitFileExists, getRandomPort } from '@e2e/helper';
import { expect, test } from '@playwright/test';

const tempConfigPath = './test-temp-config.ts';

test('should restart dev server when extra config file changed', async () => {
  const dist = path.join(__dirname, 'dist');
  const extraConfigFile = path.join(__dirname, tempConfigPath);

  fs.rmSync(extraConfigFile, { force: true });
  fs.rmSync(dist, { recursive: true, force: true });
  fs.writeFileSync(extraConfigFile, 'export default { foo: 1 };');

  const childProcess = exec('npx rsbuild dev', {
    cwd: __dirname,
    env: {
      ...process.env,
      PORT: String(await getRandomPort()),
    },
  });

  await awaitFileExists(dist);

  fs.rmSync(dist, { recursive: true });
  // temp config changed
  fs.writeFileSync(extraConfigFile, 'export default { foo: 2 };');

  // rebuild and generate dist files
  await awaitFileExists(dist);
  expect(fs.existsSync(path.join(dist, 'temp.txt')));

  childProcess.kill();
});
