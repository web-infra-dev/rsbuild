import path, { join } from 'node:path';
import { expect, test } from '@e2e/helper';
import { getDistFiles } from '@rstackjs/test-utils';
import fse from 'fs-extra';

test('should serve publicDir for dev server correctly', async ({
  page,
  devOnly,
}) => {
  await fse.outputFile(
    join(import.meta.dirname, 'public', 'test-temp-file.txt'),
    'a',
  );

  const rsbuild = await devOnly({
    config: {
      output: {
        distPath: 'dist-dev-1',
      },
    },
  });

  const res = await page.goto(
    `http://localhost:${rsbuild.port}/test-temp-file.txt`,
  );

  expect((await res?.body())?.toString().trim()).toBe('a');
});

test('should serve publicDir with assetPrefix for dev server correctly', async ({
  page,
  devOnly,
}) => {
  await fse.outputFile(
    join(import.meta.dirname, 'public', 'test-temp-file.txt'),
    'a',
  );

  const rsbuild = await devOnly({
    config: {
      dev: {
        assetPrefix: '/dev/',
      },
      output: {
        assetPrefix: '/prod/',
        distPath: 'dist-dev-1',
      },
    },
  });

  const res = await page.goto(
    `http://localhost:${rsbuild.port}/test-temp-file.txt`,
  );

  expect((await res?.body())?.toString().trim()).toBe('a');
});

test('should serve multiple publicDir for dev server correctly', async ({
  page,
  devOnly,
}) => {
  await fse.outputFile(
    join(import.meta.dirname, 'test-temp-dir1', 'a.txt'),
    'a',
  );
  await fse.outputFile(
    join(import.meta.dirname, 'test-temp-dir2', 'b.txt'),
    'b',
  );

  const rsbuild = await devOnly({
    config: {
      server: {
        publicDir: [{ name: 'test-temp-dir1' }, { name: 'test-temp-dir2' }],
      },
      output: {
        distPath: 'dist-dev-1',
      },
    },
  });

  const resA = await page.goto(`http://localhost:${rsbuild.port}/a.txt`);
  expect((await resA?.body())?.toString().trim()).toBe('a');

  const resB = await page.goto(`http://localhost:${rsbuild.port}/b.txt`);
  expect((await resB?.body())?.toString().trim()).toBe('b');
});

test('should serve custom publicDir for dev server correctly', async ({
  page,
  devOnly,
}) => {
  await fse.outputFile(
    join(import.meta.dirname, 'public1', 'test-temp-file.txt'),
    'a111',
  );

  const rsbuild = await devOnly({
    config: {
      server: {
        publicDir: {
          name: 'public1',
        },
      },
      output: {
        distPath: 'dist-dev-1',
      },
    },
  });

  const res = await page.goto(
    `http://localhost:${rsbuild.port}/test-temp-file.txt`,
  );

  expect((await res?.body())?.toString().trim()).toBe('a111');
});

test('should not serve publicDir when publicDir is false', async ({
  page,
  devOnly,
}) => {
  const rsbuild = await devOnly({
    config: {
      server: {
        publicDir: false,
        htmlFallback: false,
      },
      output: {
        distPath: 'dist-dev-1',
      },
    },
  });

  const res = await page.goto(
    `http://localhost:${rsbuild.port}/test-temp-file.txt`,
  );

  expect(res?.status()).toBe(404);
});

test('should only serve publicDir for GET and HEAD requests in dev server', async ({
  devOnly,
}) => {
  await fse.outputFile(
    join(import.meta.dirname, 'public', 'test-temp-file.txt'),
    'a',
  );

  const rsbuild = await devOnly({
    config: {
      server: {
        setup: ({ server }) => {
          return () => {
            server.middlewares.use((req, res, next) => {
              if (req.method === 'POST') {
                res.end('POST handled by middleware');
                return;
              }
              next();
            });
          };
        },
      },
      output: {
        distPath: 'dist-dev-1',
      },
    },
  });

  const url = `http://localhost:${rsbuild.port}/test-temp-file.txt`;

  const getRes = await fetch(url);
  expect((await getRes.text()).trim()).toBe('a');

  const headRes = await fetch(url, { method: 'HEAD' });
  expect(headRes.status).toBe(200);

  const postRes = await fetch(url, { method: 'POST' });
  expect(await postRes.text()).toBe('POST handled by middleware');

  const putRes = await fetch(url, { method: 'PUT' });
  expect(putRes.status).toBe(404);
});

test('should serve publicDir for preview server correctly', async ({
  page,
  buildPreview,
}) => {
  await fse.outputFile(
    join(import.meta.dirname, 'public', 'test-temp-file.txt'),
    'a',
  );

  const rsbuild = await buildPreview({
    config: {
      output: {
        distPath: 'dist-build-1',
      },
    },
  });

  const res = await page.goto(
    `http://localhost:${rsbuild.port}/test-temp-file.txt`,
  );

  expect((await res?.body())?.toString().trim()).toBe('a');
});

