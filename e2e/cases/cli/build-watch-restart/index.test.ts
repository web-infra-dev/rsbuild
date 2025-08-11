import path from 'node:path';
import { expectFileWithContent, rspackOnlyTest, runCli } from '@e2e/helper';
import fse, { remove } from 'fs-extra';

rspackOnlyTest('should support restart build when config changed', async () => {
  const indexFile = path.join(__dirname, 'src/index.js');
  const distIndexFile = path.join(__dirname, 'dist/static/js/index.js');
  await remove(indexFile);
  await remove(distIndexFile);
  const tempConfigFile = path.join(__dirname, 'test-temp-rsbuild.config.mjs');

  fse.outputFileSync(
    tempConfigFile,
    `export default {
  output: {
    filenameHash: false,
  },
};
`,
  );

  fse.outputFileSync(indexFile, `console.log('hello!');`);

  const childProcess = runCli(`build --watch -c ${tempConfigFile}`, {
    cwd: __dirname,
  });

  await expectFileWithContent(distIndexFile, 'hello!');
  await remove(distIndexFile);

  fse.outputFileSync(
    tempConfigFile,
    `export default {
  // update
  output: {
    filenameHash: false,
  },
};
`,
  );

  await expectFileWithContent(distIndexFile, 'hello!');
  await remove(distIndexFile);

  fse.outputFileSync(indexFile, `console.log('hello2!');`);
  await expectFileWithContent(distIndexFile, 'hello2!');

  childProcess.kill();
});
