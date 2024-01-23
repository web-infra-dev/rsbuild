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
    api.onBeforeStartDevServer(() => write('BeforeStartDevServer'));
    api.onAfterStartDevServer(() => write('AfterStartDevServer'));
    api.onBeforeCreateCompiler(() => write('BeforeCreateCompiler'));
    api.onAfterCreateCompiler(() => write('AfterCreateCompiler'));
    api.onBeforeBuild(() => write('BeforeBuild'));
    api.onAfterBuild(() => write('AfterBuild'));
    api.onBeforeStartProdServer(() => write('BeforeStartProdServer'));
    api.onAfterStartProdServer(() => write('AfterStartProdServer'));
  },
};

test('should run plugin hooks correctly when running build and preview', async () => {
  fse.removeSync(distFile);

  const rsbuild = await createRsbuild({
    cwd: __dirname,
    rsbuildConfig: {
      plugins: [plugin],
    },
  });

  await rsbuild.build();
  const result = await rsbuild.preview();

  expect(fse.readFileSync(distFile, 'utf-8').split(',')).toEqual([
    'BeforeCreateCompiler',
    'AfterCreateCompiler',
    'BeforeBuild',
    'AfterBuild',
    'BeforeStartProdServer',
    'AfterStartProdServer',
  ]);

  await result.server.close();
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

  expect(fse.readFileSync(distFile, 'utf-8').split(',')).toEqual([
    'BeforeStartDevServer',
    'BeforeCreateCompiler',
    'AfterCreateCompiler',
    'AfterStartDevServer',
  ]);

  await result.server.close();
});
