import { expect, test } from '@e2e/helper';
import type { RsbuildPluginAPI } from '@rsbuild/core';

test('should allow to access manifest data in environment context after build', async ({
  buildOnly,
}) => {
  let webManifest: Record<string, any> = {};
  let nodeManifest: Record<string, any> = {};

  await buildOnly({
    rsbuildConfig: {
      output: {
        filenameHash: false,
      },
      environments: {
        web: {
          output: {
            manifest: true,
          },
        },
        node: {
          output: {
            target: 'node',
            manifest: 'manifest-node.json',
          },
        },
      },
      plugins: [
        {
          name: 'test',
          setup(api: RsbuildPluginAPI) {
            api.onAfterBuild(({ environments }) => {
              if (environments.web.manifest) {
                webManifest = environments.web.manifest;
              }
              if (environments.node.manifest) {
                nodeManifest = environments.node.manifest;
              }
            });
          },
        },
      ],
    },
  });

  // main.js, index.html
  expect(Object.keys(webManifest.allFiles).length).toBe(2);
  expect(webManifest.entries.index).toMatchObject({
    initial: {
      js: ['/static/js/index.js'],
    },
    html: ['/index.html'],
  });

  // main.js
  expect(Object.keys(nodeManifest.allFiles).length).toBe(1);
  expect(nodeManifest.entries.index).toMatchObject({
    initial: {
      js: ['/index.js'],
    },
  });
});

test('should allow to access manifest data in environment context after dev build', async ({
  dev,
}) => {
  let webManifest: Record<string, any> = {};
  let nodeManifest: Record<string, any> = {};

  await dev({
    rsbuildConfig: {
      output: {
        filenameHash: false,
      },
      environments: {
        web: {
          output: {
            manifest: true,
          },
        },
        node: {
          output: {
            target: 'node',
            manifest: 'manifest-node.json',
          },
        },
      },
      plugins: [
        {
          name: 'test',
          setup(api: RsbuildPluginAPI) {
            api.onAfterDevCompile(({ environments }) => {
              if (environments.web.manifest) {
                webManifest = environments.web.manifest;
              }
              if (environments.node.manifest) {
                nodeManifest = environments.node.manifest;
              }
            });
          },
        },
      ],
    },
  });

  // main.js, main.js.map, index.html
  expect(Object.keys(webManifest.allFiles).length).toBe(3);
  expect(webManifest.entries.index).toMatchObject({
    initial: {
      js: ['/static/js/index.js'],
    },
    html: ['/index.html'],
  });

  // main.js, main.js.map
  expect(Object.keys(nodeManifest.allFiles).length).toBe(2);
  expect(nodeManifest.entries.index).toMatchObject({
    initial: {
      js: ['/index.js'],
    },
  });
});

test('should allow to access manifest data in environment API', async ({
  dev,
  page,
}) => {
  let webManifest: Record<string, any> | undefined = {};
  let nodeManifest: Record<string, any> | undefined = {};

  const rsbuild = await dev({
    rsbuildConfig: {
      output: {
        filenameHash: false,
      },
      environments: {
        web: {
          output: {
            manifest: true,
          },
        },
        node: {
          output: {
            target: 'node',
            manifest: 'manifest-node.json',
          },
        },
      },
      dev: {
        setupMiddlewares: (middlewares, { environments }) => {
          middlewares.unshift(async (_req, _res, next) => {
            webManifest = environments.web.context.manifest;
            nodeManifest = environments.node.context.manifest;
            next();
          });
        },
      },
    },
  });

  // should visit base url correctly
  await page.goto(`http://localhost:${rsbuild.port}`);

  // main.js, main.js.map, index.html
  expect(Object.keys(webManifest.allFiles).length).toBe(3);
  expect(webManifest.entries.index).toMatchObject({
    initial: {
      js: ['/static/js/index.js'],
    },
    html: ['/index.html'],
  });

  // main.js, main.js.map
  expect(Object.keys(nodeManifest.allFiles).length).toBe(2);
  expect(nodeManifest.entries.index).toMatchObject({
    initial: {
      js: ['/index.js'],
    },
  });
});
