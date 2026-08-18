import net from 'node:net';
import { expect, recordPluginHooks, test } from '@e2e/helper';
import {
  createRsbuild,
  type RsbuildDevServer,
  type RsbuildPlugin,
  type RsbuildPreviewServer,
} from '@rsbuild/core';
import { getRandomPort } from '@rstackjs/test-utils';

const HOST = '127.0.0.1';

const expectPortAvailable = async (port: number) => {
  const server = net.createServer();

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen({ host: HOST, port }, resolve);
  });

  await new Promise<void>((resolve) => {
    server.close(() => resolve());
  });
};

test('should run plugin hooks correctly when running build', async ({
  build,
}) => {
  const { plugin, hooks } = recordPluginHooks();
  const rsbuild = await build({
    config: {
      plugins: [plugin],
    },
  });

  await rsbuild.close();

  expect(hooks).toEqual([
    'ModifyRsbuildConfig',
    'ModifyEnvironmentConfig',
    'ModifyBundlerChain',
    'ModifyBundlerConfig',
    'BeforeCreateCompiler',
    'AfterCreateCompiler',
    'BeforeBuild',
    'BeforeEnvironmentCompile',
    'ModifyHTMLTags',
    'ModifyHTML',
    'AfterEnvironmentCompile',
    'AfterBuild',
    'CloseBuild',
  ]);
});

test('should run plugin hooks correctly when running build and mode is development', async ({
  build,
}) => {
  const { plugin, hooks } = recordPluginHooks();
  const rsbuild = await build({
    config: {
      mode: 'development',
      plugins: [plugin],
    },
  });

  await rsbuild.close();

  expect(hooks).toEqual([
    'ModifyRsbuildConfig',
    'ModifyEnvironmentConfig',
    'ModifyBundlerChain',
    'ModifyBundlerConfig',
    'BeforeCreateCompiler',
    'AfterCreateCompiler',
    'BeforeBuild',
    'BeforeEnvironmentCompile',
    'ModifyHTMLTags',
    'ModifyHTML',
    'AfterEnvironmentCompile',
    'AfterBuild',
    'CloseBuild',
  ]);
});

test('should run plugin hooks correctly when running startDevServer', async ({
  dev,
}) => {
  const { plugin, hooks } = recordPluginHooks();
  const rsbuild = await dev({
    config: {
      plugins: [plugin],
    },
  });

  await rsbuild.close();

  expect(hooks.filter((name) => name.includes('DevServer'))).toEqual([
    'BeforeStartDevServer',
    'AfterStartDevServer',
    'CloseDevServer',
  ]);

  // compile is async, so the execution order of AfterStartDevServer and the compile hooks is uncertain
  expect(hooks.filter((name) => name !== 'AfterStartDevServer')).toEqual([
    'ModifyRsbuildConfig',
    'ModifyEnvironmentConfig',
    'BeforeStartDevServer',
    'ModifyBundlerChain',
    'ModifyBundlerConfig',
    'BeforeCreateCompiler',
    'AfterCreateCompiler',
    'BeforeDevCompile',
    'BeforeEnvironmentCompile',
    'ModifyHTMLTags',
    'ModifyHTML',
    'AfterEnvironmentCompile',
    'AfterDevCompile',
    'DevCompileDone',
    'CloseDevServer',
  ]);
});

test('should run plugin hooks correctly when running preview', async () => {
  const { plugin, hooks } = recordPluginHooks();
  const rsbuild = await createRsbuild({
    cwd: import.meta.dirname,
    config: {
      plugins: [plugin],
    },
  });

  const result = await rsbuild.preview({
    checkDistDir: false,
  });

  await result.server.close();

  expect(hooks).toEqual([
    'ModifyRsbuildConfig',
    'ModifyEnvironmentConfig',
    'BeforeStartPreviewServer',
    'AfterStartPreviewServer',
  ]);
});

test('should close dev server when onAfterStartDevServer throws', async () => {
  const port = await getRandomPort();
  let devServer: RsbuildDevServer | undefined;
  let closeHookCalled = false;
  const plugin: RsbuildPlugin = {
    name: 'throw-in-after-start-dev-server',
    setup(api) {
      api.onBeforeStartDevServer(({ server }) => {
        devServer = server;
      });
      api.onAfterStartDevServer(() => {
        throw new Error('Failed to start dev server');
      });
      api.onCloseDevServer(() => {
        closeHookCalled = true;
      });
    },
  };
  const rsbuild = await createRsbuild({
    cwd: import.meta.dirname,
    config: {
      server: { host: HOST, port },
      plugins: [plugin],
    },
  });

  try {
    await expect(
      rsbuild.startDevServer({ getPortSilently: true }),
    ).rejects.toThrow('Failed to start dev server');
    expect(closeHookCalled).toBe(true);
    await expectPortAvailable(port);
  } finally {
    await devServer?.close();
  }
});

test('should close preview server when onAfterStartPreviewServer throws', async () => {
  const port = await getRandomPort();
  let previewServer: RsbuildPreviewServer | undefined;
  const plugin: RsbuildPlugin = {
    name: 'throw-in-after-start-preview-server',
    setup(api) {
      api.onBeforeStartPreviewServer(({ server }) => {
        previewServer = server;
      });
      api.onAfterStartPreviewServer(() => {
        throw new Error('Failed to start preview server');
      });
    },
  };
  const rsbuild = await createRsbuild({
    cwd: import.meta.dirname,
    config: {
      server: { host: HOST, port },
      plugins: [plugin],
    },
  });

  try {
    await expect(
      rsbuild.preview({ checkDistDir: false, getPortSilently: true }),
    ).rejects.toThrow('Failed to start preview server');
    await expectPortAvailable(port);
  } finally {
    await previewServer?.close();
  }
});
