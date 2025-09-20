import path from 'node:path';
import { expectFileWithContent, rspackTest } from '@e2e/helper';
import fse from 'fs-extra';

rspackTest(
  'should support restart build when config changed',
  async ({ execCli, logHelper }) => {
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

    execCli(`build --watch -c ${tempConfig}`);
    const { clearLogs, expectLog, expectBuildEnd } = logHelper;

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
  },
);
