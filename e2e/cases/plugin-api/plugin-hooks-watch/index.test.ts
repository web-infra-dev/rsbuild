import fs from 'node:fs';
import { join } from 'node:path';
import { expectFile, rm, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';
import { type RsbuildPlugin, createRsbuild } from '@rsbuild/core';
import fse from 'fs-extra';

const createPlugin = () => {
  const names: string[] = [];

  const plugin: RsbuildPlugin = {
    name: 'test-plugin',
    setup(api) {
      api.modifyRspackConfig(() => {
        names.push('ModifyBundlerConfig');
      });
      api.modifyWebpackChain(() => {
        names.push('ModifyBundlerConfig');
      });
      api.modifyRsbuildConfig(() => {
        names.push('ModifyRsbuildConfig');
      });
      api.modifyBundlerChain(() => {
        names.push('ModifyBundlerChain');
      });
      api.modifyHTMLTags((tags) => {
        names.push('ModifyHTMLTags');
        return tags;
      });
      api.onBeforeStartDevServer(() => {
        names.push('BeforeStartDevServer');
      });
      api.onAfterStartDevServer(() => {
        names.push('AfterStartDevServer');
      });
      api.onBeforeCreateCompiler(() => {
        names.push('BeforeCreateCompiler');
      });
      api.onAfterCreateCompiler(() => {
        names.push('AfterCreateCompiler');
      });
      api.onBeforeBuild(() => {
        names.push('BeforeBuild');
      });
      api.onAfterBuild(() => {
        names.push('AfterBuild');
      });
      api.onBeforeStartProdServer(() => {
        names.push('BeforeStartProdServer');
      });
      api.onCloseDevServer(() => {
        names.push('OnCloseDevServer');
      });
      api.onAfterStartProdServer(() => {
        names.push('AfterStartProdServer');
      });
      api.onDevCompileDone(() => {
        names.push('OnDevCompileDone');
      });
    },
  };

  return { plugin, names };
};

rspackOnlyTest(
  'should run plugin hooks correctly when running build with watch',
  async () => {
    const cwd = __dirname;
    fse.ensureDirSync(join(cwd, 'test-temp-src'));

    const filePath = join(cwd, 'test-temp-src', 'index.js');
    const distPath = join(cwd, 'dist/index.html');

    await rm(distPath);
    await fs.promises.writeFile(filePath, "console.log('1');");

    const { plugin, names } = createPlugin();
    const rsbuild = await createRsbuild({
      cwd: __dirname,
      rsbuildConfig: {
        plugins: [plugin],
        server: {
          printUrls: false,
        },
        source: {
          entry: {
            index: './test-temp-src/index.js',
          },
        },
        performance: {
          printFileSize: false,
        },
      },
    });

    const result = await rsbuild.build({ watch: true });
    await expectFile(distPath);

    await rm(distPath);
    await fs.promises.writeFile(filePath, "console.log('2');");
    await expectFile(distPath);

    expect(names).toEqual([
      'ModifyRsbuildConfig',
      'ModifyBundlerChain',
      'ModifyBundlerConfig',
      'BeforeCreateCompiler',
      'AfterCreateCompiler',
      'BeforeBuild',
      'ModifyHTMLTags',
      'AfterBuild',
      // below hooks should called when rebuild
      'BeforeBuild',
      'ModifyHTMLTags',
      'AfterBuild',
    ]);

    await result.close();
  },
);
