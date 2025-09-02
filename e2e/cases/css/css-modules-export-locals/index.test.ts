import { type BuildResult, build, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

declare global {
  interface Window {
    [key: string]: Record<string, string>;
  }
}

const expectCSSContext = async (rsbuild: BuildResult) => {
  const files = await rsbuild.getDistFiles();
  const content =
    files[Object.keys(files).find((file) => file.endsWith('.css'))!];
  expect(content).toMatch(
    /\.the-dash-class-\w{6}{color:#00f}\.theCamelClass-\w{6}{color:red}\.the_underscore_class-\w{6}{color:green}/,
  );
};

rspackOnlyTest(
  'should compile CSS Modules with exportLocalsConvention camelCaseOnly',
  async ({ page }) => {
    const rsbuild = await build({
      cwd: __dirname,
      page,
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

    await rsbuild.close();
  },
);

rspackOnlyTest(
  'should compile CSS Modules with exportLocalsConvention camelCase',
  async ({ page }) => {
    const rsbuild = await build({
      cwd: __dirname,
      page,
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

    await rsbuild.close();
  },
);

rspackOnlyTest(
  'should compile CSS Modules with exportLocalsConvention dashes',
  async ({ page }) => {
    const rsbuild = await build({
      cwd: __dirname,
      page,
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

    await rsbuild.close();
  },
);

rspackOnlyTest(
  'should compile CSS Modules with exportLocalsConvention dashesOnly',
  async ({ page }) => {
    const rsbuild = await build({
      cwd: __dirname,
      page,
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

    await rsbuild.close();
  },
);

rspackOnlyTest(
  'should compile CSS Modules with exportLocalsConvention asIs',
  async ({ page }) => {
    const rsbuild = await build({
      cwd: __dirname,
      page,
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

    await rsbuild.close();
  },
);
