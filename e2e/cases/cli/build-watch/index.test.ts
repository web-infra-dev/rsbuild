import path from 'node:path';
import { expectFileWithContent, rspackOnlyTest, runCli } from '@e2e/helper';
import fse, { remove } from 'fs-extra';

rspackOnlyTest('should support watch mode for build command', async () => {
  const indexFile = path.join(__dirname, 'src/index.js');
  const distIndexFile = path.join(__dirname, 'dist/static/js/index.js');
  await remove(indexFile);
  await remove(distIndexFile);

  fse.outputFileSync(indexFile, `console.log('hello!');`);

  const childProcess = runCli('build --watch', {
    cwd: __dirname,
  });

  await expectFileWithContent(distIndexFile, 'hello!');
  await remove(distIndexFile);

  fse.outputFileSync(indexFile, `console.log('hello2!');`);
  await expectFileWithContent(distIndexFile, 'hello2!');

  childProcess.kill();
});
