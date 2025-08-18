import path from 'node:path';
import { expectFileWithContent, rspackOnlyTest, runCli } from '@e2e/helper';
import fse from 'fs-extra';

rspackOnlyTest('should support restart build when config changed', async () => {
  const indexFile = path.join(__dirname, 'src/index.js');
  const distIndexFile = path.join(__dirname, 'dist/static/js/index.js');
  const tempConfig = path.join(__dirname, 'test-temp-rsbuild.config.mjs');

  fse.outputFileSync(indexFile, `console.log('hello!');`);
  fse.outputFileSync(
    tempConfig,
    `export default {
  output: {
    filenameHash: false,
  },
};
`,
  );

  const { close, clearLogs, expectLog, expectBuildEnd } = runCli(
    `build --watch -c ${tempConfig}`,
    {
      cwd: __dirname,
    },
  );

  await expectBuildEnd();
  await expectFileWithContent(distIndexFile, 'hello!');

  fse.outputFileSync(
    tempConfig,
    `export default {
  // update
  output: {
    filenameHash: false,
  },
};
`,
  );

  await expectLog('restarting build');
  await expectFileWithContent(distIndexFile, 'hello!');

  clearLogs();
  fse.outputFileSync(indexFile, `console.log('hello2!');`);
  await expectBuildEnd();
  await expectFileWithContent(distIndexFile, 'hello2!');

  close();
});
