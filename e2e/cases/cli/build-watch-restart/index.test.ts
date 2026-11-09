import path from 'node:path';
import { test } from '@e2e/helper';
import { waitForFileContent } from '@rstackjs/test-utils';
import fse from 'fs-extra';

test('should support restart build when config changed', async ({
  execCli,
  logHelper,
}) => {
  const indexFile = path.join(import.meta.dirname, 'src/index.js');
  const distIndexFile = path.join(
    import.meta.dirname,
    'dist/static/js/index.js',
  );
  const tempConfig = path.join(
    import.meta.dirname,
    'test-temp-rsbuild.config.mjs',
  );

  // TODO: Re-enable build cache when this test waits for the restart watcher to be ready.
  const config = `export default {
  performance: { buildCache: false },
  output: {
    filenameHash: false,
  },
};
`;
  fse.outputFileSync(indexFile, `console.log('hello!');`);
  fse.outputFileSync(tempConfig, config);

  execCli(`build --watch -c ${tempConfig}`);
  const { clearLogs, expectLog, expectBuildEnd } = logHelper;

  await expectBuildEnd();
  await waitForFileContent(distIndexFile, 'hello!');

  fse.outputFileSync(tempConfig, `${config}// update\n`);

  await expectLog('restarting build');
  await waitForFileContent(distIndexFile, 'hello!');

  clearLogs();
  fse.outputFileSync(indexFile, `console.log('hello2!');`);
  await expectBuildEnd();
  await waitForFileContent(distIndexFile, 'hello2!');
});
