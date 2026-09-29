import { execFileSync } from 'node:child_process';
import { basename } from 'node:path';
import { expect, test } from '@e2e/helper';
import { findFile, getFileContent } from '@rstackjs/test-utils';

test.for([true, false])(
  'should emit the same CSS URL in web and node with CSS minification %s',
  async (minify, { build }) => {
    const rsbuild = await build({
      config: {
        environments: {
          web: {
            output: { minify: { css: minify } },
          },
        },
      },
    });
    const files = rsbuild.getDistFiles();
    const webCss = findFile(
      files,
      /\/web\/static\/css\/style\.[a-f0-9]+\.css$/,
      {
        ignoreHash: false,
      },
    );
    const nodeCss = findFile(
      files,
      /\/node\/static\/css\/style\.[a-f0-9]+\.css$/,
      {
        ignoreHash: false,
      },
    );

    expect(basename(webCss)).toBe(basename(nodeCss));
    expect(files[webCss]).toBe(files[nodeCss]);
    expect(files[webCss]).toContain(
      minify ? 'color:inherit' : 'color: inherit',
    );

    const nodeEntry = findFile(files, /\/node\/index\.js$/);
    const styleUrl = execFileSync(process.execPath, [nodeEntry], {
      encoding: 'utf8',
    }).trim();
    expect(styleUrl).toBe(`/static/css/${basename(webCss)}`);
  },
);

test.for([false, { minify: false }] as const)(
  'should still minimize CSS URLs with lightningcssLoader=%j',
  async (lightningcssLoader, { build }) => {
    const rsbuild = await build({
      config: {
        tools: { lightningcssLoader },
      },
    });
    const css = getFileContent(
      rsbuild.getDistFiles(),
      /\/web\/static\/css\/style\.[a-f0-9]+\.css$/,
      { ignoreHash: false },
    );

    expect(css).toContain('color:inherit');
    expect(css).not.toContain('\n');
  },
);
