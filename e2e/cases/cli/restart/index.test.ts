import path from 'path';
import { exec } from 'child_process';
import { test } from '@playwright/test';
import { fse } from '@rsbuild/shared';
import { awaitFileExists } from '@scripts/helper';

test('should restart dev server and reload config when config file changed', async () => {
  const dist1 = path.join(__dirname, 'dist');
  const dist2 = path.join(__dirname, 'dist-2');
  const configFile = path.join(__dirname, 'rsbuild.config.mjs');
  await fse.remove(dist1);
  await fse.remove(dist2);
  await fse.remove(configFile);

  fse.writeFileSync(
    configFile,
    `export default {
      output: {
        distPath: {
          root: 'dist',
        },
      },
    };`,
  );

  const process = exec('npx rsbuild dev', {
    cwd: __dirname,
  });

  await awaitFileExists(dist1);

  fse.writeFileSync(
    configFile,
    `export default {
      output: {
        distPath: {
          root: 'dist-2',
        },
      },
    };`,
  );

  await awaitFileExists(dist2);

  process.kill();
});
