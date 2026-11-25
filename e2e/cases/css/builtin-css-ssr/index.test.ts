import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { expect, test } from '@e2e/helper';
import { findFile, findFiles, getFileContent } from '@rstackjs/test-utils';

type SsrOutput = {
  css: Record<string, string>;
  less: Record<string, string>;
  sass: Record<string, string>;
  missingUrlMod: Record<string, string>;
  inline: string;
  raw: string;
  url: string;
};

const runNodeBundle = (entryPath: string): SsrOutput =>
  JSON.parse(
    execFileSync(process.execPath, [entryPath], { encoding: 'utf8' }),
  ) as SsrOutput;

test('should support multi-env SSR with default css: true', async ({
  build,
}) => {
  const rsbuild = await build();
  const files = rsbuild.getDistFiles();

  const webCssFiles = findFiles(files, /\/dist\/web\/static\/css\/.*\.css$/, {
    ignoreHash: false,
  });
  const nodeCssFiles = findFiles(files, /\/dist\/node\/static\/css\/.*\.css$/, {
    ignoreHash: false,
  });
  const webUrlCss = findFile(
    files,
    /\/dist\/web\/static\/css\/url\.[a-f0-9]+\.css$/,
    {
      ignoreHash: false,
    },
  );
  const nodeUrlCss = findFile(
    files,
    /\/dist\/node\/static\/css\/url\.[a-f0-9]+\.css$/,
    { ignoreHash: false },
  );

  expect(webCssFiles).toHaveLength(2);
  expect(nodeCssFiles).toEqual([nodeUrlCss]);
  expect(basename(nodeUrlCss)).toBe(basename(webUrlCss));

  // CSS Modules with parser.url: false should not emit assets in node target,
  // while ?inline still emits its referenced SVG asset.
  const nodeSvgFiles = findFiles(files, /\/dist\/node\/static\/svg\/.*\.svg$/, {
    ignoreHash: false,
  });
  expect(
    nodeSvgFiles.some((file) => /icon-inline\.[a-f0-9]+\.svg$/.test(file)),
  ).toBe(true);
  expect(nodeSvgFiles.some((file) => file.includes('icon-mod'))).toBe(false);

  const nodeEntry = findFile(files, /\/dist\/node\/index\.js$/);
  const ssrOutput = runNodeBundle(nodeEntry);

  const webMainCss = getFileContent(
    files,
    /\/dist\/web\/static\/css\/index\.[a-f0-9]+\.css$/,
    { ignoreHash: false },
  );
  const [composedTitle, composedOther] = ssrOutput.css['css-title'].split(' ');
  expect(composedTitle).toBeTruthy();
  expect(composedOther).toBeTruthy();
  expect(ssrOutput.css.cssTitle).toBe(ssrOutput.css['css-title']);
  expect(webMainCss).toContain(`.${composedTitle}`);
  expect(webMainCss).toContain(`.${composedOther}`);
  expect(webMainCss).toContain(`.${ssrOutput.less['less-title']}`);
  expect(ssrOutput.less.lessTitle).toBe(ssrOutput.less['less-title']);
  expect(webMainCss).toContain(`.${ssrOutput.sass['sass-title']}`);
  expect(ssrOutput.sass.sassTitle).toBe(ssrOutput.sass['sass-title']);

  expect(ssrOutput.missingUrlMod['mod-missing-url']).toBeTruthy();
  expect(ssrOutput.inline).toMatch(/padding:\s*7px/);
  expect(ssrOutput.inline).toContain('icon-inline.');
  expect(ssrOutput.raw).toBe(
    readFileSync(join(import.meta.dirname, 'src/raw.css'), 'utf-8'),
  );
  expect(ssrOutput.url).toBe(`/static/css/${basename(webUrlCss)}`);
});

test('should support css.exportType: "style" in multi-env SSR without DOM access in node', async ({
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

  const webCssFiles = findFiles(files, /\/dist\/web\/static\/css\/.*\.css$/, {
    ignoreHash: false,
  });
  expect(webCssFiles).toHaveLength(1);
  expect(webCssFiles[0]).toMatch(/\/url\.[a-f0-9]+\.css$/);

  const nodeEntry = findFile(files, /\/dist\/node\/index\.js$/);
  const nodeBundle = files[nodeEntry];
  expect(nodeBundle).not.toContain('document.getElementsByTagName');
  expect(nodeBundle).not.toContain('document.createElement("style")');

  const ssrOutput = runNodeBundle(nodeEntry);
  const webJs = getFileContent(
    files,
    /\/dist\/web\/static\/js\/index\.[a-f0-9]+\.js$/,
    {
      ignoreHash: false,
    },
  );
  const [composedTitle] = ssrOutput.css['css-title'].split(' ');
  expect(webJs).toContain(composedTitle);
  expect(webJs).toContain(ssrOutput.less['less-title']);
  expect(webJs).toContain(ssrOutput.sass['sass-title']);
});

test('should emit main CSS on node target when css.exportsOnly is explicitly false', async ({
  build,
}) => {
  const rsbuild = await build({
    config: {
      environments: {
        node: {
          css: {
            exportsOnly: false,
          },
          source: {
            entry: { index: './src/client.ts' },
          },
        },
      },
    },
  });
  const files = rsbuild.getDistFiles();

  const nodeMainCss = findFiles(
    files,
    /\/dist\/node\/static\/css\/index\.[a-f0-9]+\.css$/,
    { ignoreHash: false },
  );
  expect(nodeMainCss).toHaveLength(1);
  expect(files[nodeMainCss[0]]).toContain('.global');
});
