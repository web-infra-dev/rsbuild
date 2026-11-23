import { execFileSync } from 'node:child_process';
import { basename } from 'node:path';
import { expect, test } from '@e2e/helper';
import { findFile, getFileContent } from '@rstackjs/test-utils';

test('should build CSS, Less, and Sass `?url` imports with css: true', async ({
  build,
}) => {
  const rsbuild = await build();
  const files = rsbuild.getDistFiles();

  const html = getFileContent(files, 'index.html');
  expect(html).not.toMatch(/<link[^>]+rel="stylesheet"/);

  const jsContent = getFileContent(files, 'index.js');
  expect(jsContent).toContain('static/css/a/index.css');
  expect(jsContent).toContain('static/css/b/index.css');
  expect(jsContent).toContain('static/css/query-leading.css');
  expect(jsContent).toContain('static/css/query-trailing.css');
  expect(jsContent).toContain('static/css/query-value.css');
  expect(jsContent).toContain('static/css/nested/style.css');
  expect(jsContent).toContain('static/css/less-style.css');
  expect(jsContent).toContain('static/css/sass-style.css');

  const nestedCss = getFileContent(files, 'static/css/nested/style.css');
  expect(nestedCss).toContain('.nested-style');
  expect(nestedCss).toContain('.base');
  expect(nestedCss).toContain('--postcss-transformed:true');
  expect(nestedCss).toContain('/static/image/image.png');

  expect(getFileContent(files, 'static/css/a/index.css')).toContain('.a-index');
  expect(getFileContent(files, 'static/css/b/index.css')).toContain('.b-index');
  expect(getFileContent(files, 'static/css/query-leading.css')).toContain(
    '.query-leading',
  );
  expect(getFileContent(files, 'static/css/query-trailing.css')).toContain(
    '.query-trailing',
  );
  expect(getFileContent(files, 'static/css/query-value.css')).toContain(
    '.query-value',
  );

  // Less & Sass transforms + asset URL rewriting
  const lessCss = getFileContent(files, 'static/css/less-style.css');
  expect(lessCss).toContain('.less-url');
  expect(lessCss).toContain('--postcss-transformed:true');
  expect(lessCss).toContain('/static/image/image.png');

  const sassCss = getFileContent(files, 'static/css/sass-style.css');
  expect(sassCss).toContain('.sass-part');
  expect(sassCss).toContain('.sass-url');
  expect(sassCss).toContain('--postcss-transformed:true');
  expect(sassCss).toContain('/static/image/image.jpeg');
});

test('should emit hashed `?url` CSS files in production when filenameHash is true', async ({
  build,
}) => {
  const rsbuild = await build({
    config: {
      output: {
        filenameHash: true,
      },
    },
  });

  const files = rsbuild.getDistFiles();
  const nestedCssFile = findFile(files, /nested\/style\.[a-f0-9]+\.css$/, {
    ignoreHash: false,
  });
  const jsContent = getFileContent(files, 'index.js');

  expect(files[nestedCssFile]).toContain('.nested-style');
  expect(jsContent).toMatch(/static\/css\/nested\/style\.[a-f0-9]+\.css/);
});

test.for([{ exportType: 'style' as const }, { exportsOnly: true }] as const)(
  'should still emit `?url` CSS files when css config is %j',
  async (cssConfig, { build }) => {
    const rsbuild = await build({
      config: {
        css: cssConfig,
      },
    });

    const files = rsbuild.getDistFiles();
    const nestedCss = getFileContent(files, 'static/css/nested/style.css');
    expect(nestedCss).toContain('.nested-style');
    expect(nestedCss).toContain('--postcss-transformed:true');
    expect(nestedCss).toContain('/static/image/image.png');
  },
);

test('should support output.assetPrefix: "auto" and filename function with sourceFilename', async ({
  build,
}) => {
  const rsbuild = await build({
    config: {
      output: {
        assetPrefix: 'auto',
        filename: {
          css(_pathData, assetInfo) {
            if (assetInfo?.sourceFilename === 'src/nested/style.css') {
              return 'from-asset-info/[name].css';
            }
            return '[name].css';
          },
        },
      },
    },
  });

  const files = rsbuild.getDistFiles();
  const nestedCss = getFileContent(
    files,
    'static/css/from-asset-info/nested/style.css',
  );
  expect(nestedCss).toContain('.nested-style');
  expect(nestedCss).toContain('../../../static/image/image.png');

  const jsContent = getFileContent(files, 'index.js');
  expect(jsContent).toContain('static/css/from-asset-info/nested/style.css');
});

