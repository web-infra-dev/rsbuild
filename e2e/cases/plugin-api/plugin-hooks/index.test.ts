import path from 'node:path';
import { test, expect } from '@playwright/test';
import { type RsbuildPlugin, createRsbuild } from '@rsbuild/core';
import { fse } from '@rsbuild/shared';

const distFile = path.join(__dirname, 'node_modules/hooksTempFile');

const write = (str: string) => {
  let content: string;
  if (fse.existsSync(distFile)) {
    content = `${fse.readFileSync(distFile, 'utf-8')},${str}`;
  } else {
    content = str;
  }
  fse.outputFileSync(distFile, content);
};

const plugin: RsbuildPlugin = {
  name: 'test-plugin',
  setup(api) {
    api.modifyRspackConfig(() => write('ModifyBundlerConfig'));
    api.modifyWebpackChain(() => write('ModifyBundlerConfig'));
    api.modifyRsbuildConfig(() => write('ModifyRsbuildConfig'));
    api.modifyBundlerChain(() => write('ModifyBundlerChain'));
    api.onBeforeStartDevServer(() => write('BeforeStartDevServer'));
    api.onAfterStartDevServer(() => write('AfterStartDevServer'));
    api.onBeforeCreateCompiler(() => write('BeforeCreateCompiler'));
    api.onAfterCreateCompiler(() => write('AfterCreateCompiler'));
    api.onBeforeBuild(() => write('BeforeBuild'));
    api.onAfterBuild(() => write('AfterBuild'));
    api.onBeforeStartProdServer(() => write('BeforeStartProdServer'));
    api.onCloseDevServer(() => write('OnCloseDevServer'));
    api.onAfterStartProdServer(() => write('AfterStartProdServer'));
  },
};

test('should run plugin hooks correctly when running build', async () => {
  fse.removeSync(distFile);

  const rsbuild = await createRsbuild({
    cwd: __dirname,
    rsbuildConfig: {
      plugins: [plugin],
    },
  });

  await rsbuild.build();

  expect(fse.readFileSync(distFile, 'utf-8').split(',')).toEqual([
    'ModifyRsbuildConfig',
    'ModifyBundlerChain',
    'ModifyBundlerConfig',
    'BeforeCreateCompiler',
    'AfterCreateCompiler',
    'BeforeBuild',
    'AfterBuild',
  ]);
});

test('should run plugin hooks correctly when running startDevServer', async () => {
  fse.removeSync(distFile);

  const rsbuild = await createRsbuild({
    cwd: __dirname,
    rsbuildConfig: {
      plugins: [plugin],
    },
  });

  const result = await rsbuild.startDevServer();

  await result.server.close();

  expect(fse.readFileSync(distFile, 'utf-8').split(',')).toEqual([
    'ModifyRsbuildConfig',
    'BeforeStartDevServer',
    'ModifyBundlerChain',
    'ModifyBundlerConfig',
    'BeforeCreateCompiler',
    'AfterCreateCompiler',
    'AfterStartDevServer',
    'OnCloseDevServer',
  ]);
});

test('should run plugin hooks correctly when running preview', async () => {
  const rsbuild = await createRsbuild({
    cwd: __dirname,
    rsbuildConfig: {
      plugins: [plugin],
    },
  });

  fse.removeSync(distFile);
  const result = await rsbuild.preview();

  expect(fse.readFileSync(distFile, 'utf-8').split(',')).toEqual([
    'ModifyRsbuildConfig',
    'BeforeStartProdServer',
    'AfterStartProdServer',
  ]);

  await result.server.close();
});
