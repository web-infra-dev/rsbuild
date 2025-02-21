import { build, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest('should compile CSS Modules correctly', async () => {
  const rsbuild = await build({
    cwd: __dirname,
  });
  const files = await rsbuild.unwrapOutputJSON();

  const content =
    files[Object.keys(files).find((file) => file.endsWith('.css'))!];

  expect(content).toMatch(
    /\.the-a-class{color:red}\.the-b-class-\w{6}{color:#00f}\.the-c-class-\w{6}{color:#ff0}\.the-d-class{color:green}/,
  );
});

rspackOnlyTest(
  'should compile CSS Modules follow by output.cssModules',
  async () => {
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
      /.the-a-class{color:red}.the-b-class-\w{6}{color:#00f}.the-c-class{color:#ff0}.the-d-class{color:green}/,
    );
  },
);

rspackOnlyTest(
  'should compile CSS Modules follow by output.cssModules custom localIdentName',
  async () => {
    const rsbuild = await build({
      cwd: __dirname,
      rsbuildConfig: {
        output: {
          cssModules: {
            localIdentName: '[hash:base64:8]',
          },
        },
      },
    });
    const files = await rsbuild.unwrapOutputJSON();

    const content =
      files[Object.keys(files).find((file) => file.endsWith('.css'))!];

    expect(content).toMatch(
      /\.the-a-class{color:red}\.\w{8}{color:#00f}\.\w{8}{color:#ff0}\.the-d-class{color:green}/,
    );
  },
);

rspackOnlyTest(
  'should compile CSS Modules follow by output.cssModules custom localIdentName - hashDigest',
  async () => {
    const rsbuild = await build({
      cwd: __dirname,
      rsbuildConfig: {
        output: {
          cssModules: {
            localIdentName: '[hash:hex:4]',
          },
        },
      },
    });
    const files = await rsbuild.unwrapOutputJSON();

    const content =
      files[Object.keys(files).find((file) => file.endsWith('.css'))!];

    expect(content).toMatch(
      /\.the-a-class{color:red}\.\w{4}{color:#00f}\.\w{4}{color:#ff0}\.the-d-class{color:green}/,
    );
  },
);
