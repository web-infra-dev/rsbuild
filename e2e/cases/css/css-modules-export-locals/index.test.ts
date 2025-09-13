import { type BuildResult, expect, rspackTest } from '@e2e/helper';

declare global {
  interface Window {
    [key: string]: Record<string, string>;
  }
}

const expectCSSContext = async (rsbuild: BuildResult) => {
  const files = rsbuild.getDistFiles();
  const content =
    files[Object.keys(files).find((file) => file.endsWith('.css'))!];
  expect(content).toMatch(
    /\.the-dash-class-\w{6}{color:#00f}\.theCamelClass-\w{6}{color:red}\.the_underscore_class-\w{6}{color:green}/,
  );
};

rspackTest(
  'should compile CSS Modules with exportLocalsConvention camelCaseOnly',
  async ({ page, buildPreview }) => {
    const rsbuild = await buildPreview({
      rsbuildConfig: {
        output: {
          cssModules: {
            exportLocalsConvention: 'camelCaseOnly',
          },
        },
      },
    });

    await expectCSSContext(rsbuild);

    const styles = await page.evaluate(() => window.styles);
    expect(Object.keys(styles)).toEqual([
      'theDashClass',
      'theCamelClass',
      'theUnderscoreClass',
    ]);
  },
);

rspackTest(
  'should compile CSS Modules with exportLocalsConvention camelCase',
  async ({ page, buildPreview }) => {
    const rsbuild = await buildPreview({
      rsbuildConfig: {
        output: {
          cssModules: {
            exportLocalsConvention: 'camelCase',
          },
        },
      },
    });

    await expectCSSContext(rsbuild);

    const styles = await page.evaluate(() => window.styles);
    expect(Object.keys(styles)).toEqual([
      'the-dash-class',
      'theDashClass',
      'theCamelClass',
      'the_underscore_class',
      'theUnderscoreClass',
    ]);
  },
);

rspackTest(
  'should compile CSS Modules with exportLocalsConvention dashes',
  async ({ page, buildPreview }) => {
    const rsbuild = await buildPreview({
      rsbuildConfig: {
        output: {
          cssModules: {
            exportLocalsConvention: 'dashes',
          },
        },
      },
    });

    await expectCSSContext(rsbuild);

    const styles = await page.evaluate(() => window.styles);
    expect(Object.keys(styles)).toEqual([
      'the-dash-class',
      'theDashClass',
      'theCamelClass',
      'the_underscore_class',
    ]);
  },
);

rspackTest(
  'should compile CSS Modules with exportLocalsConvention dashesOnly',
  async ({ page, buildPreview }) => {
    const rsbuild = await buildPreview({
      rsbuildConfig: {
        output: {
          cssModules: {
            exportLocalsConvention: 'dashesOnly',
          },
        },
      },
    });

    await expectCSSContext(rsbuild);

    const styles = await page.evaluate(() => window.styles);
    expect(Object.keys(styles)).toEqual([
      'theDashClass',
      'theCamelClass',
      'the_underscore_class',
    ]);
  },
);

rspackTest(
  'should compile CSS Modules with exportLocalsConvention asIs',
  async ({ page, buildPreview }) => {
    const rsbuild = await buildPreview({
      rsbuildConfig: {
        output: {
          cssModules: {
            exportLocalsConvention: 'asIs',
          },
        },
      },
    });

    await expectCSSContext(rsbuild);

    const styles = await page.evaluate(() => window.styles);
    expect(Object.keys(styles)).toEqual([
      'the-dash-class',
      'theCamelClass',
      'the_underscore_class',
    ]);
  },
);
