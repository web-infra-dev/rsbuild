import { build, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';
import { pluginRem } from '@rsbuild/plugin-rem';
import { pluginStylus } from '@rsbuild/plugin-stylus';

rspackOnlyTest('should compile stylus and rem correctly', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    plugins: [pluginStylus(), pluginRem()],
  });
  const files = await rsbuild.unwrapOutputJSON();

  const content =
    files[Object.keys(files).find((file) => file.endsWith('.css'))!];

  expect(content).toMatch(
    /body{color:red;font:\.28rem Arial,sans-serif}\.title-class-\w{6}{font-size:\.28rem}/,
  );
});
