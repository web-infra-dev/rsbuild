import path from 'node:path';
import { build, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';
import fse from 'fs-extra';

rspackOnlyTest(
  'should transpile Vue SFC in node_modules correctly',
  async () => {
    fse.outputFileSync(
      path.resolve(__dirname, 'node_modules/foo/package.json'),
      JSON.stringify({
        name: 'foo',
        version: '1.0.0',
        main: 'index.vue',
      }),
    );
    fse.outputFileSync(
      path.resolve(__dirname, 'node_modules/foo/index.vue'),
      '<template><div :test="window?.foo" /></template>',
    );

    const rsbuild = await build({
      cwd: __dirname,
    });

    const content = await rsbuild.getIndexBundle();
    expect(content).not.toContain('window?.foo');
    // should transpile optional chaining
    expect(content).toContain('test:null==');
  },
);
