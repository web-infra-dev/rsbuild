import { expect, test } from '@playwright/test';
import { build } from '@scripts/shared';

test('should compile CSS modules correctly', async () => {
  const rsbuild = await build({
    cwd: __dirname,
  });
  const files = await rsbuild.unwrapOutputJSON();

  const content =
    files[Object.keys(files).find((file) => file.endsWith('.css'))!];

  expect(content).toMatch(
    /\.the-a-class{color:red}\.the-b-class-\w{6}{color:blue}\.the-c-class-\w{6}{color:yellow}\.the-d-class{color:green}/,
  );
});

test('should compile CSS modules follow by output.cssModules', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    rsbuildConfig: {
      output: {
        cssModules: {
          auto: (resource) => {
            return resource.includes('.scss');
          },
        },
      },
    },
  });
  const files = await rsbuild.unwrapOutputJSON();

  const content =
    files[Object.keys(files).find((file) => file.endsWith('.css'))!];

  expect(content).toMatch(
    /.the-a-class{color:red}.the-b-class-\w{6}{color:blue}.the-c-class{color:yellow}.the-d-class{color:green}/,
  );
});
