import { expect, test } from '@e2e/helper';
import type { ManifestData, RsbuildPluginAPI } from '@rsbuild/core';

test('should allow to access manifest data in environment context after build', async ({
  build,
}) => {
  let webManifest: ManifestData | undefined;
  let nodeManifest: ManifestData | undefined;

  await build({
    config: {
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
                webManifest = environments.web.manifest as ManifestData;
              }
              if (environments.node.manifest) {
                nodeManifest = environments.node.manifest as ManifestData;
              }
            });
          },
        },
      ],
    },
  });

  // index.js, index.html
  expect(webManifest?.allFiles).toHaveLength(2);
  expect(webManifest?.entries.index).toMatchObject({
    initial: {
      js: ['/static/js/index.js'],
    },
    html: ['/index.html'],
  });

  // index.js
  expect(nodeManifest?.allFiles).toHaveLength(1);
  expect(nodeManifest?.entries.index).toMatchObject({
    initial: {
      js: ['/index.js'],
    },
  });
});

test('should allow to access manifest data in environment context after dev build', async ({
  dev,
}) => {
  let webManifest: ManifestData | undefined;
  let nodeManifest: ManifestData | undefined;

  await dev({
    config: {
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
                webManifest = environments.web.manifest as ManifestData;
              }
              if (environments.node.manifest) {
                nodeManifest = environments.node.manifest as ManifestData;
              }
            });
          },
        },
      ],
    },
  });

  // index.js, index.js.map, index.html
  expect(webManifest?.allFiles).toHaveLength(3);
  expect(webManifest?.entries.index).toMatchObject({
    initial: {
      js: ['/static/js/index.js'],
    },
    html: ['/index.html'],
  });

  // index.js, index.js.map
  expect(nodeManifest?.allFiles).toHaveLength(2);
  expect(nodeManifest?.entries.index).toMatchObject({
    initial: {
      js: ['/index.js'],
    },
  });
});

test('should allow to access manifest data in environment API', async ({
  dev,
  page,
}) => {
  let webManifest: ManifestData | undefined;
  let nodeManifest: ManifestData | undefined;

  const rsbuild = await dev({
    config: {
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
      server: {
        setup: ({ action, server }) => {
          if (action !== 'dev') {
            return;
          }
          server.middlewares.use((_req, _res, next) => {
            webManifest = server.environments.web.context.manifest as
              ManifestData | undefined;
            nodeManifest = server.environments.node.context.manifest as
              ManifestData | undefined;
            next();
          });
        },
      },
    },
  });

  // should visit base url correctly
  await page.goto(`http://localhost:${rsbuild.port}`);

  // index.js, index.js.map, index.html
  expect(webManifest?.allFiles).toHaveLength(3);
  expect(webManifest?.entries.index).toMatchObject({
    initial: {
      js: ['/static/js/index.js'],
    },
    html: ['/index.html'],
  });

  // index.js, index.js.map
  expect(nodeManifest?.allFiles).toHaveLength(2);
  expect(nodeManifest?.entries.index).toMatchObject({
    initial: {
      js: ['/index.js'],
    },
  });
});
