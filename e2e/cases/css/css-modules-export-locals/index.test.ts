import { type BuildResult, expect, test } from '@e2e/helper';
import { getFileContent } from '@rstackjs/test-utils';

declare global {
  interface Window {
    styles: Record<string, string>;
  }
}

const expectCSSContext = (rsbuild: BuildResult) => {
  const files = rsbuild.getDistFiles();
  const content = getFileContent(files, 'index.css');
  expect(content).toMatch(
    /\.the-dash-class-\w{6}{color:#00f}\.theCamelClass-\w{6}{color:red}\.the_underscore_class-\w{6}{color:green}/,
  );
};

test('should compile CSS Modules with exportLocalsConvention camelCaseOnly', async ({
  page,
  buildPreview,
}) => {
  const rsbuild = await buildPreview({
    config: {
      output: {
        cssModules: {
          exportLocalsConvention: 'camelCaseOnly',
        },
      },
    },
  });

  expectCSSContext(rsbuild);

  const styles = await page.evaluate(() => window.styles);
  expect(Object.keys(styles)).toEqual([
    'theDashClass',
    'theCamelClass',
    'theUnderscoreClass',
  ]);
});

test('should compile CSS Modules with exportLocalsConvention camelCase', async ({
  page,
  buildPreview,
}) => {
  const rsbuild = await buildPreview({
    config: {
      output: {
        cssModules: {
          exportLocalsConvention: 'camelCase',
        },
      },
    },
  });

  expectCSSContext(rsbuild);

  const styles = await page.evaluate(() => window.styles);
  expect(Object.keys(styles)).toEqual([
    'the-dash-class',
    'theDashClass',
    'theCamelClass',
    'the_underscore_class',
    'theUnderscoreClass',
  ]);
});

test('should compile CSS Modules with exportLocalsConvention dashes', async ({
  page,
  buildPreview,
}) => {
  const rsbuild = await buildPreview({
    config: {
      output: {
        cssModules: {
          exportLocalsConvention: 'dashes',
        },
      },
    },
  });

  expectCSSContext(rsbuild);

  const styles = await page.evaluate(() => window.styles);
  expect(Object.keys(styles)).toEqual([
    'the-dash-class',
    'theDashClass',
    'theCamelClass',
    'the_underscore_class',
  ]);
});

test('should compile CSS Modules with exportLocalsConvention dashesOnly', async ({
  page,
  buildPreview,
}) => {
  const rsbuild = await buildPreview({
    config: {
      output: {
        cssModules: {
          exportLocalsConvention: 'dashesOnly',
        },
      },
    },
  });

  expectCSSContext(rsbuild);

  const styles = await page.evaluate(() => window.styles);
  expect(Object.keys(styles)).toEqual([
    'theDashClass',
    'theCamelClass',
    'the_underscore_class',
  ]);
});

test('should compile CSS Modules with exportLocalsConvention asIs', async ({
  page,
  buildPreview,
}) => {
  const rsbuild = await buildPreview({
    config: {
      output: {
        cssModules: {
          exportLocalsConvention: 'asIs',
        },
      },
    },
  });

  expectCSSContext(rsbuild);

  const styles = await page.evaluate(() => window.styles);
  expect(Object.keys(styles)).toEqual([
    'the-dash-class',
    'theCamelClass',
    'the_underscore_class',
  ]);
});
