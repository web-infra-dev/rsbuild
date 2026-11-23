import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@e2e/helper';
import { findFiles, getFileContent } from '@rstackjs/test-utils';

const COMPILE_WARNING = 'Compile Warning';

test('should build Rspack built-in CSS with css: true defaults', async ({
  build,
}) => {
  const rsbuild = await build();
  const files = rsbuild.getDistFiles();
  const htmlContent = getFileContent(files, 'index.html');
  const cssContent = getFileContent(files, 'index.css');
  const jsContent = getFileContent(files, 'index.js');

  expect(htmlContent).toContain('rel="stylesheet"');
  expect(htmlContent).toContain('/static/css/index.css');

  expect(cssContent).toContain('color:red');
  // animation is true by default -> @keyframes name is scoped
  expect(cssContent).not.toContain('@keyframes fadeIn{');
  // dashedIdents & container & grid are false by default -> kept intact
  expect(cssContent).toContain('--custom-color');
  expect(cssContent).toContain('card-box');
  expect(cssContent).toContain('grid-template-areas:"header"');
  expect(cssContent).toContain('font-weight:700');
  expect(cssContent).toContain('font-style:italic');

  // exportsConvention defaults to 'as-is'
  expect(jsContent).toContain('"box-title"');
  expect(jsContent).not.toContain('boxTitle');
  expect(jsContent).toContain('.inline-box{color:#0a141e}');
  expect(jsContent).toContain(
    JSON.stringify(
      readFileSync(join(import.meta.dirname, 'src/inline.css'), 'utf-8'),
    ),
  );

  rsbuild.expectNoLog(COMPILE_WARNING);
});

test('should support css.exportType: "style" without emitting CSS files', async ({
  build,
}) => {
  const rsbuild = await build({
    config: {
      css: {
        exportType: 'style',
      },
    },
  });

  const files = rsbuild.getDistFiles();
  expect(findFiles(files, '.css')).toHaveLength(0);
  expect(getFileContent(files, 'index.html')).not.toContain('rel="stylesheet"');

  const jsContent = getFileContent(files, 'index.js');
  expect(jsContent).toContain('color:red');
  expect(jsContent).toContain('--custom-color');
  expect(jsContent).toContain('font-weight:700');
  expect(jsContent).toContain('font-style:italic');
  expect(jsContent).toContain('createElement("style")');

  rsbuild.expectNoLog(COMPILE_WARNING);
});

test('should support css.exportsOnly: true while keeping ?inline CSS export', async ({
  build,
}) => {
  const rsbuild = await build({
    config: {
      css: {
        exportsOnly: true,
      },
    },
  });

  const files = rsbuild.getDistFiles();
  expect(findFiles(files, '.css')).toHaveLength(0);

  const jsContent = getFileContent(files, 'index.js');
  expect(jsContent).toContain('box-title');
  expect(jsContent).toContain('.inline-box{color:#0a141e}');
  rsbuild.expectNoLog(COMPILE_WARNING);
});

test('should ignore output.injectStyles and output.emitCss when css is enabled', async ({
  build,
}) => {
  const rsbuild = await build({
    config: {
      css: true,
      output: {
        injectStyles: true,
        emitCss: false,
      },
    },
  });

  const files = rsbuild.getDistFiles();
  const cssFiles = findFiles(files, '.css');
  expect(cssFiles).toHaveLength(1);
  expect(getFileContent(files, 'index.css')).toContain('color:red');
});

test('should apply custom exportsConvention, dashedIdents, and localIdentHashSalt', async ({
  build,
}) => {
  const rsbuild1 = await build({
    config: {
      css: {
        exportsConvention: 'camel-case',
        modules: {
          dashedIdents: true,
          localIdentName: '[local]-[hash]',
          localIdentHashSalt: 'salt-a',
        },
      },
    },
  });

  const rsbuild2 = await build({
    config: {
      css: {
        exportsConvention: 'camel-case',
        modules: {
          dashedIdents: true,
          localIdentName: '[local]-[hash]',
          localIdentHashSalt: 'salt-b',
        },
      },
    },
  });

  const css1 = getFileContent(rsbuild1.getDistFiles(), 'index.css');
  const css2 = getFileContent(rsbuild2.getDistFiles(), 'index.css');
  const js1 = getFileContent(rsbuild1.getDistFiles(), 'index.js');

  // camelCase export generated
  expect(js1).toContain('boxTitle');
  // dashedIdents: true renames --custom-color
  expect(css1).not.toContain('var(--custom-color)');
  // Different salt produces different ident hash
  expect(css1).not.toBe(css2);
});