test('should update `?url` CSS hashes when assetPrefix changes with realContentHash: false', async ({
  build,
}) => {
  const filenames: string[] = [];
  for (const assetPrefix of ['/a/', '/b/']) {
    const rsbuild = await build({
      config: {
        output: {
          assetPrefix,
          filenameHash: true,
        },
        tools: {
          rspack: {
            optimization: { realContentHash: false },
          },
        },
      },
    });
    filenames.push(
      findFile(rsbuild.getDistFiles(), /nested\/style\.[a-f0-9]+\.css$/, {
        ignoreHash: false,
      }),
    );
  }
  expect(filenames[0]).not.toBe(filenames[1]);
});

test.for([true, false])(
  'should emit identical `?url` CSS in web and node environments with minify.css=%s',
  async (minifyCss, { build }) => {
    const rsbuild = await build({
      config: {
        source: {
          entry: {
            index: './src/minify-entry.js',
          },
        },
        output: {
          filenameHash: true,
        },
        tools: {
          lightningcssLoader: {
            targets: { safari: '10.0.0' },
            unusedSymbols: ['loader-unused'],
          },
        },
        environments: {
          web: {
            output: {
              distPath: 'dist/web',
              minify: {
                css: minifyCss,
                cssOptions: {
                  include: /\/minify-style\./,
                  minimizerOptions: {
                    targets: { chrome: '120.0.0' },
                    unusedSymbols: ['unused'],
                  },
                },
              },
            },
          },
          node: {
            output: {
              target: 'node',
              distPath: 'dist/node',
            },
          },
        },
      },
    });

    const files = rsbuild.getDistFiles();
    const webStyle = findFile(
      files,
      /\/web\/static\/css\/minify-style\.[a-f0-9]+\.css$/,
      { ignoreHash: false },
    );
    const nodeStyle = findFile(
      files,
      /\/node\/static\/css\/minify-style\.[a-f0-9]+\.css$/,
      { ignoreHash: false },
    );

    expect(basename(webStyle)).toBe(basename(nodeStyle));
    expect(files[webStyle]).toBe(files[nodeStyle]);
    expect(files[webStyle].includes('.unused')).toBe(!minifyCss);
    expect(files[webStyle].includes('-webkit-user-select')).toBe(!minifyCss);
    expect(files[webStyle]).not.toContain('.loader-unused');

    const webOther = getFileContent(
      files,
      /\/web\/static\/css\/minify-other\./,
      {
        ignoreHash: false,
      },
    );
    expect(webOther).toContain('.unused');

    const nodeEntry = findFile(files, /\/node\/index\.js$/);
    const parsed = JSON.parse(
      execFileSync(process.execPath, [nodeEntry], { encoding: 'utf8' }).trim(),
    ) as { styleUrl: string; otherUrl: string };
    expect(parsed.styleUrl).toBe(`/static/css/${basename(webStyle)}`);
  },
);

test('should still minimize `?url` CSS when tools.lightningcssLoader is false', async ({
  build,
}) => {
  const rsbuild = await build({
    config: {
      source: {
        entry: {
          index: './src/minify-entry.js',
        },
      },
      tools: {
        lightningcssLoader: false,
      },
    },
  });

  const files = rsbuild.getDistFiles();
  const css = getFileContent(files, 'static/css/minify-style.css');
  expect(css).not.toContain('\n');
  expect(css).toContain('color:inherit');
});

test('should reject `.module.css?url` when css is enabled', async ({
  build,
}) => {
  const rsbuild = await build({
    catchBuildError: true,
    config: {
      source: {
        entry: {
          index: './src/module-url.js',
        },
      },
    },
  });

  expect(rsbuild.buildError).toBeTruthy();
  await rsbuild.expectLog('CSS Modules do not support the ?url query');
});
