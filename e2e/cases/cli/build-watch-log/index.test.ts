import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@e2e/helper';
import { waitForFileContent } from '@rstackjs/test-utils';

const watchingLog = 'watching for changes...';

for (const environment of [['web'], ['web', 'node']]) {
  test(`should log only after the first watch build for ${environment.join(', ')}`, async ({
    execCli,
    copySrcDir,
    editFile,
    logHelper,
  }) => {
    await copySrcDir();
    execCli(`build --watch --environment ${environment.join(',')}`);
    await logHelper.expectLog(watchingLog);

    const bundles = environment.map((name) =>
      path.join(
        import.meta.dirname,
        'dist',
        name,
        name === 'node' ? 'index.js' : 'static/js/index.js',
      ),
    );
    for (const bundle of bundles) {
      expect(fs.readFileSync(bundle, 'utf8')).toContain('initial');
    }
    expect(
      logHelper.logs.join('').match(/watching for changes\.\.\./g),
    ).toHaveLength(1);

    logHelper.clearLogs();
    await editFile('test-temp-src/index.js', (code) =>
      code.replace('initial', 'updated'),
    );
    await logHelper.expectLog('building test-temp-src/index.js', {
      posix: true,
    });
    await logHelper.expectBuildEnd();

    for (const bundle of bundles) {
      await waitForFileContent(bundle, 'updated');
    }

    logHelper.expectNoLog(watchingLog);
  });
}

test('should not log watching for a regular build', async ({
  execCliSync,
  copySrcDir,
}) => {
  await copySrcDir();
  expect(execCliSync('build')).not.toContain(watchingLog);
});
