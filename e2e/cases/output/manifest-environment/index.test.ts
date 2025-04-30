import { build, dev } from '@e2e/helper';
import { expect, test } from '@playwright/test';
import type { RsbuildPluginAPI } from '@rsbuild/core';

const fixtures = __dirname;

test('should allow to access manifest data in environment context after prod build', async () => {
  let webManifest: Record<string, any> = {};
  let nodeManifest: Record<string, any> = {};

  await build({
    cwd: fixtures,
    rsbuildConfig: {
      output: {
        manifest: true,
        filenameHash: false,
      },
      environments: {
        web: {},
        node: {
          output: {
            target: 'node',
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
  page,
}) => {
  let webManifest: Record<string, any> = {};
  let nodeManifest: Record<string, any> = {};

  const rsbuild = await dev({
    cwd: fixtures,
    page,
    rsbuildConfig: {
      output: {
        manifest: true,
        filenameHash: false,
      },
      environments: {
        web: {},
        node: {
          output: {
            target: 'node',
          },
        },
      },
      plugins: [
        {
          name: 'test',
          setup(api: RsbuildPluginAPI) {
            api.onDevCompileDone(({ environments }) => {
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

  await rsbuild.close();
});
