import path, { join } from 'node:path';
import { build, expect, getDistFiles, test } from '@e2e/helper';
import fse from 'fs-extra';

const cwd = __dirname;

test('should serve publicDir for dev server correctly', async ({
  page,
  devOnly,
}) => {
  await fse.outputFile(join(__dirname, 'public', 'test-temp-file.txt'), 'a');

  const rsbuild = await devOnly({
    rsbuildConfig: {
      output: {
        distPath: {
          root: 'dist-dev-1',
        },
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
  await fse.outputFile(join(__dirname, 'public', 'test-temp-file.txt'), 'a');

  const rsbuild = await devOnly({
    rsbuildConfig: {
      dev: {
        assetPrefix: '/dev/',
      },
      output: {
        assetPrefix: '/prod/',
        distPath: {
          root: 'dist-dev-1',
        },
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
  await fse.outputFile(join(__dirname, 'test-temp-dir1', 'a.txt'), 'a');
  await fse.outputFile(join(__dirname, 'test-temp-dir2', 'b.txt'), 'b');

  const rsbuild = await devOnly({
    rsbuildConfig: {
      server: {
        publicDir: [{ name: 'test-temp-dir1' }, { name: 'test-temp-dir2' }],
      },
      output: {
        distPath: {
          root: 'dist-dev-1',
        },
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
    join(__dirname, 'public1', 'test-temp-file.txt'),
    'a111',
  );

  const rsbuild = await devOnly({
    rsbuildConfig: {
      server: {
        publicDir: {
          name: 'public1',
        },
      },
      output: {
        distPath: {
          root: 'dist-dev-1',
        },
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
    rsbuildConfig: {
      server: {
        publicDir: false,
        htmlFallback: false,
      },
      output: {
        distPath: {
          root: 'dist-dev-1',
        },
      },
    },
  });

  const res = await page.goto(
    `http://localhost:${rsbuild.port}/test-temp-file.txt`,
  );

  expect(res?.status()).toBe(404);
});

test('should serve publicDir for preview server correctly', async ({
  page,
}) => {
  await fse.outputFile(join(__dirname, 'public', 'test-temp-file.txt'), 'a');

  const rsbuild = await build({
    cwd,
    page,
    rsbuildConfig: {
      output: {
        distPath: {
          root: 'dist-build-1',
        },
      },
    },
  });

  const res = await page.goto(
    `http://localhost:${rsbuild.port}/test-temp-file.txt`,
  );

  expect((await res?.body())?.toString().trim()).toBe('a');

  await rsbuild.close();
});

test('should copy publicDir to the environment distDir when multiple environments', async () => {
  await fse.outputFile(join(__dirname, 'public', 'test-temp-file.txt'), 'a');

  const rsbuild = await build({
    cwd,
    rsbuildConfig: {
      environments: {
        web1: {
          output: {
            distPath: {
              root: 'dist-build-web-1',
            },
          },
        },
        web2: {
          output: {
            distPath: {
              root: 'dist-build-web-2',
            },
          },
        },
        node: {
          output: {
            target: 'node',
            distPath: {
              root: 'dist-build-node',
            },
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

test('should copy publicDir to the node distDir when copyOnBuild is specified as true', async () => {
  await fse.outputFile(join(__dirname, 'public', 'test-temp-file.txt'), 'a');

  const rsbuild = await build({
    cwd,
    rsbuildConfig: {
      server: {
        publicDir: {
          copyOnBuild: true,
        },
      },
      environments: {
        node: {
          output: {
            target: 'node',
            distPath: {
              root: 'dist-build-node-1',
            },
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

test('should copy publicDir to root dist when environment dist path has a parent-child relationship', async () => {
  await fse.outputFile(join(__dirname, 'public', 'test-temp-file.txt'), 'a');
  fse.removeSync(join(__dirname, 'dist-build-web'));

  const rsbuild = await build({
    cwd,
    rsbuildConfig: {
      environments: {
        web1: {
          output: {
            distPath: {
              root: 'dist-build-web/1',
            },
          },
        },
        web2: {
          output: {
            distPath: {
              root: 'dist-build-web',
            },
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
}) => {
  await fse.outputFile(join(__dirname, 'public', 'test-temp-file.txt'), 'a');

  const rsbuild = await build({
    cwd,
    page,
    rsbuildConfig: {
      dev: {
        assetPrefix: '/dev/',
      },
      output: {
        assetPrefix: '/prod/',
        distPath: {
          root: 'dist-build-1',
        },
      },
    },
  });

  const res = await page.goto(
    `http://localhost:${rsbuild.port}/test-temp-file.txt`,
  );

  expect((await res?.body())?.toString().trim()).toBe('a');

  await rsbuild.close();
});

test('should serve multiple publicDir for preview server correctly', async ({
  page,
}) => {
  await fse.outputFile(join(__dirname, 'test-temp-dir1', 'a.txt'), 'a');
  await fse.outputFile(join(__dirname, 'test-temp-dir2', 'b.txt'), 'b');

  const rsbuild = await build({
    cwd,
    page,
    rsbuildConfig: {
      server: {
        publicDir: [{ name: 'test-temp-dir1' }, { name: 'test-temp-dir2' }],
      },
      output: {
        distPath: {
          root: 'dist-build-1',
        },
      },
    },
  });

  const resA = await page.goto(`http://localhost:${rsbuild.port}/a.txt`);
  expect((await resA?.body())?.toString().trim()).toBe('a');

  const resB = await page.goto(`http://localhost:${rsbuild.port}/b.txt`);
  expect((await resB?.body())?.toString().trim()).toBe('b');

  await rsbuild.close();
});

test('should reload page when publicDir file changes', async ({
  page,
  dev,
}) => {
  await dev({
    rsbuildConfig: {
      server: {
        publicDir: {
          watch: true,
        },
      },
    },
  });

  const file = path.join(__dirname, '/public/test-temp-file.txt');

  await fse.outputFile(file, 'test');
  // check the page is reloaded
  await new Promise((resolve) => {
    page.waitForURL(page.url()).then(resolve);
  });

  // reset file
  await fse.outputFile(file, 'a');
});

test('should reload page when custom publicDir file changes', async ({
  page,
  dev,
}) => {
  await dev({
    rsbuildConfig: {
      server: {
        publicDir: {
          name: 'public1',
          watch: true,
        },
      },
    },
  });

  const file = path.join(__dirname, '/public1/test-temp-file.txt');

  await fse.outputFile(file, 'test');
  // check the page is reloaded
  await new Promise((resolve) => {
    page.waitForURL(page.url()).then(resolve);
  });

  // reset file
  await fse.outputFile(file, 'a111');
});
