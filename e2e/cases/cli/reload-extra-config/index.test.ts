import { exec } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { awaitFileExists } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should restart dev server and reload config when extra config file changed', async () => {
  const distPath = 'dist';
  const dist = path.join(__dirname, distPath);

  const extraConfigPath = './server.ts';
  const extraConfigFile = path.join(__dirname, extraConfigPath);

  const configFile = path.join(__dirname, 'rsbuild.config.ts');

  fs.rmSync(extraConfigFile, { force: true });
  fs.rmSync(configFile, { force: true });
  fs.rmSync(dist, { recursive: true, force: true });

  // configs/server.ts
  fs.writeFileSync(extraConfigFile, 'export default {};');

  // rsbuild.config.ts
  fs.writeFileSync(
    configFile,
    `
    import { defineConfig } from '@rsbuild/core';
    import server from '${extraConfigPath}';

    export default defineConfig({
      dev: {
        writeToDisk: true,
        watchFiles: {
          type: 'reload-server',
          paths: ['${extraConfigPath}'],
        }
      },
      output: {
        distPath: {
          root: '${distPath}',
        },
      },
      server,
    });`,
  );

  const process = exec('npx rsbuild dev', {
    cwd: __dirname,
  });

  await awaitFileExists(dist);

  fs.rmSync(dist, { recursive: true });
  // configs/server.ts changed
  fs.writeFileSync(extraConfigFile, 'export default {};');

  await awaitFileExists(dist);

  process.kill();
});

test('should not restart dev server when extra config file changed but `dev.watchFiles.type` is not set to `reload-server`', async () => {
  const distPath = 'dist';
  const dist = path.join(__dirname, distPath);

  const extraConfigPath = './server.ts';
  const extraConfigFile = path.join(__dirname, extraConfigPath);

  const configFile = path.join(__dirname, 'rsbuild.config.ts');

  fs.rmSync(extraConfigFile, { force: true });
  fs.rmSync(configFile, { force: true });
  fs.rmSync(dist, { recursive: true, force: true });

  // configs/server.ts
  fs.writeFileSync(extraConfigFile, 'export default {};');

  // rsbuild.config.ts
  fs.writeFileSync(
    configFile,
    `
    import { defineConfig } from '@rsbuild/core';
    import server from '${extraConfigPath}';

    export default defineConfig({
      dev: {
        writeToDisk: true,
        watchFiles: {
          // should not restart dev server
          type: 'foo',
          paths: ['${extraConfigPath}'],
        }
      },
      output: {
        distPath: {
          root: '${distPath}',
        },
      },
      server,
    });`,
  );

  const process = exec('npx rsbuild dev', {
    cwd: __dirname,
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
