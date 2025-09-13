import fs from 'node:fs';
import { join } from 'node:path';
import { expect, rspackTest } from '@e2e/helper';
import { pluginReact } from '@rsbuild/plugin-react';

const cwd = __dirname;

rspackTest(
  'Multiple environments HMR should work correctly',
  async ({ dev, page, context }) => {
    await fs.promises.cp(join(cwd, 'src'), join(cwd, 'test-temp-src'), {
      recursive: true,
    });

    const rsbuild = await dev({
      rsbuildConfig: {
        plugins: [pluginReact()],
        environments: {
          web: {
            source: {
              entry: {
                index: join(cwd, 'test-temp-src/index.ts'),
              },
            },
          },
          web1: {
            dev: {
              // When generating outputs for multiple web environments,
              // if assetPrefix is not added, file search conflicts will occur.
              assetPrefix: 'auto',
            },
            source: {
              entry: {
                main: join(cwd, 'test-temp-src/web1.js'),
              },
            },
            output: {
              distPath: {
                root: 'dist/web1',
                html: 'html1',
              },
            },
          },
        },
      },
    });

    const web1Page = await context.newPage();

    await web1Page.goto(`http://localhost:${rsbuild.port}/web1/html1/main`);

    const locator1 = web1Page.locator('#test');
    await expect(locator1).toHaveText('Hello Rsbuild (web1)!');

    const locator = page.locator('#test');
    await expect(locator).toHaveText('Hello Rsbuild!');
    await expect(locator).toHaveCSS('color', 'rgb(255, 0, 0)');

    const locatorKeep = page.locator('#test-keep');
    const keepNum = await locatorKeep.innerHTML();

    // web1 live reload correctly and should not trigger index update
    const web1JSPath = join(cwd, 'test-temp-src/web1.js');

    await fs.promises.writeFile(
      web1JSPath,
      fs.readFileSync(web1JSPath, 'utf-8').replace('(web1)', '(web1-new)'),
    );

    await expect(locator1).toHaveText('Hello Rsbuild (web1)!');
    expect(await locatorKeep.innerHTML()).toBe(keepNum);

    // index HMR correctly
    const appPath = join(cwd, 'test-temp-src/App.tsx');

    await fs.promises.writeFile(
      appPath,
      fs.readFileSync(appPath, 'utf-8').replace('Hello Rsbuild', 'Hello Test'),
    );

    await expect(locator).toHaveText('Hello Test!');

    // #test-keep should remain unchanged when app.tsx HMR
    expect(await locatorKeep.innerHTML()).toBe(keepNum);
  },
);