test('should copy publicDir to the environment distDir when multiple environments', async ({
  build,
}) => {
  await fse.outputFile(
    join(import.meta.dirname, 'public', 'test-temp-file.txt'),
    'a',
  );

  const rsbuild = await build({
    config: {
      environments: {
        web1: {
          output: {
            distPath: 'dist-build-web-1',
          },
        },
        web2: {
          output: {
            distPath: 'dist-build-web-2',
          },
        },
        node: {
          output: {
            target: 'node',
            distPath: 'dist-build-node',
          },
        },
      },
    },
  });
  const files = await getDistFiles(rsbuild.distPath);
  const filenames = Object.keys(files);

  expect(
    filenames.some((filename) =>
      filename.includes('dist-build-web-1/test-temp-file.txt'),
    ),
  ).toBeTruthy();
  expect(
    filenames.some((filename) =>
      filename.includes('dist-build-web-2/test-temp-file.txt'),
    ),
  ).toBeTruthy();
  expect(
    filenames.some((filename) =>
      filename.includes('dist-build-node/test-temp-file.txt'),
    ),
  ).toBeFalsy();
});

test('should inherit or replace publicDir per environment when building', async ({
  build,
}) => {
  const publicA = 'test-temp-build-public-a';
  const publicB = 'test-temp-build-public-b';
  await fse.outputFile(join(import.meta.dirname, publicA, 'a.txt'), 'a');
  await fse.outputFile(
    join(import.meta.dirname, publicA, 'favicon.svg'),
    '<svg xmlns="http://www.w3.org/2000/svg"/>',
  );
  await fse.outputFile(join(import.meta.dirname, publicB, 'b.txt'), 'b');
  await fse.outputFile(join(import.meta.dirname, publicB, 'skip.txt'), 'skip');
  await fse.outputFile(join(import.meta.dirname, publicB, 'favicon.ico'), '');

  const rsbuild = await build({
    config: {
      server: { publicDir: { name: publicA } },
      environments: {
        inherited: { output: { distPath: 'dist-copy/inherited' } },
        custom: {
          output: { distPath: 'dist-copy/inherited/custom' },
          server: {
            publicDir: [
              { name: publicB, ignore: ['skip.txt'] },
              { name: publicA, copyOnBuild: false },
            ],
          },
        },
        worker: {
          output: { target: 'web-worker', distPath: 'dist-copy/worker' },
          server: { publicDir: false },
        },
        node: {
          output: { target: 'node', distPath: 'dist-copy/node' },
          server: { publicDir: { name: publicA, copyOnBuild: true } },
        },
      },
    },
  });

  for (const [environment, expected] of Object.entries({
    inherited: [true, false, false],
    'inherited/custom': [false, true, false],
    worker: [false, false, false],
    node: [true, false, false],
  })) {
    const files = await Promise.all(
      ['a.txt', 'b.txt', 'skip.txt'].map((file) =>
        fse.pathExists(join(rsbuild.distPath, environment, file)),
      ),
    );
    expect(files).toEqual(expected);
  }
  const inheritedHtml = await fse.readFile(
    join(rsbuild.distPath, 'inherited/index.html'),
    'utf8',
  );
  const customHtml = await fse.readFile(
    join(rsbuild.distPath, 'inherited/custom/index.html'),
    'utf8',
  );
  expect(inheritedHtml).toContain('href="/favicon.svg"');
  expect(customHtml).toContain('href="/favicon.ico"');
});

test('should share environment public directories and watch each enabled path', async ({
  dev,
  page,
}) => {
  const publicA = 'test-temp-dev-public-a';
  const publicB = 'test-temp-dev-public-b';
  const fileB = join(import.meta.dirname, publicB, 'b.txt');
  await fse.outputFile(join(import.meta.dirname, publicA, 'a.txt'), 'a');
  await fse.outputFile(
    join(import.meta.dirname, publicA, 'shared.txt'),
    'first',
  );
  await fse.outputFile(
    join(import.meta.dirname, publicB, 'shared.txt'),
    'second',
  );
  await fse.outputFile(fileB, 'b');

  const rsbuild = await dev({
    config: {
      server: { publicDir: { name: publicA }, htmlFallback: false },
      environments: {
        inherited: {},
        custom: {
          server: {
            publicDir: [
              { name: publicB, copyOnBuild: false, ignore: ['b.txt'] },
            ],
          },
        },
        watched: { server: { publicDir: { name: publicB, watch: true } } },
        disabled: { server: { publicDir: false } },
      },
    },
  });

  for (const [file, content] of [
    ['a.txt', 'a'],
    ['b.txt', 'b'],
    ['shared.txt', 'first'],
  ]) {
    const response = await page.request.get(
      `http://localhost:${rsbuild.port}/${file}`,
    );
    expect(await response.text()).toBe(content);
  }
  // The later environment enables watching a directory already served by an earlier one.
  await Promise.all([
    page.waitForEvent('load'),
    fse.outputFile(fileB, 'updated'),
  ]);
});

