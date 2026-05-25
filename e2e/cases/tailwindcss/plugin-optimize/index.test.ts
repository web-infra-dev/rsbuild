import { expect, getFileContent, test } from '@e2e/helper';
import { pluginTailwindcss } from '@rsbuild/plugin-tailwindcss';

test('should disable Tailwind optimization by default', async ({ build }) => {
  const rsbuild = await build({
    config: {
      html: {
        template: './src/index.html',
      },
      output: {
        minify: false,
      },
      plugins: [pluginTailwindcss()],
      tools: {
        lightningcssLoader: false,
      },
    },
  });

  const css = getFileContent(rsbuild.getDistFiles(), 'index.css');
  expect(css).toContain('& .title');
});

test('should enable Tailwind minify when optimize is true', async ({
  build,
}) => {
  const rsbuild = await build({
    config: {
      html: {
        template: './src/index.html',
      },
      output: {
        minify: false,
      },
      plugins: [pluginTailwindcss({ optimize: true })],
      tools: {
        lightningcssLoader: false,
      },
    },
  });

  const css = getFileContent(rsbuild.getDistFiles(), 'index.css');
  expect(css).toContain('.card .title');
  expect(css).toContain('.underline{text-decoration-line:underline}');
});

test('should keep Tailwind minify disabled when optimize minify is omitted', async ({
  build,
}) => {
  const rsbuild = await build({
    config: {
      html: {
        template: './src/index.html',
      },
      output: {
        minify: false,
      },
      plugins: [pluginTailwindcss({ optimize: {} })],
      tools: {
        lightningcssLoader: false,
      },
    },
  });

  const css = getFileContent(rsbuild.getDistFiles(), 'index.css');
  expect(css).toContain('.card .title');
  expect(css).toMatch(
    /\.underline \{\n\s+text-decoration-line: underline;\n\s+\}/,
  );
  expect(css).not.toContain('.underline{text-decoration-line:underline}');
});

test('should enable Tailwind minify when optimize minify is true', async ({
  build,
}) => {
  const rsbuild = await build({
    config: {
      html: {
        template: './src/index.html',
      },
      output: {
        minify: false,
      },
      plugins: [pluginTailwindcss({ optimize: { minify: true } })],
      tools: {
        lightningcssLoader: false,
      },
    },
  });

  const css = getFileContent(rsbuild.getDistFiles(), 'index.css');
  expect(css).toContain('.card .title');
  expect(css).toContain('.underline{text-decoration-line:underline}');
});
