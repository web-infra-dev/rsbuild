import { build, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest(
  'should allow to configure Stylus plugin for specific environment',
  async () => {
    const rsbuild = await build({
      cwd: __dirname,
    });
    const files = await rsbuild.getDistFiles();

    const content =
      files[Object.keys(files).find((file) => file.endsWith('.css'))!];

    expect(content).toMatch(
      /body{color:red;font:14px Arial,sans-serif}\.title-class-\w{6}{font-size:14px}/,
    );
  },
);
