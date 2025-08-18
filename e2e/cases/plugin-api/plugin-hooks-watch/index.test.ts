import { join } from 'node:path';
import { build, recordPluginHooks, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';
import fse from 'fs-extra';

rspackOnlyTest(
  'should run plugin hooks correctly when running build with watch',
  async () => {
    const cwd = __dirname;
    const filePath = join(cwd, 'test-temp-src', 'index.js');
    await fse.outputFile(filePath, "console.log('1');");

    const { plugin, hooks } = recordPluginHooks();
    const rsbuild = await build({
      cwd: __dirname,
      watch: true,
      rsbuildConfig: {
        plugins: [plugin],
      },
    });

    // the first build
    await rsbuild.expectBuildEnd();
    rsbuild.clearLogs();

    // rebuild
    await fse.outputFile(filePath, "console.log('2');");
    await rsbuild.expectLog('building test-temp-src');
    await rsbuild.expectBuildEnd();

    expect(hooks.slice(0, 17)).toEqual([
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
      // The below hooks should be called when rebuilding
      'BeforeBuild',
      'BeforeEnvironmentCompile',
      'ModifyHTMLTags',
      'ModifyHTML',
      'AfterEnvironmentCompile',
    ]);
    await rsbuild.close();
  },
);
