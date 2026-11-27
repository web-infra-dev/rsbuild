import { type BuildResult, expect, isBuiltinCss, test } from '@e2e/helper';
import { getFileContent } from '@rstackjs/test-utils';
import type { CSSModulesLocalsConvention } from '@rsbuild/core';

declare global {
  interface Window {
    styles: Record<string, string>;
  }
}

const getLocalsConventionConfig = (
  exportLocalsConvention: CSSModulesLocalsConvention,
) => ({
  output: {
    cssModules: {
      exportLocalsConvention,
    },
  },
});

const expectCSSContext = (rsbuild: BuildResult) => {
  const files = rsbuild.getDistFiles();
  const content = getFileContent(files, 'index.css');
  expect(content).toMatch(
    /\.the-dash-class-[\w-]{6}{color:#00f}\.theCamelClass-[\w-]{6}{color:red}\.the_underscore_class-[\w-]{6}{color:green}/,
  );
};

test('should compile CSS Modules with exportLocalsConvention camelCaseOnly', async ({
  page,
  buildPreview,
}) => {
  const rsbuild = await buildPreview({
    config: getLocalsConventionConfig('camelCaseOnly'),
  });

  expectCSSContext(rsbuild);

  const styles = await page.evaluate(() => window.styles);
  expect(Object.keys(styles).sort()).toEqual(
    ['theDashClass', 'theCamelClass', 'theUnderscoreClass'].sort(),
  );
});

test('should compile CSS Modules with exportLocalsConvention camelCase', async ({
  page,
  buildPreview,
}) => {
  const rsbuild = await buildPreview({
    config: getLocalsConventionConfig('camelCase'),
  });

  expectCSSContext(rsbuild);

  const styles = await page.evaluate(() => window.styles);
  expect(Object.keys(styles).sort()).toEqual(
    [
      'the-dash-class',
      'theDashClass',
      'theCamelClass',
      'the_underscore_class',
      'theUnderscoreClass',
    ].sort(),
  );
});

test('should compile CSS Modules with exportLocalsConvention dashes', async ({
  page,
  buildPreview,
}) => {
  const rsbuild = await buildPreview({
    config: getLocalsConventionConfig('dashes'),
  });

  expectCSSContext(rsbuild);

  const styles = await page.evaluate(() => window.styles);
  expect(Object.keys(styles).sort()).toEqual(
    (isBuiltinCss
      ? [
          'the-dash-class',
          'theCamelClass',
          'the-camel-class',
          'the_underscore_class',
          'the-underscore-class',
        ]
      : [
          'the-dash-class',
          'theDashClass',
          'theCamelClass',
          'the_underscore_class',
        ]
    ).sort(),
  );
});

test('should compile CSS Modules with exportLocalsConvention dashesOnly', async ({
  page,
  buildPreview,
}) => {
  const rsbuild = await buildPreview({
    config: getLocalsConventionConfig('dashesOnly'),
  });

  expectCSSContext(rsbuild);

  const styles = await page.evaluate(() => window.styles);
  expect(Object.keys(styles).sort()).toEqual(
    (isBuiltinCss
      ? ['the-dash-class', 'the-camel-class', 'the-underscore-class']
      : ['theDashClass', 'theCamelClass', 'the_underscore_class']
    ).sort(),
  );
});

test('should compile CSS Modules with exportLocalsConvention asIs', async ({
  page,
  buildPreview,
}) => {
  const rsbuild = await buildPreview({
    config: getLocalsConventionConfig('asIs'),
  });

  expectCSSContext(rsbuild);

  const styles = await page.evaluate(() => window.styles);
  expect(Object.keys(styles).sort()).toEqual(
    ['the-dash-class', 'theCamelClass', 'the_underscore_class'].sort(),
  );
});
