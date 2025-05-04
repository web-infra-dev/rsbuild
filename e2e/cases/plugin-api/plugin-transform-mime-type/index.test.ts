import { build, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest(
  'should allow plugin to match data uri modules with `mimetype`',
  async () => {
    const rsbuild = await build({
      cwd: __dirname,
    });

    const indexJs = await rsbuild.getIndexFile();
    expect(indexJs.content).toContain('data-uri-bar');
  },
);
