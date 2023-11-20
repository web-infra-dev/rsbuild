import { expect, test } from '@playwright/test';
import { build } from '@scripts/shared';

// TODO: uni-builder
test.skip('should treat normal CSS as CSS modules when disableCssModuleExtension is true', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    rsbuildConfig: {
      output: {
        disableSourceMap: true,
        // disableCssModuleExtension: true,
      },
    },
  });
  const files = await rsbuild.unwrapOutputJSON();

  const content =
    files[Object.keys(files).find((file) => file.endsWith('.css'))!];

  if (rsbuild.providerType === 'rspack') {
    expect(content).toEqual(
      '.the-a-class-_932a3{color:red}.the-b-class-_6773e{color:blue}.the-c-class-c855fd{color:yellow}.the-d-class{color:green}',
    );
  } else {
    expect(content).toEqual(
      '.the-a-class-azoWcU{color:red}.the-b-class-_HnKpz{color:blue}.the-c-class-e94QZl{color:#ff0}.the-d-class{color:green}',
    );
  }
});