test('should copy publicDir to the node distDir when copyOnBuild is specified as true', async ({
  build,
}) => {
  await fse.outputFile(
    join(import.meta.dirname, 'public', 'test-temp-file.txt'),
    'a',
  );

  const rsbuild = await build({
    config: {
      server: {
        publicDir: {
          copyOnBuild: true,
        },
      },
      environments: {
        node: {
          output: {
            target: 'node',
            distPath: 'dist-build-node-1',
          },
        },
      },
    },
  });
  const files = await getDistFiles(rsbuild.distPath);
  const filenames = Object.keys(files);

  expect(
    filenames.some((filename) =>
      filename.includes('dist-build-node-1/test-temp-file.txt'),
    ),
  ).toBeTruthy();
});

test('should copy publicDir to root dist when environment dist path has a parent-child relationship', async ({
  build,
  prepareDist,
}) => {
  await fse.outputFile(
    join(import.meta.dirname, 'public', 'test-temp-file.txt'),
    'a',
  );
  await prepareDist('dist-build-web');

  const rsbuild = await build({
    config: {
      environments: {
        web1: {
          output: {
            distPath: 'dist-build-web/1',
          },
        },
        web2: {
          output: {
            distPath: 'dist-build-web',
          },
        },
      },
    },
  });
  const files = await getDistFiles(rsbuild.distPath);
  const filenames = Object.keys(files);

  expect(
    filenames.some((filename) =>
      filename.includes('dist-build-web/test-temp-file.txt'),
    ),
  ).toBeTruthy();
  expect(
    filenames.some((filename) =>
      filename.includes('dist-build-web/1/test-temp-file.txt'),
    ),
  ).toBeFalsy();
});

test('should serve publicDir for preview server with assetPrefix correctly', async ({
  page,
  buildPreview,
}) => {
  await fse.outputFile(
    join(import.meta.dirname, 'public', 'test-temp-file.txt'),
    'a',
  );

  const rsbuild = await buildPreview({
    config: {
      dev: {
        assetPrefix: '/dev/',
      },
      output: {
        assetPrefix: '/prod/',
        distPath: 'dist-build-1',
      },
    },
  });

  const res = await page.goto(
    `http://localhost:${rsbuild.port}/test-temp-file.txt`,
  );

  expect((await res?.body())?.toString().trim()).toBe('a');
});

test('should serve multiple publicDir for preview server correctly', async ({
  page,
  buildPreview,
}) => {
  await fse.outputFile(
    join(import.meta.dirname, 'test-temp-dir1', 'a.txt'),
    'a',
  );
  await fse.outputFile(
    join(import.meta.dirname, 'test-temp-dir2', 'b.txt'),
    'b',
  );

  const rsbuild = await buildPreview({
    config: {
      server: {
        publicDir: [{ name: 'test-temp-dir1' }, { name: 'test-temp-dir2' }],
      },
      output: {
        distPath: 'dist-build-1',
      },
    },
  });

  const resA = await page.goto(`http://localhost:${rsbuild.port}/a.txt`);
  expect((await resA?.body())?.toString().trim()).toBe('a');

  const resB = await page.goto(`http://localhost:${rsbuild.port}/b.txt`);
  expect((await resB?.body())?.toString().trim()).toBe('b');
});

test('should reload page when publicDir file changes', async ({
  page,
  dev,
}) => {
  await dev({
    config: {
      server: {
        publicDir: {
          watch: true,
        },
      },
    },
  });

  const file = path.join(import.meta.dirname, '/public/test-temp-file.txt');

  await fse.outputFile(file, 'test');
  // check the page is reloaded
  await page.waitForURL(page.url());

  // reset file
  await fse.outputFile(file, 'a');
});

test('should reload page when custom publicDir file changes', async ({
  page,
  dev,
}) => {
  await dev({
    config: {
      server: {
        publicDir: {
          name: 'public1',
          watch: true,
        },
      },
    },
  });

  const file = path.join(import.meta.dirname, '/public1/test-temp-file.txt');

  await fse.outputFile(file, 'test');
  // check the page is reloaded
  await page.waitForURL(page.url());

  // reset file
  await fse.outputFile(file, 'a111');
});

test('should ignore files matching ignore patterns when copying publicDir', async ({
  build,
}) => {
  await fse.outputFile(
    join(import.meta.dirname, 'public', 'test-temp-file.txt'),
    'a',
  );
  await fse.outputFile(
    join(import.meta.dirname, 'public', 'config.prd.js'),
    'should be ignored',
  );

  const rsbuild = await build({
    config: {
      server: {
        publicDir: {
          ignore: ['**/config.prd.js'],
        },
      },
      output: {
        distPath: 'dist-build-ignore',
      },
    },
  });

  const files = await getDistFiles(rsbuild.distPath);
  const filenames = Object.keys(files);

  expect(
    filenames.some((filename) => filename.includes('test-temp-file.txt')),
  ).toBeTruthy();
  expect(
    filenames.some((filename) => filename.includes('config.prd.js')),
  ).toBeFalsy();

  await fse.remove(join(import.meta.dirname, 'public', 'test-temp-file.txt'));
  await fse.remove(join(import.meta.dirname, 'public', 'config.prd.js'));
});
