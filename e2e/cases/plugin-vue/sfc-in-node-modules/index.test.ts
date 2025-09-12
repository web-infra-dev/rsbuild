import path from 'node:path';
import { expect, rspackOnlyTest } from '@e2e/helper';
import fse from 'fs-extra';

rspackOnlyTest(
  'should transpile Vue SFC in node_modules correctly',
  async ({ build, buildOnly }) => {
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

    const rsbuild = await buildOnly();

    const content = await rsbuild.getIndexBundle();
    expect(content).not.toContain('window?.foo');
    // should transpile optional chaining
    expect(content).toContain('test:null==');
  },
);
