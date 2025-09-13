import fs from 'node:fs';
import path from 'node:path';
import { expectFile, getRandomPort, rspackTest, runCli } from '@e2e/helper';
import { remove } from 'fs-extra';

rspackTest(
  'should restart dev server and reload config when config file changed',
  async () => {
    const dist1 = path.join(__dirname, 'dist');
    const dist2 = path.join(__dirname, 'dist-2');
    const configFile = path.join(__dirname, 'rsbuild.config.mjs');

    await remove(dist1);
    await remove(dist2);
    await remove(configFile);

    fs.writeFileSync(
      configFile,
      `export default {
      dev: {
        writeToDisk: true,
      },
      output: {
        distPath: {
          root: 'dist',
        },
      },
      server: { port: ${await getRandomPort()} }
    };`,
    );

    const { close } = runCli('dev', {
      cwd: __dirname,
    });

    await expectFile(dist1);

    fs.writeFileSync(
      configFile,
      `export default {
      dev: {
        writeToDisk: true,
      },
      output: {
        distPath: {
          root: 'dist-2',
        },
      },
      server: { port: ${await getRandomPort()} }
    };`,
    );

    await expectFile(dist2);

    close();
  },
);
