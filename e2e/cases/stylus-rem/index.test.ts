import { expect, test } from '@playwright/test';
import { build } from '@scripts/shared';
import { pluginStylus } from '@rsbuild/plugin-stylus';
import { pluginRem } from '@rsbuild/plugin-rem';

test('should compile stylus and rem correctly', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    plugins: [pluginStylus(), pluginRem()],
  });
  const files = await rsbuild.unwrapOutputJSON();

  const content =
    files[Object.keys(files).find((file) => file.endsWith('.css'))!];

  if (rsbuild.providerType === 'rspack') {
    expect(content).toEqual(
      'body{color:#f00;font:.28rem Arial,sans-serif}.title-class-_6c2f8{font-size:.28rem}',
    );
  } else {
    expect(content).toEqual(
      'body{color:red;font:.28rem Arial,sans-serif}.title-class-XQprme{font-size:.28rem}',
    );
  }
});
